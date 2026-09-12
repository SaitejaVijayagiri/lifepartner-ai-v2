package com.lifepartner.ai;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;

public class NotificationRequestReceiver extends BroadcastReceiver {
    private static final String TAG = "NotifRequestReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String actionIntent = intent.getAction();
        if (actionIntent == null) return;

        String action = "accept";
        if ("com.lifepartner.ai.ACTION_DECLINE_REQUEST".equals(actionIntent)) {
            action = "decline";
        } else if (!"com.lifepartner.ai.ACTION_ACCEPT_REQUEST".equals(actionIntent)) {
            // Also check extra "action" if fired generically
            action = intent.getStringExtra("action");
            if (action == null) action = "accept";
        }

        String interactionId = intent.getStringExtra("interactionId");
        int notificationId = intent.getIntExtra("notificationId", 0);

        if (interactionId == null || interactionId.trim().isEmpty()) {
            Log.e(TAG, "No interactionId found in request intent");
            return;
        }

        Log.i(TAG, "Received request action: " + action + " for interaction: " + interactionId);

        // 1. Immediately dismiss the notification card
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null && notificationId != 0) {
            manager.cancel(notificationId);
        }

        // 2. Retrieve auth token
        SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
        String authToken = prefs.getString("auth_token", null);

        if (authToken == null || authToken.trim().isEmpty()) {
            Log.w(TAG, "No auth token available, queueing for when user session hydrates");
            OfflineSyncManager.queueOfflineRequest(context, interactionId, action);
            return;
        }

        // 3. Check connectivity
        if (!OfflineSyncManager.isNetworkAvailable(context)) {
            Log.i(TAG, "Device is offline. Storing action in offline queue.");
            OfflineSyncManager.queueOfflineRequest(context, interactionId, action);
            return;
        }

        // 4. Device is online: execute immediately on background thread
        final String finalAction = action;
        final PendingResult pendingResult = goAsync();

        new Thread(() -> {
            try {
                boolean success = OfflineSyncManager.executeRequestAction(interactionId, finalAction, authToken);
                if (success) {
                    String msg = "accept".equals(finalAction)
                            ? "Request accepted! 🎉"
                            : "Request declined ❌";
                    OfflineSyncManager.showToast(context, msg);
                    Log.i(TAG, "Action " + finalAction + " successfully sent for " + interactionId);
                } else {
                    Log.w(TAG, "Server returned error or timed out. Queueing offline.");
                    OfflineSyncManager.queueOfflineRequest(context, interactionId, finalAction);
                }
            } catch (Exception e) {
                Log.e(TAG, "Exception executing request action: ", e);
                OfflineSyncManager.queueOfflineRequest(context, interactionId, finalAction);
            } finally {
                pendingResult.finish();
            }
        }).start();
    }
}

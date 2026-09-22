package com.lifepartner.ai;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;

public class NotificationLikeReceiver extends BroadcastReceiver {
    private static final String TAG = "NotifLikeReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String messageId = intent.getStringExtra("messageId");
        int notificationId = intent.getIntExtra("notificationId", 0);
        String senderId = intent.getStringExtra("senderId");

        if (messageId == null) {
            Log.e(TAG, "No messageId found in Like intent");
            return;
        }

        // 1. Clear the notification immediately to feel responsive
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null && notificationId != 0) {
            notificationManager.cancel(notificationId);
        }

        // 2. Get Auth Token
        SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
        String authToken = prefs.getString("auth_token", null);

        if (authToken == null || authToken.trim().isEmpty() || authToken.equalsIgnoreCase("null")) {
            Log.w(TAG, "No auth token available to like message natively. Queueing offline.");
            OfflineSyncManager.queueOfflineLike(context, messageId);
            return;
        }

        // 3. Check connectivity
        if (!OfflineSyncManager.isNetworkAvailable(context)) {
            Log.i(TAG, "Device is offline. Queueing like for background sync.");
            OfflineSyncManager.queueOfflineLike(context, messageId);
            return;
        }

        // 4. Device is online: execute immediately on background thread
        final PendingResult pendingResult = goAsync();
        new Thread(() -> {
            try {
                boolean success = OfflineSyncManager.executeLikeMessage(messageId, authToken);
                if (success) {
                    Log.i(TAG, "Message liked successfully!");
                    OfflineSyncManager.showToast(context, "❤️ Liked");
                } else {
                    Log.w(TAG, "Server returned error liking message. Queueing offline.");
                    OfflineSyncManager.queueOfflineLike(context, messageId);
                }
            } catch (Exception e) {
                Log.e(TAG, "Exception liking message via Native HTTP. Queueing offline.", e);
                OfflineSyncManager.queueOfflineLike(context, messageId);
            } finally {
                pendingResult.finish();
            }
        }).start();
    }
}

package com.lifepartner.ai;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.RemoteInput;

public class NotificationReplyReceiver extends BroadcastReceiver {
    private static final String TAG = "ReplyReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("com.lifepartner.ai.ACTION_REPLY".equals(intent.getAction())) {
            CharSequence replyCharSequence = getMessageText(intent);
            String connId = intent.getStringExtra("connId");

            if (replyCharSequence != null && connId != null) {
                final String replyText = replyCharSequence.toString().trim();
                if (replyText.isEmpty()) return;

                Log.d(TAG, "Reply text received for partner: " + connId);

                // 1. Dismiss the notification immediately so the UI feels instantaneous
                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    manager.cancel(connId.hashCode());
                }

                // 2. Check auth token
                SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
                String authToken = prefs.getString("auth_token", null);

                if (authToken == null || authToken.trim().isEmpty()) {
                    Log.w(TAG, "No auth token in prefs. Queueing reply offline.");
                    OfflineSyncManager.queueOfflineReply(context, connId, replyText);
                    return;
                }

                // 3. Check connectivity
                if (!OfflineSyncManager.isNetworkAvailable(context)) {
                    Log.i(TAG, "Device is offline. Queueing reply for background sync.");
                    OfflineSyncManager.queueOfflineReply(context, connId, replyText);
                    return;
                }

                // 4. Device is online: execute immediately on background thread
                final PendingResult pendingResult = goAsync();
                new Thread(() -> {
                    try {
                        boolean success = OfflineSyncManager.executeSendReply(connId, replyText, authToken);
                        if (success) {
                            OfflineSyncManager.showToast(context, "Reply sent! 💬");
                            Log.i(TAG, "Reply delivered successfully to " + connId);
                        } else {
                            Log.w(TAG, "Server returned error sending reply. Queueing offline.");
                            OfflineSyncManager.queueOfflineReply(context, connId, replyText);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to send reply: ", e);
                        OfflineSyncManager.queueOfflineReply(context, connId, replyText);
                    } finally {
                        pendingResult.finish();
                    }
                }).start();
            }
        }
    }

    private CharSequence getMessageText(Intent intent) {
        Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
        if (remoteInput != null) {
            return remoteInput.getCharSequence("key_text_reply");
        }
        return null;
    }
}

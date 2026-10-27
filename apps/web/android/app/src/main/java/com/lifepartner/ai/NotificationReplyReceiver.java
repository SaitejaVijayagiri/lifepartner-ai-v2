package com.lifepartner.ai;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;

public class NotificationReplyReceiver extends BroadcastReceiver {
    private static final String TAG = "ReplyReceiver";
    private static final String CHANNEL_ID = "lifepartner_chat";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("com.lifepartner.ai.ACTION_REPLY".equals(intent.getAction())) {
            CharSequence replyCharSequence = getMessageText(intent);
            String connId = intent.getStringExtra("connId");
            String senderName = intent.getStringExtra("senderName");
            int notificationId = intent.getIntExtra("notificationId", connId != null ? connId.hashCode() : 0);

            if (replyCharSequence != null && connId != null) {
                final String replyText = replyCharSequence.toString().trim();
                if (replyText.isEmpty()) return;

                Log.d(TAG, "Reply text received for partner: " + connId + ", senderName: " + senderName);

                // Clear message history for this contact so the replied conversation resets
                SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
                prefs.edit().remove("chat_msg_history_" + connId).apply();

                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

                // 1. Immediately update notification with RemoteInput history to dismiss system progress spinner
                // and give instant visual feedback that the reply is being sent
                if (manager != null) {
                    try {
                        NotificationCompat.Builder inFlight = new NotificationCompat.Builder(context, CHANNEL_ID)
                                .setSmallIcon(R.drawable.ic_stat_notification)
                                .setContentTitle(senderName != null && !senderName.trim().isEmpty() ? senderName : "LifePartner AI")
                                .setContentText("Sending: " + replyText)
                                .setRemoteInputHistory(new CharSequence[]{replyText})
                                .setPriority(NotificationCompat.PRIORITY_LOW)
                                .setAutoCancel(true);
                        manager.notify(notificationId, inFlight.build());
                    } catch (Exception e) {
                        Log.w(TAG, "Could not update in-flight notification: " + e.getMessage());
                    }
                }

                // 2. Check auth token
                String authToken = prefs.getString("auth_token", null);

                if (authToken == null || authToken.trim().isEmpty() || authToken.equalsIgnoreCase("null")) {
                    Log.w(TAG, "No auth token in prefs. Queueing reply offline and launching chat.");
                    OfflineSyncManager.queueOfflineReply(context, connId, replyText);
                    OfflineSyncManager.showToast(context, "Opening LifePartner to complete reply 💬");

                    if (manager != null) {
                        manager.cancel(notificationId);
                    }

                    try {
                        Intent openIntent = new Intent(context, MainActivity.class);
                        openIntent.setPackage(context.getPackageName());
                        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        openIntent.putExtra("targetPath", "/chat/" + connId);
                        openIntent.setData(android.net.Uri.parse("lifepartner://chat/" + connId));
                        context.startActivity(openIntent);
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to launch MainActivity for reply: ", e);
                    }
                    return;
                }

                // 3. Check connectivity
                if (!OfflineSyncManager.isNetworkAvailable(context)) {
                    Log.i(TAG, "Device is offline. Queueing reply for background sync.");
                    OfflineSyncManager.queueOfflineReply(context, connId, replyText);
                    if (manager != null) {
                        try {
                            NotificationCompat.Builder queued = new NotificationCompat.Builder(context, CHANNEL_ID)
                                    .setSmallIcon(R.drawable.ic_stat_notification)
                                    .setContentTitle(senderName != null && !senderName.trim().isEmpty() ? senderName : "LifePartner AI")
                                    .setContentText("Reply queued (will send when online) 💬")
                                    .setRemoteInputHistory(new CharSequence[]{replyText})
                                    .setTimeoutAfter(3000)
                                    .setAutoCancel(true);
                            manager.notify(notificationId, queued.build());
                        } catch (Exception ignored) {}
                    }
                    return;
                }

                // 4. Device is online: execute immediately on background thread
                final PendingResult pendingResult = goAsync();
                new Thread(() -> {
                    try {
                        boolean success = OfflineSyncManager.executeSendReply(connId, replyText, authToken);
                        if (success) {
                            String displayName = (senderName != null && !senderName.trim().isEmpty()) ? senderName : "partner";
                            OfflineSyncManager.showToast(context, "Reply sent to " + displayName + "! 💬");
                            Log.i(TAG, "Reply delivered successfully to " + connId);

                            if (manager != null) {
                                try {
                                    NotificationCompat.Builder replied = new NotificationCompat.Builder(context, CHANNEL_ID)
                                            .setSmallIcon(R.drawable.ic_stat_notification)
                                            .setContentTitle(senderName != null && !senderName.trim().isEmpty() ? senderName : "LifePartner AI")
                                            .setContentText("Replied: " + replyText)
                                            .setRemoteInputHistory(new CharSequence[]{replyText})
                                            .setTimeoutAfter(2500)
                                            .setAutoCancel(true);
                                    manager.notify(notificationId, replied.build());
                                } catch (Exception ignored) {}
                            }
                        } else {
                            Log.w(TAG, "Server returned error sending reply. Queueing offline.");
                            OfflineSyncManager.queueOfflineReply(context, connId, replyText);
                            if (manager != null) {
                                manager.cancel(notificationId);
                            }
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to send reply: ", e);
                        OfflineSyncManager.queueOfflineReply(context, connId, replyText);
                        if (manager != null) {
                            manager.cancel(notificationId);
                        }
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

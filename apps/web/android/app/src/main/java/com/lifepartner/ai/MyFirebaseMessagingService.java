package com.lifepartner.ai;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "lifepartner_notifications";
    private static final String API_BASE = "https://lifepartner-ai.onrender.com";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM Token: " + token);

        SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
        prefs.edit().putString("fcm_token", token).apply();

        String authToken = prefs.getString("auth_token", null);
        if (authToken != null) {
            sendTokenToBackend(token, authToken);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", MODE_PRIVATE);
        boolean isPushDisabled = prefs.getBoolean("push_disabled", false);
        if (isPushDisabled) {
            Log.i("FCM", "Push notifications are disabled by the user. Ignoring.");
            return;
        }

        String title = "LifePartner AI";
        String body = "You have a new message";
        String senderPhotoUrl = null;
        String connId = null;

        Map<String, String> data = remoteMessage.getData();
        String messageId = null;
        if (data.size() > 0) {
            // Always prefer senderName as the notification title for chat messages
            String extractedSenderName = data.get("senderName");
            if (extractedSenderName != null && !extractedSenderName.isEmpty()) {
                title = extractedSenderName;
            } else {
                String dataTitle = data.get("title");
                if (dataTitle != null) title = dataTitle;
            }
            
            String dataBody = data.get("body");
            if (dataBody != null) body = dataBody;

            // Extract sender photo — route through backend proxy to bypass Supabase DNS block in India
            String rawPhoto = data.get("senderPhoto");
            if (rawPhoto != null && !rawPhoto.isEmpty()) {
                if (rawPhoto.contains("supabase")) {
                    // Proxy through backend to avoid India DNS block
                    senderPhotoUrl = "https://backend.lifepartnerai.in/photo/proxy?url=" + rawPhoto;
                } else {
                    senderPhotoUrl = rawPhoto;
                }
            }

            connId = data.get("senderId");
            messageId = data.get("messageId");
        }

        if (remoteMessage.getNotification() != null) {
            // Only use system notification fields if we didn't get senderName
            if (title.equals("LifePartner AI") && remoteMessage.getNotification().getTitle() != null)
                title = remoteMessage.getNotification().getTitle();
            if (body.equals("You have a new message") && remoteMessage.getNotification().getBody() != null)
                body = remoteMessage.getNotification().getBody();
        }

        // Fetch large icon synchronously since we are already on a background thread
        Bitmap largeIcon = null;
        if (senderPhotoUrl != null && !senderPhotoUrl.isEmpty()) {
            largeIcon = getBitmapFromURL(senderPhotoUrl);
        }

        showNotification(title, body, largeIcon, connId, messageId);
    }

    private Bitmap getBitmapFromURL(String src) {
        try {
            URL url = new URI(src).toURL();
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.connect();
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (Exception e) {
            Log.e(TAG, "Failed to download image", e);
            return null;
        }
    }

    private void showNotification(String title, String body, Bitmap largeIcon, String connId, String messageId) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        String CHANNEL_ID = "lifepartner_chat";
        // Compute notificationId once at method level so all places use the same value
        int notificationId = (connId != null) ? connId.hashCode() : (int) System.currentTimeMillis();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "LifePartner Notifications",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Match and message notifications");
            manager.createNotificationChannel(channel);
        }

        // 1. Regular Open-App Intent
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent,
                PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);

        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon);
        }

        // 2. Setup "Quick Reply" Action if this is a chat message (connId exists)
        if (connId != null && !connId.isEmpty()) {
            RemoteInput remoteInput = new RemoteInput.Builder("key_text_reply")
                    .setLabel("Type your reply...")
                    .build();

            Intent replyIntent = new Intent(this, NotificationReplyReceiver.class);
            replyIntent.setAction("com.lifepartner.ai.ACTION_REPLY");
            replyIntent.putExtra("connId", connId);
            
            PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
                    this,
                    connId.hashCode(),
                    replyIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
            );

            NotificationCompat.Action action = new NotificationCompat.Action.Builder(
                    android.R.drawable.ic_menu_send,
                    "Reply",
                    replyPendingIntent)
                    .addRemoteInput(remoteInput)
                    .build();

            builder.addAction(action);
        }

        // 3. Setup "Like" Action if messageId exists
        if (messageId != null && !messageId.isEmpty()) {
            Intent likeIntent = new Intent(this, NotificationLikeReceiver.class);
            likeIntent.setAction("com.lifepartner.ai.ACTION_LIKE");
            likeIntent.putExtra("messageId", messageId);
            likeIntent.putExtra("notificationId", notificationId); // use method-level var
            likeIntent.putExtra("senderId", connId);

            PendingIntent likePendingIntent = PendingIntent.getBroadcast(
                    this,
                    messageId.hashCode(),
                    likeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            NotificationCompat.Action likeAction = new NotificationCompat.Action.Builder(
                    0, // No icon
                    "❤️ Like",
                    likePendingIntent)
                    .build();

            builder.addAction(likeAction);
        }

        // Use method-level notificationId (same value used in Like intent above)
        manager.notify(notificationId, builder.build());
    }

    private void sendTokenToBackend(final String token, final String authToken) {
        new Thread(() -> {
            try {
                URL url = new URI(API_BASE + "/notifications/register").toURL();
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + authToken);
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                String payload = "{\"token\":\"" + token + "\",\"platform\":\"android\"}";
                byte[] input = payload.getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(input, 0, input.length);
                }

                conn.getResponseCode();
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to send token to backend: " + e.getMessage());
            }
        }).start();
    }

    public static void registerTokenWithBackend(Context context, String authToken) {
        SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
        
        if (prefs.getBoolean("push_disabled", false)) {
            return; // Abort, user disabled pushes permanently
        }

        prefs.edit().putString("auth_token", authToken).apply();

        String fcmToken = prefs.getString("fcm_token", null);
        if (fcmToken != null) {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                .addOnSuccessListener(token -> {
                    prefs.edit().putString("fcm_token", token).apply();
                    new Thread(() -> {
                        try {
                            URL url = new URI(API_BASE + "/notifications/register").toURL();
                            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("POST");
                            conn.setRequestProperty("Content-Type", "application/json");
                            conn.setRequestProperty("Authorization", "Bearer " + authToken);
                            conn.setDoOutput(true);
                            conn.setConnectTimeout(10000);
                            String payload = "{\"token\":\"" + token + "\",\"platform\":\"android\"}";
                            byte[] input = payload.getBytes(StandardCharsets.UTF_8);
                            try (OutputStream os = conn.getOutputStream()) {
                                os.write(input, 0, input.length);
                            }
                            conn.getResponseCode();
                            conn.disconnect();
                        } catch (Exception e) {}
                    }).start();
                });
        }
    }
}

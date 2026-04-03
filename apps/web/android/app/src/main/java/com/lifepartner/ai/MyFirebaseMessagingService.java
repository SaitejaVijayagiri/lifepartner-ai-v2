package com.lifepartner.ai;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "lifepartner_notifications";
    private static final String API_BASE = "https://lifepartner-ai.onrender.com";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM Token: " + token);

        // Save token locally
        SharedPreferences prefs = getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
        prefs.edit().putString("fcm_token", token).apply();

        // Send token to backend (on background thread)
        String authToken = prefs.getString("auth_token", null);
        if (authToken != null) {
            sendTokenToBackend(token, authToken);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "Message received from: " + remoteMessage.getFrom());

        String title = "LifePartner AI";
        String body = "You have a new message";

        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        } else if (remoteMessage.getData().size() > 0) {
            title = remoteMessage.getData().getOrDefault("title", title);
            body = remoteMessage.getData().getOrDefault("body", body);
        }

        showNotification(title, body);
    }

    private void showNotification(String title, String body) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Create notification channel (required for Android 8+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "LifePartner Notifications",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Match and message notifications");
            manager.createNotificationChannel(channel);
        }

        // Intent to open app when notification is tapped
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

        manager.notify((int) System.currentTimeMillis(), builder.build());
    }

    private void sendTokenToBackend(final String token, final String authToken) {
        new Thread(() -> {
            try {
                URL url = new URL(API_BASE + "/notifications/register");
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

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Token registration response: " + responseCode);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to send token to backend: " + e.getMessage());
            }
        }).start();
    }

    /**
     * Called from MainActivity after login to register auth token and send FCM token to backend.
     */
    public static void registerTokenWithBackend(Context context, String authToken) {
        SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
        prefs.edit().putString("auth_token", authToken).apply();

        String fcmToken = prefs.getString("fcm_token", null);
        if (fcmToken != null) {
            // Token already exists - send it immediately
            com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                .addOnSuccessListener(token -> {
                    prefs.edit().putString("fcm_token", token).apply();
                    // Fire off HTTP request on background thread
                    new Thread(() -> {
                        try {
                            URL url = new URL(API_BASE + "/notifications/register");
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
                        } catch (Exception e) {
                            Log.e(TAG, "registerTokenWithBackend error: " + e.getMessage());
                        }
                    }).start();
                });
        }
    }
}

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
    private static final String API_BASE = BuildConfig.API_BASE_URL;

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
        String type = null;
        String bannerUrl = null;
        String campaignNotificationId = null;

        Map<String, String> data = remoteMessage.getData();
        String messageId = null;
        if (data.size() > 0) {
            type = data.get("type");
            bannerUrl = data.get("bannerUrl");
            campaignNotificationId = data.get("notificationId");

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
                    String base = API_BASE.endsWith("/") ? API_BASE.substring(0, API_BASE.length() - 1) : API_BASE;
                    senderPhotoUrl = base + "/photo/proxy?url=" + rawPhoto;
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
        
        // Fallback to app logo if largeIcon is not loaded (shows logo on re-engagement pushes!)
        if (largeIcon == null) {
            largeIcon = getBitmapFromURL("https://lifepartnerai.in/icon.png");
        }

        // Fetch banner image if present
        Bitmap bannerBitmap = null;
        if (bannerUrl != null && !bannerUrl.isEmpty()) {
            bannerBitmap = getBitmapFromURL(bannerUrl);
        }

        showNotification(title, body, largeIcon, connId, messageId, type, bannerBitmap, campaignNotificationId);
    }

    private Bitmap getBitmapFromURL(String src) {
        try {
            int redirectLimit = 5;
            String currentUrl = src;
            HttpURLConnection connection = null;
            
            while (redirectLimit-- > 0) {
                URL url = new URI(currentUrl).toURL();
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                connection.setInstanceFollowRedirects(true);
                
                int status = connection.getResponseCode();
                if (status == HttpURLConnection.HTTP_MOVED_TEMP || 
                    status == HttpURLConnection.HTTP_MOVED_PERM || 
                    status == 307 || status == 308) {
                    
                    String newUrl = connection.getHeaderField("Location");
                    if (newUrl != null) {
                        currentUrl = newUrl;
                        connection.disconnect();
                        continue;
                    }
                }
                break;
            }
            
            if (connection == null) return null;
            InputStream input = connection.getInputStream();
            Bitmap bitmap = BitmapFactory.decodeStream(input);
            connection.disconnect();
            return bitmap;
        } catch (Exception e) {
            Log.e(TAG, "Failed to download image: " + src, e);
            return null;
        }
    }

    private void showNotification(
            String title, 
            String body, 
            Bitmap largeIcon, 
            String connId, 
            String messageId, 
            String type, 
            Bitmap bannerBitmap, 
            String campaignNotificationId
    ) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        String CHANNEL_ID = "lifepartner_chat";
        // Compute notificationId once at method level so all places use the same value
        int notificationId = (connId != null) 
            ? connId.hashCode() 
            : ((campaignNotificationId != null) ? campaignNotificationId.hashCode() : (int) System.currentTimeMillis());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    "lifepartner_chat",
                    "Chat Messages",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Direct messages and match alerts");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{100, 200, 300, 400, 500});
            channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
            channel.setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes);

            manager.createNotificationChannel(channel);

            // Create fallback alias channel for backend compatibility
            NotificationChannel aliasChannel = new NotificationChannel(
                    "chat_messages",
                    "Chat Messages",
                    NotificationManager.IMPORTANCE_HIGH
            );
            aliasChannel.setDescription("Direct messages and match alerts");
            aliasChannel.enableVibration(true);
            aliasChannel.setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI, audioAttributes);
            aliasChannel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(aliasChannel);
        }

        // 1. Regular Open-App Intent with deep link pathing
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.setAction(Intent.ACTION_VIEW);
        
        String deepLinkUrl = "https://lifepartnerai.in/dashboard?tab=matches";
        if (campaignNotificationId != null) {
            deepLinkUrl += "&notificationId=" + campaignNotificationId + "&action=notification_body";
        }
        intent.setData(android.net.Uri.parse(deepLinkUrl));

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 
                notificationId, 
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, "lifepartner_chat")
                .setSmallIcon(R.drawable.ic_stat_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI)
                .setVibrate(new long[]{100, 200, 300, 400, 500})
                .setContentIntent(pendingIntent);

        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon);
        }

        if (bannerBitmap != null) {
            builder.setStyle(new NotificationCompat.BigPictureStyle()
                    .bigPicture(bannerBitmap)
                    .bigLargeIcon((Bitmap) null)); // Hide large icon in expanded view
        }

        // 2. Setup Witty Campaign Action Buttons
        if ("witty_reengagement".equals(type) && campaignNotificationId != null) {
            // Button 1: Swipe Matches 🔍
            Intent matchesIntent = new Intent(this, MainActivity.class);
            matchesIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            matchesIntent.setAction(Intent.ACTION_VIEW);
            matchesIntent.setData(android.net.Uri.parse("https://lifepartnerai.in/dashboard?tab=matches&notificationId=" + campaignNotificationId + "&action=find_matches"));
            PendingIntent matchesPendingIntent = PendingIntent.getActivity(
                    this,
                    campaignNotificationId.hashCode() + 1,
                    matchesIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            builder.addAction(0, "Swipe Matches 🔍", matchesPendingIntent);

            // Button 2: Ask Love Guru 🤖
            Intent guruIntent = new Intent(this, MainActivity.class);
            guruIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            guruIntent.setAction(Intent.ACTION_VIEW);
            guruIntent.setData(android.net.Uri.parse("https://lifepartnerai.in/dashboard?tab=matches&openGuru=true&notificationId=" + campaignNotificationId + "&action=love_guru"));
            PendingIntent guruPendingIntent = PendingIntent.getActivity(
                    this,
                    campaignNotificationId.hashCode() + 2,
                    guruIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            builder.addAction(0, "Ask Love Guru 🤖", guruPendingIntent);
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

                org.json.JSONObject payloadObj = new org.json.JSONObject();
                payloadObj.put("token", token);
                payloadObj.put("platform", "android");
                byte[] input = payloadObj.toString().getBytes(StandardCharsets.UTF_8);
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
        if (authToken == null || authToken.trim().isEmpty() || authToken.equalsIgnoreCase("null")) {
            Log.w(TAG, "registerTokenWithBackend: Skipped because authToken is invalid or empty.");
            return;
        }

        SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
        
        if (prefs.getBoolean("push_disabled", false)) {
            return; // Abort, user disabled pushes permanently
        }

        prefs.edit().putString("auth_token", authToken).apply();

        com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
            .addOnSuccessListener(token -> {
                if (token == null || token.isEmpty()) return;
                prefs.edit().putString("fcm_token", token).apply();
                new Thread(() -> {
                    try {
                        String cleanBase = API_BASE.endsWith("/") ? API_BASE.substring(0, API_BASE.length() - 1) : API_BASE;
                        URL url = new URI(cleanBase + "/notifications/register").toURL();
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        String authHeader = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
                        conn.setRequestProperty("Authorization", authHeader);
                        conn.setDoOutput(true);
                        conn.setConnectTimeout(10000);
                        org.json.JSONObject payloadObj2 = new org.json.JSONObject();
                        payloadObj2.put("token", token);
                        payloadObj2.put("platform", "android");
                        String payload = payloadObj2.toString();
                        byte[] input = payload.getBytes(StandardCharsets.UTF_8);
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(input, 0, input.length);
                        }
                        int responseCode = conn.getResponseCode();
                        Log.d(TAG, "Token registration response: " + responseCode);
                        conn.disconnect();
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to send FCM token to backend: ", e);
                    }
                }).start();
            }).addOnFailureListener(e -> {
                Log.e(TAG, "Failed to retrieve FCM token from Firebase: ", e);
            });
    }
}

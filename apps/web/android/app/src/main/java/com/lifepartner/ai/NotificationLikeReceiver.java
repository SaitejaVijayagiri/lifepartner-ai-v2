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

        // 1. Get Auth Token
        SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
        String authToken = prefs.getString("auth_token", null);

        if (authToken == null) {
            Log.e(TAG, "No auth token available to like message natively");
            return;
        }

        // 2. Clear the notification immediately to feel responsive
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null && notificationId != 0) {
            notificationManager.cancel(notificationId);
        }

        // 3. Keep the BroadcastReceiver alive until the network request finishes
        final PendingResult pendingResult = goAsync();

        // 4. Send the HTTP POST Request in the background
        new Thread(() -> {
            try {
                String apiUrl = BuildConfig.API_BASE_URL + "/messages/" + messageId + "/like";
                URL url = new URI(apiUrl).toURL();
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Authorization", "Bearer " + authToken);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);

                int responseCode = conn.getResponseCode();

                if (responseCode == 200 || responseCode == 201) {
                    Log.i(TAG, "Message liked successfully!");
                    // Optional visual feedback
                    new Handler(Looper.getMainLooper()).post(() -> {
                        Toast.makeText(context, "❤️ Liked", Toast.LENGTH_SHORT).show();
                    });
                } else {
                    Log.e(TAG, "Failed to like message. Response Code: " + responseCode);
                }
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Exception liking message via Native HTTP", e);
            } finally {
                // Must call finish so the OS knows we are done
                pendingResult.finish();
            }
        }).start();
    }
}

package com.lifepartner.ai;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.RemoteInput;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class NotificationReplyReceiver extends BroadcastReceiver {
    private static final String TAG = "ReplyReceiver";
    private static final String API_BASE = "https://lifepartner-ai.onrender.com";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("com.lifepartner.ai.ACTION_REPLY".equals(intent.getAction())) {
            CharSequence replyText = getMessageText(intent);
            String connId = intent.getStringExtra("connId");

            if (replyText != null && connId != null) {
                Log.d(TAG, "Reply received for " + connId + ": " + replyText);
                
                SharedPreferences prefs = context.getSharedPreferences("LifePartnerPrefs", Context.MODE_PRIVATE);
                String authToken = prefs.getString("auth_token", null);

                if (authToken != null) {
                    sendReplyToBackend(context, connId, replyText.toString(), authToken);
                }
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

    private void sendReplyToBackend(Context context, String connId, String text, String authToken) {
        new Thread(() -> {
            try {
                URL url = new URL(API_BASE + "/messages/" + connId + "/send");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + authToken);
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);

                String payload = "{\"text\":\"" + text + "\"}";
                byte[] input = payload.getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Reply sent with response: " + responseCode);
                
                if (responseCode >= 200 && responseCode < 300) {
                    // Automatically dismiss notification when sent
                    NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                    manager.cancel(connId.hashCode());
                }

                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to send reply: " + e.getMessage());
            }
        }).start();
    }
}

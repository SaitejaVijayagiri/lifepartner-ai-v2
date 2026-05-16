package com.lifepartner.ai;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.RemoteInput;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class NotificationReplyReceiver extends BroadcastReceiver {
    private static final String TAG = "ReplyReceiver";
    private static final String API_BASE = BuildConfig.API_BASE_URL;

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("com.lifepartner.ai.ACTION_REPLY".equals(intent.getAction())) {
            CharSequence replyText = getMessageText(intent);
            String connId = intent.getStringExtra("connId");

            if (replyText != null && connId != null) {
                Log.d(TAG, "Reply received for " + connId);

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
                // Use JSONObject to safely encode the payload (avoids quote/backslash injection)
                JSONObject payload = new JSONObject();
                payload.put("text", text);

                URL url = new URI(API_BASE + "/messages/" + connId + "/send").toURL();
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                conn.setRequestProperty("Authorization", "Bearer " + authToken);
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                Log.d(TAG, "Reply sent, response: " + responseCode);

                if (responseCode >= 200 && responseCode < 300) {
                    NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                    if (manager != null) {
                        manager.cancel(connId.hashCode());
                    }
                }

                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to send reply: " + e.getMessage());
            }
        }).start();
    }
}

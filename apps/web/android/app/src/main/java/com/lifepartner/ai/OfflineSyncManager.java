package com.lifepartner.ai;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class OfflineSyncManager {
    private static final String TAG = "OfflineSyncManager";
    private static final String PREFS_NAME = "LifePartnerPrefs";
    private static final String KEY_OFFLINE_REQUESTS = "offline_pending_requests";
    private static final String KEY_OFFLINE_REPLIES = "offline_pending_replies";
    private static final String API_BASE = BuildConfig.API_BASE_URL;

    private static final Handler mainHandler = new Handler(Looper.getMainLooper());

    public static boolean isNetworkAvailable(Context context) {
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.net.Network activeNetwork = cm.getActiveNetwork();
                if (activeNetwork == null) return false;
                NetworkCapabilities capabilities = cm.getNetworkCapabilities(activeNetwork);
                return capabilities != null && (
                        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
                );
            } else {
                android.net.NetworkInfo info = cm.getActiveNetworkInfo();
                return info != null && info.isConnected();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking network availability: ", e);
            return false;
        }
    }

    public static void showToast(Context context, String message) {
        mainHandler.post(() -> {
            try {
                Toast.makeText(context.getApplicationContext(), message, Toast.LENGTH_SHORT).show();
            } catch (Exception ignored) {}
        });
    }

    // ==========================================
    // 1. FRIEND / INTEREST REQUEST OFFLINE QUEUE
    // ==========================================

    public static synchronized void queueOfflineRequest(Context context, String interactionId, String action) {
        if (interactionId == null || action == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existingJson = prefs.getString(KEY_OFFLINE_REQUESTS, "[]");
            JSONArray array = new JSONArray(existingJson);

            JSONObject item = new JSONObject();
            item.put("interactionId", interactionId);
            item.put("action", action);
            item.put("timestamp", System.currentTimeMillis());

            array.put(item);
            prefs.edit().putString(KEY_OFFLINE_REQUESTS, array.toString()).apply();
            Log.i(TAG, "Queued offline request action: " + action + " for " + interactionId);

            String feedback = "accept".equals(action)
                    ? "Connected (will sync when online) 💖"
                    : "Passed for now (will sync when online)";
            showToast(context, feedback);
        } catch (Exception e) {
            Log.e(TAG, "Failed to queue offline request: ", e);
        }
    }

    // ==========================================
    // 2. QUICK REPLY OFFLINE QUEUE
    // ==========================================

    public static synchronized void queueOfflineReply(Context context, String connId, String text) {
        if (connId == null || text == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String existingJson = prefs.getString(KEY_OFFLINE_REPLIES, "[]");
            JSONArray array = new JSONArray(existingJson);

            JSONObject item = new JSONObject();
            item.put("connId", connId);
            item.put("text", text);
            item.put("timestamp", System.currentTimeMillis());

            array.put(item);
            prefs.edit().putString(KEY_OFFLINE_REPLIES, array.toString()).apply();
            Log.i(TAG, "Queued offline reply for " + connId);

            showToast(context, "Reply queued (will send when online) 💬");
        } catch (Exception e) {
            Log.e(TAG, "Failed to queue offline reply: ", e);
        }
    }

    // ==========================================
    // 3. FLUSH ALL PENDING ACTIONS
    // ==========================================

    public static void flushPendingActions(Context context) {
        if (!isNetworkAvailable(context)) {
            Log.d(TAG, "Cannot flush actions: network unavailable");
            return;
        }

        new Thread(() -> {
            try {
                SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String authToken = prefs.getString("auth_token", null);
                if (authToken == null || authToken.trim().isEmpty()) {
                    Log.d(TAG, "Cannot flush offline actions: missing auth token");
                    return;
                }

                // A. Drain Pending Requests
                drainPendingRequests(context, prefs, authToken);

                // B. Drain Pending Replies
                drainPendingReplies(context, prefs, authToken);
            } catch (Exception e) {
                Log.e(TAG, "Error in flushPendingActions: ", e);
            }
        }).start();
    }

    private static synchronized void drainPendingRequests(Context context, SharedPreferences prefs, String authToken) {
        try {
            String jsonStr = prefs.getString(KEY_OFFLINE_REQUESTS, "[]");
            JSONArray array = new JSONArray(jsonStr);
            if (array.length() == 0) return;

            Log.i(TAG, "Draining " + array.length() + " offline request actions...");
            JSONArray remaining = new JSONArray();

            for (int i = 0; i < array.length(); i++) {
                JSONObject item = array.getJSONObject(i);
                String interactionId = item.getString("interactionId");
                String action = item.getString("action");

                boolean success = executeRequestAction(interactionId, action, authToken);
                if (!success) {
                    remaining.put(item);
                } else {
                    Log.i(TAG, "Successfully synced offline request action: " + action + " for " + interactionId);
                }
            }

            prefs.edit().putString(KEY_OFFLINE_REQUESTS, remaining.toString()).apply();
            if (remaining.length() < array.length()) {
                showToast(context, "Synced match request actions ✓");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error draining pending requests: ", e);
        }
    }

    private static synchronized void drainPendingReplies(Context context, SharedPreferences prefs, String authToken) {
        try {
            String jsonStr = prefs.getString(KEY_OFFLINE_REPLIES, "[]");
            JSONArray array = new JSONArray(jsonStr);
            if (array.length() == 0) return;

            Log.i(TAG, "Draining " + array.length() + " offline replies...");
            JSONArray remaining = new JSONArray();

            for (int i = 0; i < array.length(); i++) {
                JSONObject item = array.getJSONObject(i);
                String connId = item.getString("connId");
                String text = item.getString("text");

                boolean success = executeSendReply(connId, text, authToken);
                if (!success) {
                    remaining.put(item);
                } else {
                    Log.i(TAG, "Successfully synced offline reply for " + connId);
                }
            }

            prefs.edit().putString(KEY_OFFLINE_REPLIES, remaining.toString()).apply();
            if (remaining.length() < array.length()) {
                showToast(context, "Queued replies delivered 💬");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error draining pending replies: ", e);
        }
    }

    public static boolean executeRequestAction(String interactionId, String action, String authToken) {
        try {
            String cleanBase = API_BASE.endsWith("/") ? API_BASE.substring(0, API_BASE.length() - 1) : API_BASE;
            URL url = new URI(cleanBase + "/interactions/requests/" + interactionId + "/" + action).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            String authHeader = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
            conn.setRequestProperty("Authorization", authHeader);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setDoOutput(false);

            int code = conn.getResponseCode();
            conn.disconnect();
            return (code >= 200 && code < 300);
        } catch (Exception e) {
            Log.w(TAG, "Failed to execute request action " + action + ": " + e.getMessage());
            return false;
        }
    }

    public static boolean executeSendReply(String connId, String text, String authToken) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("text", text);

            String cleanBase = API_BASE.endsWith("/") ? API_BASE.substring(0, API_BASE.length() - 1) : API_BASE;
            URL url = new URI(cleanBase + "/messages/" + connId + "/send").toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            String authHeader = authToken.startsWith("Bearer ") ? authToken : "Bearer " + authToken;
            conn.setRequestProperty("Authorization", authHeader);
            conn.setDoOutput(true);
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);

            byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            conn.disconnect();
            return (code >= 200 && code < 300);
        } catch (Exception e) {
            Log.w(TAG, "Failed to execute send reply: " + e.getMessage());
            return false;
        }
    }
}

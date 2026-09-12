const { prisma } = require('../dist/prisma');
const webpush = require('web-push');
const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function deepTest() {
    console.log("======================================");
    console.log("   DEEP PUSH PROVIDER ERROR AUDIT     ");
    console.log("======================================");

    // 1. Check ENV variables
    console.log("FIREBASE_SERVICE_ACCOUNT exists:", !!process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("VAPID_PUBLIC_KEY exists:", !!process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PUBLIC_KEY ? process.env.VAPID_PUBLIC_KEY.substring(0, 20) + '...' : '');
    console.log("VAPID_PRIVATE_KEY exists:", !!process.env.VAPID_PRIVATE_KEY);
    console.log("ONESIGNAL_APP_ID:", process.env.ONESIGNAL_APP_ID);
    console.log("ONESIGNAL_REST_API_KEY exists:", !!process.env.ONESIGNAL_REST_API_KEY);

    // 2. Test OneSignal directly
    console.log("\n--- TESTING ONESIGNAL DIRECTLY ---");
    try {
        const osRes = await axios.post(
            'https://onesignal.com/api/v1/notifications',
            {
                app_id: process.env.ONESIGNAL_APP_ID,
                include_aliases: {
                    external_id: ['11bb21c2-f430-4349-a059-8f5764e3fd4e'] // Sunny
                },
                target_channel: 'push',
                headings: { en: "Test OneSignal" },
                contents: { en: "Testing direct OneSignal push" },
                url: "https://lifepartnerai.in/dashboard"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
                }
            }
        );
        console.log("OneSignal Response Status:", osRes.status);
        console.log("OneSignal Response Data:", JSON.stringify(osRes.data, null, 2));
    } catch (osErr) {
        console.error("OneSignal Error:", osErr.response ? { status: osErr.response.status, data: osErr.response.data } : osErr.message);
    }

    // 3. Test FCM Multicast directly with Sunny's token
    console.log("\n--- TESTING FCM DIRECTLY ---");
    const sunnyTokens = await prisma.device_tokens.findMany({
        where: { user_id: '11bb21c2-f430-4349-a059-8f5764e3fd4e', platform: 'web' }
    });
    for (const t of sunnyTokens) {
        console.log("Testing FCM token:", t.token.substring(0, 30) + "...");
        try {
            const fcmRes = await admin.messaging().sendEachForMulticast({
                tokens: [t.token],
                notification: { title: "Test FCM", body: "Direct FCM test" }
            });
            console.log("FCM response successCount:", fcmRes.successCount, "failureCount:", fcmRes.failureCount);
            if (fcmRes.responses && fcmRes.responses[0]?.error) {
                console.error("FCM Error Code:", fcmRes.responses[0].error.code);
                console.error("FCM Error Message:", fcmRes.responses[0].error.message);
            }
        } catch (fcmErr) {
            console.error("FCM Send Exception:", fcmErr);
        }
    }

    // 4. Test WebPush directly
    console.log("\n--- TESTING WEBPUSH DIRECTLY ---");
    const webpushTokens = await prisma.device_tokens.findMany({
        where: { platform: 'webpush' }
    });
    console.log("Found", webpushTokens.length, "total webpush tokens in DB");
    if (webpushTokens.length > 0) {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:support@lifepartnerai.in',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
        for (const wt of webpushTokens.slice(0, 3)) {
            try {
                const sub = JSON.parse(wt.token);
                console.log("Testing WebPush endpoint:", sub.endpoint ? sub.endpoint.substring(0, 50) + "..." : "invalid");
                const wpRes = await webpush.sendNotification(sub, JSON.stringify({ title: "Test WebPush", body: "Direct test" }));
                console.log("WebPush Success status:", wpRes.statusCode);
            } catch (wpErr) {
                console.error("WebPush Error Status:", wpErr.statusCode);
                console.error("WebPush Error Headers:", wpErr.headers);
                console.error("WebPush Error Body:", wpErr.body);
            }
        }
    }
}

deepTest().finally(() => process.exit(0));

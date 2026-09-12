const { prisma } = require('../dist/prisma');
const { NotificationService } = require('../dist/services/notification');
const { OneSignalService } = require('../dist/services/OneSignalService');
const { WebPushService } = require('../dist/services/WebPushService');

async function diagnose() {
    console.log("==================================================");
    console.log("   DIAGNOSING PUSH NOTIFICATIONS FOR SUNNY & SWETHA");
    console.log("==================================================");

    const users = await prisma.users.findMany({
        where: {
            email: { in: ['saitejavijayagiri@gmail.com', 'saitejavijayagiri123@gmail.com'] }
        },
        include: {
            profiles: true,
            device_tokens: true
        }
    });

    for (const u of users) {
        console.log("\n--------------------------------------------------");
        console.log("USER:", u.full_name, "| Email:", u.email, "| ID:", u.id);
        const meta = u.profiles?.metadata || {};
        console.log("push_notifications_enabled:", meta.push_notifications_enabled);
        console.log("notifications_enabled:", meta.notifications_enabled);
        console.log("muted_users:", meta.muted_users);
        console.log("Device Tokens Count:", u.device_tokens.length);

        u.device_tokens.forEach((dt, i) => {
            console.log("  Token " + (i + 1) + ":");
            console.log("    Platform:", dt.platform);
            console.log("    Created:", dt.created_at);
            console.log("    Length:", dt.token.length);
            console.log("    Preview:", dt.token.substring(0, 50) + "...");
            if (dt.token.startsWith('{')) {
                try {
                    const parsed = JSON.parse(dt.token);
                    console.log("    WebPush Endpoint:", parsed.endpoint ? parsed.endpoint.substring(0, 60) + "..." : "NONE");
                } catch (e) {
                    console.log("    Invalid JSON token!");
                }
            }
        });

        // Now test sending a notification to this user
        console.log("\n  --> Attempting test sendToUser for " + u.full_name + " (" + u.id + ")...");
        try {
            const notifService = NotificationService.getInstance();
            await notifService.sendToUser(
                u.id,
                "Test Alert from LifePartner AI",
                "Hello " + u.full_name + "! Testing push notification delivery.",
                {
                    type: 'test',
                    url: '/dashboard'
                }
            );
            console.log("  --> sendToUser call completed.");
        } catch (err) {
            console.error("  --> sendToUser ERROR:", err);
        }
    }
}

diagnose().finally(() => process.exit(0));

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { NotificationService } = require('../dist/services/notification');
const { OneSignalService } = require('../dist/services/OneSignalService');
const { WebPushService } = require('../dist/services/WebPushService');
const { prisma } = require('../dist/prisma');

async function sendSample() {
    console.log("==========================================");
    console.log("       SENDING SAMPLE PUSH NOTIFICATION    ");
    console.log("==========================================");

    const targetEmail = "saitejavijayagiri@gmail.com";
    const user = await prisma.users.findUnique({
        where: { email: targetEmail },
        select: { id: true, full_name: true, email: true }
    });

    if (!user) {
        console.error("User not found:", targetEmail);
        return;
    }

    console.log(`Target User: ${user.full_name} (${user.email})`);
    console.log(`User ID: ${user.id}`);

    const notifService = NotificationService.getInstance();
    const oneSignal = OneSignalService.getInstance();
    const webPush = WebPushService.getInstance();

    console.log(`OneSignal Ready: ${oneSignal.isReady() ? '✅ YES' : '❌ NO'}`);
    console.log(`WebPush Ready: ${webPush.isReady() ? '✅ YES' : '❌ NO'}`);

    console.log("\nDispatching sample notification...");

    await notifService.sendToUser(
        user.id,
        "Pooja Sharma 💬",
        "Hey Sunny! Are you free to chat right now? ❤️",
        {
            type: 'match',
            senderId: "f035d0e3-9548-407e-afee-a6386c1f7be5",
            senderName: "Pooja Sharma",
            messageId: "sample_msg_" + Date.now(),
            url: "/chat/f035d0e3-9548-407e-afee-a6386c1f7be5",
            fromUserPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces"
        }
    );

    console.log("\nSample push notification dispatch complete!");
    console.log("Check your device or browser for the notification.");
}

sendSample()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

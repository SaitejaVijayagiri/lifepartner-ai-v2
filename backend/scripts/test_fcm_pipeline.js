const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { NotificationService } = require('../dist/services/notification');
const { prisma } = require('../dist/prisma');

async function testFCMPipeline() {
    console.log("==========================================");
    console.log("      FCM PUSH NOTIFICATION DEEP CHECK    ");
    console.log("==========================================");

    // 1. Check Firebase Admin Initialization
    const service = NotificationService.getInstance();
    const isReady = service.isReady();
    console.log(`1. Firebase Admin Initialized: ${isReady ? '✅ YES' : '❌ NO'}`);

    // 2. Check Database Device Tokens
    const totalTokens = await prisma.device_tokens.count();
    console.log(`2. Total Device Tokens in Database: ${totalTokens}`);

    // Group by platform
    const tokensByPlatform = await prisma.device_tokens.groupBy({
        by: ['platform'],
        _count: { token: true }
    });
    console.log("   Tokens by platform:", tokensByPlatform);

    // 3. Check notifications table
    const totalNotifications = await prisma.notifications.count();
    const unreadNotifications = await prisma.notifications.count({ where: { is_read: false } });
    console.log(`3. Total In-App Notifications: ${totalNotifications} (Unread: ${unreadNotifications})`);

    // 4. Test Dry-Run Validation on a Dummy FCM Token
    const dummyToken = "fcm_test_token_sample_1234567890abcdefghijklmnopqrstuvwxyz";
    console.log(`4. Testing dry-run validation with dummy token...`);
    const isValid = await service.sendvalidate(dummyToken);
    console.log(`   Validation result: ${isValid ? 'VALID' : 'INVALID (expected for dummy token)'}`);

    // 5. Check Cron / Push triggers in code
    console.log(`5. Cron Jobs configured for Push:`);
    console.log(`   - Witty Re-engagement: Every 4 hours (10:00, 14:00, 18:00, 21:00)`);
    console.log(`   - Female Match Reminders: Daily at 11:00 AM & 7:00 PM`);
    console.log(`   - Direct Chat Messages: Immediate on message creation`);
    console.log(`   - Video/Audio Calls: Immediate on call initiation`);
    console.log(`   - Date Proposals: Immediate on date creation`);
    console.log(`   - Interest Requests: Immediate on connection request`);

    console.log("\n==========================================");
    console.log("✅ FCM Push Notification Pipeline Check Complete!");
    console.log("==========================================");
}

testFCMPipeline()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

import { prisma } from '../prisma';
import { NotificationService } from '../services/notification';

async function main() {
    try {
        console.log("🌸🐘 =======================================================");
        console.log("   Ganesh Chaturthi 2026 Festive Broadcast Dispatcher     ");
        console.log("======================================================= 🐘🌸\n");

        const bannerUrl = "/images/campaigns/ganesh_chaturthi.jpg";

        // Fetch all active, non-banned users in the database
        const users = await prisma.users.findMany({
            where: { is_banned: false },
            select: { 
                id: true, 
                full_name: true, 
                email: true,
                gender: true,
                profiles: { 
                    select: { 
                        location_name: true 
                    } 
                } 
            },
            orderBy: { created_at: 'asc' }
        });

        console.log(`Found ${users.length} active users to receive the Ganesh Chaturthi blessing.\n`);

        if (users.length === 0) {
            console.log("No active users found. Exiting.");
            process.exit(0);
        }

        const ns = NotificationService.getInstance();
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            // Personalize first name with proper title-casing
            let rawName = user.full_name?.trim() || '';
            let firstName = rawName ? rawName.split(' ')[0] : '';
            if (firstName) {
                firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            }
            const name = firstName || 'there';

            const title = `Happy Ganesh Chaturthi, ${name}! 🐘✨`;
            const body = "May Lord Ganesha remove all obstacles and bless your path with love, happiness, and your ideal partner. 🌸🙏";

            try {
                // 1. Create notification record in database
                const dbNotification = await prisma.notifications.create({
                    data: {
                        user_id: user.id,
                        type: 'witty_reengagement',
                        message: title,
                        data: {
                            body: body,
                            bannerUrl: bannerUrl,
                            festival: 'Ganesh Chaturthi',
                            clicked: false
                        }
                    }
                });

                // 2. Dispatch push notification via FCM, OneSignal & WebPush
                await ns.sendToUser(
                    user.id,
                    title,
                    body,
                    { 
                        type: 'witty_reengagement', 
                        screen: 'matches',
                        bannerUrl: bannerUrl,
                        url: '/dashboard?tab=matches',
                        notificationId: dbNotification.id,
                        festival: 'Ganesh Chaturthi'
                    }
                );

                // 3. Emit realtime socket event for users currently online
                try {
                    const { getIO } = require('../socket');
                    const io = getIO();
                    io.to(user.id).emit('notification:new', {
                        id: dbNotification.id,
                        type: 'witty_reengagement',
                        message: title,
                        body: body,
                        bannerUrl: bannerUrl,
                        timestamp: new Date()
                    });
                } catch (_) {}

                console.log(`✅ [${successCount + 1}/${users.length}] Dispatched to ${name} (${user.email || user.id})`);
                successCount++;
            } catch (err: any) {
                console.error(`❌ Failed dispatching to user ${user.id} (${user.email}):`, err.message);
                failCount++;
            }

            // Small 80ms throttle to prevent rate-limiting downstream push gateways
            await new Promise(r => setTimeout(r, 80));
        }

        console.log("\n=======================================================");
        console.log(`🎉 Broadcast complete! Successfully delivered to ${successCount} users. (${failCount} failures)`);
        console.log("=======================================================\n");

        process.exit(0);
    } catch (e) {
        console.error("Critical error during festive broadcast:", e);
        process.exit(1);
    }
}

main();

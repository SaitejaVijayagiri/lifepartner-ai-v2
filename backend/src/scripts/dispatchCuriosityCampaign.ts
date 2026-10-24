import { prisma } from '../prisma';
import { NotificationService } from '../services/notification';
import { generateCuriosityPush, FEMALE_CURIOSITY_TEMPLATES } from '../services/curiosityPush';

async function dispatchCampaign() {
    console.log("🚀 =======================================================");
    console.log("   LifePartner AI - Live Curiosity Push Campaign Dispatcher ");
    console.log("=======================================================\n");

    try {
        // Fetch active, non-banned users
        const users = await prisma.users.findMany({
            where: {
                is_banned: false,
                OR: [
                    { is_deactivated: false },
                    { is_deactivated: null },
                    { deactivated_until: { lt: new Date() } }
                ]
            },
            select: {
                id: true,
                full_name: true,
                gender: true,
                city: true,
                location_name: true,
                email: true,
                device_tokens: {
                    select: { platform: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        console.log(`Found ${users.length} active users to receive the Curiosity Campaign.`);
        const usersWithHardwareTokens = users.filter(u => u.device_tokens.length > 0).length;
        console.log(`Users with registered hardware device tokens: ${usersWithHardwareTokens}`);
        console.log(`Users receiving in-app notification & realtime event: ${users.length}\n`);

        const ns = NotificationService.getInstance();
        let dispatchedCount = 0;
        let femaleDispatched = 0;
        let maleDispatched = 0;
        let tokensDispatched = 0;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const isFemale = (user.gender || '').toLowerCase() === 'female';
            const userCity = user.city || user.location_name || 'your city';
            const hasHardwareToken = user.device_tokens.length > 0;

            // Generate tailored curiosity notification
            const pushData = generateCuriosityPush(
                user.full_name,
                userCity,
                0,
                25,
                isFemale ? 'verified bachelors' : 'verified women',
                user.gender
            );

            try {
                // 1. Create in-app notification record in DB
                const dbNotif = await prisma.notifications.create({
                    data: {
                        user_id: user.id,
                        type: 'witty_reengagement',
                        message: pushData.title,
                        data: {
                            body: pushData.body,
                            bannerUrl: pushData.bannerUrl,
                            templateId: pushData.templateId,
                            actionUrl: pushData.targetUrl,
                            clicked: false
                        }
                    }
                });

                // 2. Dispatch hardware push notification (OneSignal, WebPush VAPID, FCM)
                await ns.sendToUser(user.id, pushData.title, pushData.body, {
                    type: 'witty_reengagement',
                    screen: pushData.targetUrl.includes('requests') ? 'requests' : 'matches',
                    url: pushData.targetUrl,
                    bannerUrl: pushData.bannerUrl,
                    templateId: pushData.templateId,
                    notificationId: dbNotif.id
                });

                // 3. Emit real-time Socket.io event if user is currently online
                try {
                    const { getIO } = require('../socket');
                    const io = getIO();
                    io.to(user.id).emit('notification:new', {
                        id: dbNotif.id,
                        type: 'witty_reengagement',
                        message: pushData.title,
                        body: pushData.body,
                        bannerUrl: pushData.bannerUrl,
                        timestamp: new Date()
                    });
                } catch (_) {}

                dispatchedCount++;
                if (isFemale) femaleDispatched++;
                else maleDispatched++;
                if (hasHardwareToken) tokensDispatched++;

                if ((i + 1) % 50 === 0 || i === users.length - 1) {
                    console.log(`  Progress: [${i + 1}/${users.length}] notifications processed...`);
                }

                // Smooth throttling
                await new Promise(r => setTimeout(r, 40));
            } catch (err: any) {
                console.error(`  ❌ Failed for user ${user.id}:`, err.message);
            }
        }

        console.log("\n=======================================================");
        console.log("   🎉 Campaign Dispatch Successfully Completed!       ");
        console.log("=======================================================");
        console.log(`Total Active Users Targeted:     ${users.length}`);
        console.log(`Successfully Dispatched:          ${dispatchedCount}`);
        console.log(`  - Female Users (Curiosity):    ${femaleDispatched}`);
        console.log(`  - Male Users:                  ${maleDispatched}`);
        console.log(`Hardware Push Channels Reached:  ${tokensDispatched} users with device tokens`);
        console.log(`In-App Notification Logged:      ${dispatchedCount} records in DB`);
        console.log("=======================================================\n");

    } catch (e: any) {
        console.error("Campaign Dispatch Fatal Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

dispatchCampaign();

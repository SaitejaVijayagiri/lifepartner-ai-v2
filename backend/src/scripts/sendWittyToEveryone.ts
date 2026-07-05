import { prisma } from '../prisma';
import { NotificationService } from '../services/notification';

interface NotificationTemplate {
    id: string;
    title: string | ((name: string) => string);
    body: string;
    bannerUrl: string;
}

const templates: NotificationTemplate[] = [
    {
        id: 'tea',
        title: (name: string) => `${name}, your tea is feeling lonely... ☕`,
        body: "A warm cup of chai is best shared. Let's find someone who shares your vibe today!",
        bannerUrl: "/images/campaigns/tea.png",
    },
    {
        id: 'lunch',
        title: (name: string) => `Hey ${name}, eating lunch alone again? 🍽️`,
        body: "Your future partner is probably doing the same. Let's swipe and change that!",
        bannerUrl: "/images/campaigns/lunch.png",
    },
    {
        id: 'night',
        title: (name: string) => `Late night thoughts, ${name}? 💭`,
        body: "Skip the overthinking. Talk to someone who actually understands you on LifePartner AI.",
        bannerUrl: "/images/campaigns/night.png",
    },
    {
        id: 'guru',
        title: (name: string) => `${name}, your profile bio called... 💅`,
        body: "It wants a polish! Ask the Love Guru to roast your bio and attract 8x more matches.",
        bannerUrl: "/images/campaigns/guru.png",
    },
    {
        id: 'secret',
        title: (name: string) => `Don't tell your mom, ${name}... 🤫`,
        body: "Someone highly compatible just browsed the matches list. Tap to check them out!",
        bannerUrl: "/images/campaigns/secret.png",
    },
    {
        id: 'keyboard',
        title: (name: string) => `${name}, are you a keyboard? ⌨️`,
        body: "Because you're just our type. 😉 Let's see who else is your type today!",
        bannerUrl: "/images/campaigns/keyboard.png",
    },
    {
        id: 'zodiac',
        title: (name: string) => `Zodiac signs are matching, ${name}! 🌌`,
        body: "The stars align at this hour. Find your cosmic compatibility score with new matches.",
        bannerUrl: "/images/campaigns/zodiac.png",
    }
];

async function main() {
    try {
        console.log("📣 Initiating One-Off Witty Push Notification Dispatch to EVERYONE...");

        // Fetch all active, non-banned users in the database
        const users = await prisma.users.findMany({
            where: { is_banned: false, profiles: { isNot: null } },
            select: { 
                id: true, 
                full_name: true, 
                profiles: { 
                    select: { 
                        location_name: true 
                    } 
                } 
            }
        });

        console.log(`Found ${users.length} users in the database to receive push notifications.`);

        if (users.length === 0) {
            console.log("No users found to send push notifications to.");
            process.exit(0);
        }

        const ns = NotificationService.getInstance();
        let count = 0;

        for (const user of users) {
            // Select a random template
            const template = templates[Math.floor(Math.random() * templates.length)];
            const firstName = user.full_name?.split(' ')[0] || 'there';
            const location = user.profiles?.location_name || '';
            
            // Personalize title and body
            let personalizedTitle = typeof template.title === 'function'
                ? template.title(firstName)
                : template.title;
            const personalizedBody = template.body;

            // Apply city/food-specific personalization for lunch templates
            if (template.id === 'lunch' && location) {
                const lowerLoc = location.toLowerCase();
                if (lowerLoc.includes('hyderabad')) {
                    personalizedTitle = `Hey ${firstName}, eating Hyderabadi Biryani alone again? 🍛`;
                } else if (lowerLoc.includes('mumbai')) {
                    personalizedTitle = `Hey ${firstName}, eating Vada Pav alone again? 🍔`;
                } else if (lowerLoc.includes('bangalore') || lowerLoc.includes('bengaluru')) {
                    personalizedTitle = `Hey ${firstName}, eating Masala Dosa alone again? 🍽️`;
                } else if (lowerLoc.includes('delhi')) {
                    personalizedTitle = `Hey ${firstName}, eating Butter Chicken alone again? 🍛`;
                } else if (lowerLoc.includes('chennai')) {
                    personalizedTitle = `Hey ${firstName}, eating Idli Sambhar alone again? 🍲`;
                }
            }

            console.log(`Sending to ${user.full_name} (${user.id}): "${personalizedTitle}"`);

            // Create notification record in database first to track it
            const dbNotification = await prisma.notifications.create({
                data: {
                    user_id: user.id,
                    type: 'witty_reengagement',
                    message: personalizedTitle,
                    data: {
                        body: personalizedBody,
                        bannerUrl: template.bannerUrl,
                        clicked: false
                    }
                }
            });

            // Dispatch push notification via FCM
            try {
                await ns.sendToUser(
                    user.id,
                    personalizedTitle,
                    personalizedBody,
                    { 
                        type: 'witty_reengagement', 
                        screen: 'matches',
                        bannerUrl: template.bannerUrl,
                        notificationId: dbNotification.id
                    }
                );
                count++;
            } catch (err: any) {
                console.error(`Failed to send FCM push to user ${user.id}:`, err.message);
            }
            
            // Small sleep to avoid rate limits
            await new Promise(r => setTimeout(r, 100));
        }

        console.log(`🎉 Finished sending. Successfully delivered ${count}/${users.length} witty push notifications.`);
        process.exit(0);
    } catch (e) {
        console.error("Critical error executing script:", e);
        process.exit(1);
    }
}

main();

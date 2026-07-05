import cron from 'node-cron';
import { prisma } from '../prisma';
import { NotificationService } from './notification';

interface NotificationTemplate {
    id: string;
    title: string | ((name: string) => string);
    body: string;
    bannerUrl: string;
    hours: number[]; // Hour range (0-23) when this template is relevant
}

const templates: NotificationTemplate[] = [
    {
        id: 'tea',
        title: (name: string) => `${name}, your tea is feeling lonely... ☕`,
        body: "A warm cup of chai is best shared. Let's find someone who shares your vibe today!",
        bannerUrl: "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?q=80&w=600&auto=format&fit=crop",
        hours: [8, 9, 10, 11, 16, 17, 18]
    },
    {
        id: 'lunch',
        title: (name: string) => `Hey ${name}, eating lunch alone again? 🍽️`,
        body: "Your future partner is probably doing the same. Let's swipe and change that!",
        bannerUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop",
        hours: [12, 13, 14, 15]
    },
    {
        id: 'night',
        title: (name: string) => `Late night thoughts, ${name}? 💭`,
        body: "Skip the overthinking. Talk to someone who actually understands you on LifePartner AI.",
        bannerUrl: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=600&auto=format&fit=crop",
        hours: [20, 21, 22, 23, 0, 1, 2]
    },
    {
        id: 'guru',
        title: (name: string) => `${name}, your profile bio called... 💅`,
        body: "It wants a polish! Ask the Love Guru to roast your bio and attract 8x more matches.",
        bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
        hours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    },
    {
        id: 'secret',
        title: (name: string) => `Don't tell your mom, ${name}... 🤫`,
        body: "Someone highly compatible just browsed the matches list. Tap to check them out!",
        bannerUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop",
        hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
    },
    {
        id: 'keyboard',
        title: (name: string) => `${name}, are you a keyboard? ⌨️`,
        body: "Because you're just our type. 😉 Let's see who else is your type today!",
        bannerUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop",
        hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
    },
    {
        id: 'zodiac',
        title: (name: string) => `Zodiac signs are matching, ${name}! 🌌`,
        body: "The stars align at this hour. Find your cosmic compatibility score with new matches.",
        bannerUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=600&auto=format&fit=crop",
        hours: [18, 19, 20, 21, 22, 23]
    }
];

export async function sendWittyNotifications() {
    try {
        console.log("🚀 Running Witty Push Notifications Cron Job...");
        
        // Target users inactive for 1 to 7 days
        const INACTIVE_MIN_DAYS = 1;
        const INACTIVE_MAX_DAYS = 7;
        
        const minCutoff = new Date();
        minCutoff.setDate(minCutoff.getDate() - INACTIVE_MIN_DAYS);
        const maxCutoff = new Date();
        maxCutoff.setDate(maxCutoff.getDate() - INACTIVE_MAX_DAYS);

        // Fetch users who are not banned, including location_name
        const users = await prisma.users.findMany({
            where: { is_banned: false, profiles: { isNot: null } },
            select: { 
                id: true, 
                full_name: true, 
                created_at: true, 
                profiles: { 
                    select: { 
                        metadata: true,
                        location_name: true 
                    } 
                } 
            }
        });

        const inactiveUsers = users.filter((u: any) => {
            const meta = (u.profiles?.metadata as any) || {};
            const lastSeen = meta.last_seen_at ? new Date(meta.last_seen_at) : (u.created_at ? new Date(u.created_at) : null);
            // Must be between 1 day and 7 days ago
            return lastSeen && lastSeen < minCutoff && lastSeen > maxCutoff;
        });

        if (inactiveUsers.length === 0) {
            console.log("No inactive users matching criteria (1-7 days last seen).");
            return;
        }

        const currentHour = new Date().getHours();
        
        // Filter templates relevant for this hour
        const hourlyTemplates = templates.filter(t => t.hours.includes(currentHour));
        const activeTemplates = hourlyTemplates.length > 0 ? hourlyTemplates : templates;

        const ns = NotificationService.getInstance();
        let count = 0;

        for (const user of inactiveUsers) {
            const template = activeTemplates[Math.floor(Math.random() * activeTemplates.length)];
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
            
            // Small sleep to avoid throttling
            await new Promise(r => setTimeout(r, 100));
        }

        console.log(`[Witty Campaign] Successfully sent ${count} witty re-engagement push notifications.`);
    } catch (e) {
        console.error("Failed to run Witty Push Notifications Campaign:", e);
    }
}

export function initWittyNotificationsCron() {
    // Run at minute 0 of hours 11 (11:00 AM), 13 (1:00 PM), 18 (6:00 PM), and 21 (9:00 PM)
    cron.schedule('0 11,13,18,21 * * *', async () => {
        await sendWittyNotifications();
    });
    console.log("⏰ Witty Push Notifications Cron Job Scheduled (11:00 AM, 1:00 PM, 6:00 PM, 9:00 PM).");
}

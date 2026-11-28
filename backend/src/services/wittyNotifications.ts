import cron from 'node-cron';
import { prisma } from '../prisma';
import { NotificationService } from './notification';
import { generateCuriosityPush } from './curiosityPush';
import { resolveUserTimezone, getUserLocalTime } from './timezoneHelper';

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
        bannerUrl: "/images/campaigns/tea.png",
        hours: [8, 9, 10, 11, 16, 17, 18]
    },
    {
        id: 'lunch',
        title: (name: string) => `Hey ${name}, eating lunch alone again? 🍽️`,
        body: "Your future partner is probably doing the same. Let's swipe and change that!",
        bannerUrl: "/images/campaigns/lunch.png",
        hours: [12, 13, 14, 15]
    },
    {
        id: 'night',
        title: (name: string) => `Late night thoughts, ${name}? 💭`,
        body: "Skip the overthinking. Talk to someone who actually understands you on LifePartner AI.",
        bannerUrl: "/images/campaigns/night.png",
        hours: [20, 21, 22, 23, 0, 1, 2]
    },
    {
        id: 'guru',
        title: (name: string) => `${name}, your profile bio called... 💅`,
        body: "It wants a polish! Ask the Love Guru to roast your bio and attract 8x more matches.",
        bannerUrl: "/images/campaigns/guru.png",
        hours: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
    },
    {
        id: 'secret',
        title: (name: string) => `Don't tell your mom, ${name}... 🤫`,
        body: "Someone highly compatible just browsed the matches list. Tap to check them out!",
        bannerUrl: "/images/campaigns/secret.png",
        hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
    },
    {
        id: 'keyboard',
        title: (name: string) => `${name}, are you a keyboard? ⌨️`,
        body: "Because you're just our type. 😉 Let's see who else is your type today!",
        bannerUrl: "/images/campaigns/keyboard.png",
        hours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
    },
    {
        id: 'zodiac',
        title: (name: string) => `Zodiac signs are matching, ${name}! 🌌`,
        body: "The stars align at this hour. Find your cosmic compatibility score with new matches.",
        bannerUrl: "/images/campaigns/zodiac.png",
        hours: [18, 19, 20, 21, 22, 23]
    }
];

export async function sendWittyNotifications() {
    try {
        console.log("🚀 Running Witty Push Notifications Cron Job...");
        
        // Auto-cleanup stale automated notifications older than 30 days to keep DB healthy
        if (typeof (prisma.notifications as any).deleteMany === 'function') {
            await prisma.notifications.deleteMany({
                where: {
                    type: 'witty_reengagement',
                    created_at: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            }).catch(() => {});
        }

        // Target users inactive for at least 1 day (up to 180 days to cover all registered users)
        const INACTIVE_MIN_DAYS = 1;
        const INACTIVE_MAX_DAYS = 180;
        
        const minCutoff = new Date();
        minCutoff.setDate(minCutoff.getDate() - INACTIVE_MIN_DAYS);
        const maxCutoff = new Date();
        maxCutoff.setDate(maxCutoff.getDate() - INACTIVE_MAX_DAYS);

        // Cursor-paginated batch scan so 1M+ users never OOM or lock the event loop
        const BATCH_SIZE = 500;
        const ns = NotificationService.getInstance();
        let count = 0;
        let skippedQuietHours = 0;
        let cursorId: string | undefined;

        while (true) {
            const users = await prisma.users.findMany({
                take: BATCH_SIZE,
                ...(cursorId ? { skip: 1, cursor: { id: cursorId } } : {}),
                orderBy: { id: 'asc' },
                where: {
                    is_banned: false,
                    is_deactivated: false,
                    profiles: { isNot: null }
                },
                select: {
                    id: true,
                    full_name: true,
                    gender: true,
                    city: true,
                    location_name: true,
                    created_at: true,
                    profiles: {
                        select: {
                            metadata: true,
                            location_name: true
                        }
                    }
                }
            });

            if (!users || users.length === 0) break;

            const inactiveUsers = users.filter((u: any) => {
                const meta = (u.profiles?.metadata as any) || {};
                const lastSeen = meta.last_seen_at ? new Date(meta.last_seen_at) : (u.created_at ? new Date(u.created_at) : null);
                return lastSeen && lastSeen < minCutoff && lastSeen > maxCutoff;
            });

            const eligibleForHour = inactiveUsers.filter((user: any) => {
                const userTimezone = resolveUserTimezone(user);
                const local = getUserLocalTime(userTimezone);
                if (local.isQuietHours) {
                    skippedQuietHours++;
                    return false;
                }
                return local.isOptimalCampaignHour;
            });

            if (eligibleForHour.length > 0) {
                const recentCutoff = new Date(Date.now() - 20 * 60 * 60 * 1000);
                const templateHistoryCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                const batchUserIds = eligibleForHour.map((u: any) => u.id);

                // Batch lookup recent witty notifications & last 14d templateIds so users never see repeats
                let recentlyNotifiedIds = new Set<string>();
                const recentTemplateMap = new Map<string, string[]>();
                if (typeof (prisma.notifications as any).findMany === 'function') {
                    const recentRows = await prisma.notifications.findMany({
                        where: {
                            user_id: { in: batchUserIds },
                            type: { in: ['witty_reengagement', 'match_waiting_reminder'] },
                            created_at: { gte: templateHistoryCutoff }
                        },
                        select: { user_id: true, type: true, created_at: true, data: true }
                    }).catch(() => []);
                    for (const r of (recentRows || []) as any[]) {
                        if (!r?.user_id) continue;
                        if (r.type === 'witty_reengagement' && r.created_at && new Date(r.created_at) >= recentCutoff) {
                            recentlyNotifiedIds.add(r.user_id);
                        }
                        const tplId = r.data?.templateId;
                        if (tplId && typeof tplId === 'string') {
                            const arr = recentTemplateMap.get(r.user_id) || [];
                            arr.push(tplId);
                            recentTemplateMap.set(r.user_id, arr);
                        }
                    }
                }

                // Batch lookup pending requests counts if groupBy is available
                const pendingCountMap = new Map<string, number>();
                if (typeof (prisma as any).interactions?.groupBy === 'function') {
                    const grouped = await (prisma as any).interactions.groupBy({
                        by: ['to_user_id'],
                        where: {
                            to_user_id: { in: batchUserIds },
                            type: 'REQUEST',
                            status: { in: ['pending', 'PENDING'] }
                        },
                        _count: { _all: true }
                    }).catch(() => []);
                    for (const g of grouped || []) {
                        if (g?.to_user_id) pendingCountMap.set(g.to_user_id, Number(g._count?._all || 0));
                    }
                }

                for (const user of eligibleForHour) {
                    if (recentlyNotifiedIds.has(user.id)) continue;

                    // Fallback per-user throttle check if findMany is mocked out in tests
                    if (typeof (prisma.notifications as any).findMany !== 'function' && typeof (prisma.notifications as any).findFirst === 'function') {
                        const alreadyNotified = await prisma.notifications.findFirst({
                            where: {
                                user_id: user.id,
                                type: 'witty_reengagement',
                                created_at: { gte: recentCutoff }
                            }
                        }).catch(() => null);
                        if (alreadyNotified) continue;
                    }

                    const userTimezone = resolveUserTimezone(user);
                    const local = getUserLocalTime(userTimezone);
                    const meta = (user.profiles?.metadata as any) || {};
                    const location = meta.location?.city || user.profiles?.location_name || user.city || '';

                    let pendingRequests = pendingCountMap.get(user.id) ?? 0;
                    if (!pendingCountMap.has(user.id) && typeof (prisma as any).interactions?.count === 'function') {
                        pendingRequests = await prisma.interactions.count({
                            where: {
                                to_user_id: user.id,
                                type: 'REQUEST',
                                status: { in: ['pending', 'PENDING'] }
                            }
                        }).catch(() => 0);
                    }

                    const isFemale = (user.gender || '').toLowerCase() === 'female';
                    const pushData = generateCuriosityPush(
                        user.full_name,
                        location,
                        pendingRequests,
                        20,
                        isFemale ? 'verified men' : 'verified women',
                        user.gender,
                        userTimezone,
                        new Date(),
                        {
                            userId: user.id,
                            country: meta.location?.country || null,
                            religion: meta.religion?.religion || null,
                            recentTemplateIds: recentTemplateMap.get(user.id) || []
                        }
                    );

                    const dbNotification = await prisma.notifications.create({
                        data: {
                            user_id: user.id,
                            type: 'witty_reengagement',
                            message: pushData.title,
                            data: {
                                body: pushData.body,
                                bannerUrl: pushData.bannerUrl,
                                clicked: false,
                                templateId: pushData.templateId,
                                timezone: userTimezone,
                                localHour: local.hour
                            }
                        }
                    });

                    await ns.sendToUser(
                        user.id,
                        pushData.title,
                        pushData.body,
                        {
                            type: 'witty_reengagement',
                            screen: pushData.targetUrl.includes('requests') ? 'requests' : 'matches',
                            url: pushData.targetUrl,
                            bannerUrl: pushData.bannerUrl,
                            notificationId: dbNotification.id
                        }
                    );

                    try {
                        const { getIO } = require('../socket');
                        const io = getIO();
                        io.to(user.id).emit('notification:new', {
                            id: dbNotification.id,
                            type: 'witty_reengagement',
                            message: pushData.title,
                            body: pushData.body,
                            bannerUrl: pushData.bannerUrl,
                            timestamp: new Date()
                        });
                    } catch (_) {}

                    count++;
                    await new Promise(r => setTimeout(r, 20));
                }
            }

            if (users.length < BATCH_SIZE) break;
            cursorId = users[users.length - 1].id;
        }

        if (count === 0) {
            console.log("No inactive users matching criteria (1-7 days last seen).");
        }
        console.log(`[Witty Campaign] Successfully sent ${count} timezone-accurate push notifications (Skipped ${skippedQuietHours} in quiet hours).`);
    } catch (e) {
        console.error("Failed to run Witty Push Notifications Campaign:", e);
    }
}

export function initWittyNotificationsCron() {
    // Run hourly so users worldwide receive push notifications at their exact local optimal hours (9 AM, 1 PM, 6 PM, 9 PM)
    cron.schedule('0 * * * *', async () => {
        const { withCronLock } = require('../utils/cronLock');
        await withCronLock('witty_notifications', 3400, async () => {
            await sendWittyNotifications();
        });
    });
    console.log("⏰ Timezone-Aware Witty Push Notifications Cron Job Scheduled (Runs hourly to serve users at local 9 AM, 1 PM, 6 PM, 9 PM).");
}

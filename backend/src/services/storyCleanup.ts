import { prisma } from '../prisma';
import { isStoryActive } from '../routes/profile';

/**
 * Sweeps all profiles in database and permanently prunes expired non-highlighted stories.
 * Preserves permanent highlights (isHighlight: true).
 */
export async function cleanupExpiredStories(): Promise<number> {
    try {
        const profiles = await prisma.profiles.findMany({
            where: {
                stories: {
                    not: null as any
                }
            },
            select: {
                user_id: true,
                stories: true,
                metadata: true
            }
        });

        let updatedProfilesCount = 0;
        const now = new Date();

        for (const p of profiles) {
            const rawStories = (p.stories as any[]) || [];
            if (!Array.isArray(rawStories) || rawStories.length === 0) continue;

            const activeStories = rawStories.filter(s => isStoryActive(s, now));

            // If any stories were pruned due to 24h expiration
            if (activeStories.length !== rawStories.length) {
                const meta = (p.metadata as any) || {};
                let updatedMeta = meta;
                if (Array.isArray(meta.stories)) {
                    updatedMeta = {
                        ...meta,
                        stories: meta.stories.filter((s: any) => isStoryActive(s, now))
                    };
                }

                await prisma.profiles.update({
                    where: { user_id: p.user_id },
                    data: {
                        stories: activeStories as any,
                        metadata: updatedMeta
                    }
                });
                updatedProfilesCount++;
            }
        }

        return updatedProfilesCount;
    } catch (err) {
        console.error('[StoryCleanup] Error during story expiration cleanup:', err);
        return 0;
    }
}

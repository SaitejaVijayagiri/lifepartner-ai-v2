import { prisma } from '../prisma';
import { isStoryActive } from '../utils/story';

/**
 * Sweeps all profiles in database and cleanly prunes expired non-highlighted stories (>24h).
 * Preserves permanent highlights (isHighlight: true) and archives expired stories into metadata.story_archive.
 * Matches Instagram & MNC standards.
 */
export async function cleanupExpiredStories(): Promise<number> {
    try {
        const BATCH_SIZE = 250;
        let updatedProfilesCount = 0;
        let cursorId: string | undefined;
        const now = new Date();

        while (true) {
            const profiles = await prisma.profiles.findMany({
                take: BATCH_SIZE,
                ...(cursorId ? { skip: 1, cursor: { user_id: cursorId } } : {}),
                orderBy: { user_id: 'asc' },
                where: {
                    OR: [
                        { NOT: { stories: { equals: [] } } },
                        { stories: { not: undefined } }
                    ]
                },
                select: {
                    user_id: true,
                    stories: true,
                    metadata: true
                }
            });

            if (!profiles || profiles.length === 0) break;

            for (const p of profiles) {
                const rawDirect = (p.stories as any[]) || [];
                const meta = (p.metadata as any) || {};
                const rawMeta = (meta.stories as any[]) || [];

                if (rawDirect.length === 0 && rawMeta.length === 0) continue;

                const activeDirect = rawDirect.filter(s => isStoryActive(s, now));
                const activeMeta = rawMeta.filter(s => isStoryActive(s, now));

                const expiredDirect = rawDirect.filter(s => !isStoryActive(s, now));
                const expiredMeta = rawMeta.filter(s => !isStoryActive(s, now));
                const hasPrunedDirect = activeDirect.length !== rawDirect.length;
                const hasPrunedMeta = activeMeta.length !== rawMeta.length;

                if (hasPrunedDirect || hasPrunedMeta) {
                    // Instagram-style Archiving: preserve expired stories in private story_archive
                    const existingArchive: any[] = Array.isArray(meta.story_archive) ? meta.story_archive : [];
                    const archiveMap = new Map<string, any>();
                    for (const a of existingArchive) {
                        if (a && a.id) archiveMap.set(String(a.id), a);
                    }
                    for (const exp of [...expiredDirect, ...expiredMeta]) {
                        if (exp && exp.id && !archiveMap.has(String(exp.id))) {
                            archiveMap.set(String(exp.id), { ...exp, archivedAt: now.toISOString() });
                        }
                    }

                    const updatedMeta = {
                        ...meta,
                        stories: activeMeta,
                        story_archive: Array.from(archiveMap.values())
                    };

                    await prisma.profiles.update({
                        where: { user_id: p.user_id },
                        data: {
                            stories: activeDirect as any,
                            metadata: updatedMeta
                        }
                    });
                    updatedProfilesCount++;
                }
            }

            if (profiles.length < BATCH_SIZE) break;
            cursorId = profiles[profiles.length - 1].user_id;
        }

        return updatedProfilesCount;
    } catch (err) {
        console.error('[StoryCleanup] Error during story expiration cleanup:', err);
        return 0;
    }
}

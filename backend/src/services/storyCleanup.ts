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
            const profiles: Array<{ user_id: string; stories: any; metadata: any }> = cursorId
                ? await prisma.$queryRaw`
                    SELECT user_id, stories, metadata
                    FROM profiles
                    WHERE user_id > ${cursorId}::uuid
                      AND (
                        (stories IS NOT NULL AND jsonb_typeof(stories::jsonb) = 'array' AND jsonb_array_length(stories::jsonb) > 0)
                        OR (metadata IS NOT NULL AND jsonb_typeof(metadata->'stories') = 'array' AND jsonb_array_length((metadata->'stories')::jsonb) > 0)
                      )
                    ORDER BY user_id ASC
                    LIMIT ${BATCH_SIZE}
                `
                : await prisma.$queryRaw`
                    SELECT user_id, stories, metadata
                    FROM profiles
                    WHERE (stories IS NOT NULL AND jsonb_typeof(stories::jsonb) = 'array' AND jsonb_array_length(stories::jsonb) > 0)
                       OR (metadata IS NOT NULL AND jsonb_typeof(metadata->'stories') = 'array' AND jsonb_array_length((metadata->'stories')::jsonb) > 0)
                    ORDER BY user_id ASC
                    LIMIT ${BATCH_SIZE}
                `;

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

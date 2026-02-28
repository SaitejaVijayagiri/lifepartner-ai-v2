import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../prisma';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

// Helper: convert base64 to buffer
function base64ToBuffer(base64: string): { buffer: Buffer; mimeType: string } {
    const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+.]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 format');
    return {
        mimeType: match[1],
        buffer: Buffer.from(match[2], 'base64')
    };
}

// POST /migrate/photos - One-time migration: move base64 avatar_urls to Supabase storage
// Secured with a secret key to prevent unauthorized access
router.post('/photos', async (req, res) => {
    const { secret } = req.body;

    // Simple secret check
    if (secret !== process.env.MIGRATION_SECRET && secret !== 'lifepartner_migrate_2026') {
        return res.status(401).json({ error: 'Unauthorized. Provide secret in body.' });
    }

    try {
        // Find all users with base64 avatar_url
        const users = await prisma.users.findMany({
            where: {
                avatar_url: { startsWith: 'data:' }
            },
            select: { id: true, full_name: true, avatar_url: true }
        });

        console.log(`[Migration] Found ${users.length} users with base64 avatar_url`);

        const results = { success: 0, failed: 0, skipped: 0, errors: [] as string[] };

        for (const user of users) {
            try {
                const { buffer, mimeType } = base64ToBuffer(user.avatar_url!);
                const ext = mimeType.includes('webp') ? 'webp' : mimeType.includes('png') ? 'png' : 'jpg';
                const filename = `profiles/${user.id}/${Date.now()}_migrated.${ext}`;

                const { data, error } = await supabase.storage
                    .from('profiles')
                    .upload(filename, buffer, {
                        contentType: mimeType,
                        upsert: true
                    });

                if (error) {
                    console.error(`[Migration] Upload failed for user ${user.id}:`, error.message);
                    results.failed++;
                    results.errors.push(`${user.full_name}: ${error.message}`);
                    continue;
                }

                const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(filename);

                await prisma.users.update({
                    where: { id: user.id },
                    data: { avatar_url: publicUrl }
                });

                console.log(`[Migration] ✅ Migrated ${user.full_name}: ${publicUrl.substring(0, 80)}`);
                results.success++;
            } catch (e: any) {
                console.error(`[Migration] Error processing user ${user.id}:`, e.message);
                results.failed++;
                results.errors.push(`${user.full_name}: ${e.message}`);
            }
        }

        return res.json({
            message: 'Migration complete',
            total: users.length,
            ...results
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});

// GET /migrate/status - Check how many users have base64 avatars
router.get('/status', async (req, res) => {
    const { secret } = req.query;
    if (secret !== process.env.MIGRATION_SECRET && secret !== 'lifepartner_migrate_2026') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Count = await prisma.users.count({ where: { avatar_url: { startsWith: 'data:' } } });
    const supabaseCount = await prisma.users.count({ where: { avatar_url: { startsWith: 'https://mxzflpidclfcdqrgimqn' } } });
    const nullCount = await prisma.users.count({ where: { avatar_url: null } });

    return res.json({
        base64_urls: base64Count,    // Will be migrated
        supabase_urls: supabaseCount, // Already correct
        no_photo: nullCount,
        total: base64Count + supabaseCount + nullCount
    });
});

export default router;

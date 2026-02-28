import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../prisma';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const SECRET = 'lifepartner_migrate_2026';

function base64ToBuffer(base64: string): { buffer: Buffer; mimeType: string } {
    const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+.]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid base64 format');
    return { mimeType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

async function uploadBase64ToSupabase(base64: string, userId: string, bucket: string): Promise<string | null> {
    try {
        const { buffer, mimeType } = base64ToBuffer(base64);
        const ext = mimeType.includes('webp') ? 'webp' : mimeType.includes('png') ? 'png' : 'jpg';
        const filename = `profiles/${userId}/${Date.now()}_migrated.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(filename, buffer, { contentType: mimeType, upsert: true });
        if (error) { console.error(`Upload error for ${userId}:`, error.message); return null; }
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);
        return publicUrl;
    } catch (e: any) {
        console.error(`base64 upload failed for ${userId}:`, e.message);
        return null;
    }
}

// GET /migrate/status - Full audit of photo data across users + profiles tables
router.get('/status', async (req, res) => {
    if (req.query.secret !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const users = await prisma.users.findMany({
            select: { id: true, full_name: true, avatar_url: true, profiles: { select: { metadata: true } } }
        });

        const report: any[] = [];
        let base64Avatar = 0, supabaseAvatar = 0, nullAvatar = 0;
        let base64MetaPhoto = 0, supabaseMetaPhoto = 0, noMetaPhoto = 0;

        for (const u of users) {
            const meta = (u.profiles?.metadata as any) || {};
            const photosArr: string[] = meta.photos || [];
            const firstPhoto = photosArr[0];

            const avatarType = !u.avatar_url ? 'null' : u.avatar_url.startsWith('data:') ? 'base64' : u.avatar_url.includes('supabase') ? 'supabase' : 'other';
            const photoType = !firstPhoto ? 'none' : firstPhoto.startsWith('data:') ? 'base64' : firstPhoto.includes('supabase') ? 'supabase' : 'other';

            if (avatarType === 'null') nullAvatar++;
            else if (avatarType === 'base64') base64Avatar++;
            else if (avatarType === 'supabase') supabaseAvatar++;

            if (photoType === 'none') noMetaPhoto++;
            else if (photoType === 'base64') base64MetaPhoto++;
            else if (photoType === 'supabase') supabaseMetaPhoto++;

            report.push({
                name: u.full_name,
                avatarType,
                photoType,
                avatarPreview: u.avatar_url?.substring(0, 60),
                photoPreview: firstPhoto?.substring(0, 60)
            });
        }

        return res.json({
            summary: { base64Avatar, supabaseAvatar, nullAvatar, base64MetaPhoto, supabaseMetaPhoto, noMetaPhoto },
            users: report
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});

// POST /migrate/photos - Migrate base64 strings in avatar_url AND meta.photos to Supabase
router.post('/photos', async (req, res) => {
    if (req.body.secret !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const users = await prisma.users.findMany({
            select: { id: true, full_name: true, avatar_url: true, profiles: { select: { metadata: true } } }
        });

        const results = { avatarMigrated: 0, photosMigrated: 0, failed: 0, skipped: 0, errors: [] as string[] };

        for (const u of users) {
            const meta = (u.profiles?.metadata as any) || {};
            const photosArr: string[] = meta.photos || [];
            let newAvatarUrl = u.avatar_url;
            let newPhotos = [...photosArr];
            let changed = false;

            // 1. Migrate base64 avatar_url
            if (u.avatar_url?.startsWith('data:')) {
                const url = await uploadBase64ToSupabase(u.avatar_url, u.id, 'profiles');
                if (url) { newAvatarUrl = url; results.avatarMigrated++; changed = true; }
                else { results.failed++; results.errors.push(`${u.full_name}: avatar upload failed`); }
            }

            // 2. Migrate base64 strings inside meta.photos array
            for (let i = 0; i < newPhotos.length; i++) {
                if (newPhotos[i]?.startsWith('data:')) {
                    const url = await uploadBase64ToSupabase(newPhotos[i], u.id, 'profiles');
                    if (url) { newPhotos[i] = url; results.photosMigrated++; changed = true; }
                    else { results.errors.push(`${u.full_name}: photos[${i}] upload failed`); }
                }
            }

            // 3. If avatar_url is null but meta.photos[0] is a valid Supabase URL, copy it to avatar_url
            if (!newAvatarUrl && newPhotos[0] && !newPhotos[0].startsWith('data:') && newPhotos[0].startsWith('http')) {
                newAvatarUrl = newPhotos[0];
                changed = true;
                console.log(`[Migrate] Promoting meta.photos[0] to avatar_url for ${u.full_name}: ${newAvatarUrl}`);
            }

            if (changed) {
                await prisma.users.update({
                    where: { id: u.id },
                    data: { avatar_url: newAvatarUrl }
                });
                if (u.profiles) {
                    await prisma.profiles.update({
                        where: { user_id: u.id },
                        data: { metadata: { ...meta, photos: newPhotos } as any }
                    });
                }
                console.log(`[Migrate] ✅ Updated ${u.full_name}`);
            } else {
                results.skipped++;
            }
        }

        return res.json({ message: 'Migration complete', ...results });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
});

export default router;

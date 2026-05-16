/**
 * migrate_base64_photos.js
 *
 * Finds all users whose avatar_url (or metadata.photos[]) are stored as base64
 * data URIs in Postgres, uploads them to Supabase storage, and updates the DB
 * with the proper Supabase public URLs.
 *
 * Why: base64 in Postgres bloats every API response by 50-180 KB per user.
 * Real Supabase URLs are served via CDN and our proxy, loading faster for everyone.
 *
 * Usage:
 *   node scripts/migrate_base64_photos.js --dry-run   (safe preview)
 *   node scripts/migrate_base64_photos.js             (live migration)
 */

const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Upload a base64 string to Cloudinary and return the public URL ───────────
async function uploadBase64ToCloudinary(base64, userId, index = 0) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.error("❌ CLOUDINARY_CLOUD_NAME is missing in .env");
        process.exit(1);
    }
    try {
        const result = await cloudinary.uploader.upload(base64, {
            folder: `lifepartner/profiles/${userId}`,
            public_id: `photo_${index}_${Date.now()}`,
            resource_type: 'image',
            transformation: [
                { width: 1200, crop: 'limit', quality: 85, fetch_format: 'auto' }
            ],
            overwrite: false,
            timeout: 120000 // Increase timeout to 120s
        });

        return result.secure_url;
    } catch (e) {
        console.error(`    ⚠️  Cloudinary upload failed:`, e);
        return null; // Keep existing base64 on failure
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(DRY_RUN ? '🔍 DRY-RUN — no changes will be made.\n' : '🚀 Starting base64 → Cloudinary migration...\n');

    // Fetch all users with base64 avatar_url
    const users = await prisma.users.findMany({
        where: {
            age: { not: null },
            gender: { not: null }
        },
        select: {
            id: true,
            email: true,
            full_name: true,
            avatar_url: true,
            profiles: { select: { metadata: true } }
        }
    });

    let totalMigrated = 0, totalFailed = 0, totalSkipped = 0;

    for (const user of users) {
        const meta = (user.profiles?.metadata) || {};
        const metaPhotos = meta.photos || [];

        const avatarIsBase64 = user.avatar_url && user.avatar_url.startsWith('data:image');
        const metaBase64Photos = metaPhotos.filter(p => p && p.startsWith('data:image'));

        if (!avatarIsBase64 && metaBase64Photos.length === 0) {
            totalSkipped++;
            continue; // Nothing to migrate for this user
        }

        const avatarKB = avatarIsBase64 ? Math.round(user.avatar_url.length / 1024) : 0;
        const metaKBs = metaBase64Photos.map(p => Math.round(p.length / 1024));

        console.log(`\n👤 ${user.full_name} <${user.email}>`);
        if (avatarIsBase64) console.log(`   avatar_url: base64 [${avatarKB} KB]`);
        if (metaBase64Photos.length > 0) console.log(`   meta.photos: ${metaBase64Photos.length} base64 [${metaKBs.join(', ')} KB]`);

        if (DRY_RUN) {
            console.log(`   → Would upload ${(avatarIsBase64 ? 1 : 0) + metaBase64Photos.length} photo(s) to Cloudinary`);
            continue;
        }

        // ── 1. Upload avatar_url ─────────────────────────────────────────────
        let newAvatarUrl = user.avatar_url;
        if (avatarIsBase64) {
            process.stdout.write(`   Uploading avatar... `);
            const uploaded = await uploadBase64ToCloudinary(user.avatar_url, user.id, 0);
            if (uploaded) {
                newAvatarUrl = uploaded;
                console.log(`✅ ${uploaded.substring(0, 70)}...`);
                totalMigrated++;
            } else {
                console.log(`❌ Failed — keeping base64`);
                totalFailed++;
            }
            await new Promise(r => setTimeout(r, 300)); // Rate limit
        }

        // ── 2. Upload meta.photos[] ──────────────────────────────────────────
        const newMetaPhotos = [];
        for (let i = 0; i < metaPhotos.length; i++) {
            const p = metaPhotos[i];
            if (p && p.startsWith('data:image')) {
                process.stdout.write(`   Uploading meta photo[${i}]... `);
                const uploaded = await uploadBase64ToCloudinary(p, user.id, i + 1);
                if (uploaded) {
                    newMetaPhotos.push(uploaded);
                    console.log(`✅`);
                    totalMigrated++;
                } else {
                    newMetaPhotos.push(p); // Keep base64 as fallback
                    console.log(`❌ Kept base64`);
                    totalFailed++;
                }
                await new Promise(r => setTimeout(r, 300));
            } else {
                newMetaPhotos.push(p); // Already a URL — keep as-is
            }
        }

        // ── 3. Write changes back to DB ──────────────────────────────────────
        try {
            // Update avatar_url on the users table
            await prisma.users.update({
                where: { id: user.id },
                data: { avatar_url: newAvatarUrl }
            });

            // Update metadata.photos on profiles table (merge, preserve other meta fields)
            const newMeta = { ...meta, photos: newMetaPhotos };
            await prisma.profiles.update({
                where: { user_id: user.id },
                data: { metadata: newMeta }
            });

            console.log(`   ✅ DB updated for ${user.full_name}`);
        } catch (dbErr) {
            console.error(`   ❌ DB update failed for ${user.full_name}: ${dbErr.message}`);
            totalFailed++;
        }
    }

    console.log(`\n${'═'.repeat(55)}`);
    if (DRY_RUN) {
        const toMigrate = users.filter(u =>
            (u.avatar_url && u.avatar_url.startsWith('data:image')) ||
            ((u.profiles?.metadata?.photos || []).some(p => p && p.startsWith('data:image')))
        );
        console.log(`  DRY-RUN complete.`);
        console.log(`  Users with base64 to migrate: ${toMigrate.length}`);
    } else {
        console.log(`  Migration complete.`);
        console.log(`  ✅ Uploaded to Cloudinary : ${totalMigrated}`);
        console.log(`  ❌ Failed uploads          : ${totalFailed}`);
        console.log(`  ⏭️  Skipped (no base64)     : ${totalSkipped}`);
    }
    console.log(`${'═'.repeat(55)}\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

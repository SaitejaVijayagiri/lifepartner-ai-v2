/**
 * migrate_all_cloudinary_to_r2.js
 *
 * Downloads all photos from Cloudinary, uploads them directly to Cloudflare R2,
 * and updates the database records (users.avatar_url, profiles.photos).
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const prisma = new PrismaClient();

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

const BUCKET = process.env.R2_BUCKET_NAME || 'lifepartner-media';
const BACKEND_URL = (process.env.BACKEND_URL || 'https://lifepartnerai.in').replace(/\/+$/, '');
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN ? process.env.R2_PUBLIC_DOMAIN.replace(/\/+$/, '') : null;

function getR2PublicUrl(key) {
    if (PUBLIC_DOMAIN) {
        return `${PUBLIC_DOMAIN}/${key}`;
    }
    return `${BACKEND_URL}/photo/r2/${key}`;
}

async function downloadWithRetry(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const arrayBuf = await res.arrayBuffer();
            return Buffer.from(arrayBuf);
        } catch (e) {
            if (attempt === retries) throw e;
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
}

async function uploadToR2(buffer, key, contentType = 'image/jpeg') {
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType
    }));
    return getR2PublicUrl(key);
}

async function run() {
    console.log('====================================================');
    console.log('🚀 CLOUDINARY -> CLOUDFLARE R2 MIGRATION STARTED');
    console.log(`📦 Target R2 Bucket: ${BUCKET}`);
    console.log(`🌐 Public URL Base: ${PUBLIC_DOMAIN || BACKEND_URL + '/photo/r2'}`);
    console.log('====================================================\n');

    const profiles = await prisma.profiles.findMany({
        select: {
            user_id: true,
            photos: true,
            metadata: true,
            users: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    avatar_url: true
                }
            }
        }
    });

    const cldProfiles = profiles.filter(p => {
        const hasCldInPhotos = Array.isArray(p.photos) && p.photos.some(u => typeof u === 'string' && u.includes('cloudinary'));
        const hasCldInAvatar = typeof p.users?.avatar_url === 'string' && p.users.avatar_url.includes('cloudinary');
        return hasCldInPhotos || hasCldInAvatar;
    });

    console.log(`📊 Found ${cldProfiles.length} profiles with Cloudinary assets.\n`);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < cldProfiles.length; i++) {
        const p = cldProfiles[i];
        const user = p.users;
        const userId = p.user_id;
        const userName = user?.full_name || user?.email || userId;

        console.log(`[${i + 1}/${cldProfiles.length}] Processing: ${userName} (${userId})...`);

        try {
            // Collect all unique Cloudinary URLs for this user
            const rawUrls = new Set();
            if (Array.isArray(p.photos)) {
                p.photos.forEach(u => { if (typeof u === 'string' && u.includes('cloudinary')) rawUrls.add(u.trim()); });
            }
            if (user?.avatar_url && typeof user.avatar_url === 'string' && user.avatar_url.includes('cloudinary')) {
                rawUrls.add(user.avatar_url.trim());
            }

            const urlMap = new Map(); // oldUrl -> newR2Url
            let photoIdx = 0;

            for (const oldUrl of rawUrls) {
                try {
                    // Extract extension or default to jpg
                    let ext = '.jpg';
                    if (oldUrl.endsWith('.png')) ext = '.png';
                    else if (oldUrl.endsWith('.webp')) ext = '.webp';

                    const r2Key = `profiles/${userId}/photo_${photoIdx}_${Date.now()}${ext}`;
                    const buffer = await downloadWithRetry(oldUrl);
                    const newUrl = await uploadToR2(buffer, r2Key, ext === '.png' ? 'image/png' : 'image/jpeg');

                    urlMap.set(oldUrl, newUrl);
                    photoIdx++;
                } catch (imgErr) {
                    console.warn(`   ⚠️ Could not migrate photo (${oldUrl.substring(0, 60)}...): ${imgErr.message}`);
                }
            }

            // Update user photos array
            let updatedPhotos = [];
            if (Array.isArray(p.photos)) {
                updatedPhotos = p.photos.map(u => (typeof u === 'string' && urlMap.has(u.trim()) ? urlMap.get(u.trim()) : u));
            } else if (urlMap.size > 0) {
                updatedPhotos = Array.from(urlMap.values());
            }

            // Update user avatar
            let updatedAvatar = user?.avatar_url;
            if (user?.avatar_url && urlMap.has(user.avatar_url.trim())) {
                updatedAvatar = urlMap.get(user.avatar_url.trim());
            } else if (updatedPhotos.length > 0) {
                updatedAvatar = updatedPhotos[0];
            }

            // Save to DB
            await prisma.profiles.update({
                where: { user_id: userId },
                data: { photos: updatedPhotos }
            });

            if (updatedAvatar && updatedAvatar !== user?.avatar_url) {
                await prisma.users.update({
                    where: { id: userId },
                    data: { avatar_url: updatedAvatar }
                });
            }

            console.log(`   ✅ Migrated ${urlMap.size} photos -> DB updated!`);
            successCount++;
        } catch (err) {
            console.error(`   ❌ Failed user ${userId}:`, err.message);
            failedCount++;
        }
    }

    console.log('\n====================================================');
    console.log(`🎉 MIGRATION FINISHED!`);
    console.log(`   ✅ Successful users: ${successCount}`);
    console.log(`   ❌ Failed users:     ${failedCount}`);
    console.log('====================================================');
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

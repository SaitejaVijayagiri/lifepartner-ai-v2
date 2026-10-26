/**
 * migrate_to_r2.ts
 *
 * Migrates user profile photos from a local downloaded backup folder (or unblocked Cloudinary)
 * directly into Cloudflare R2 and updates the database records (users & profiles).
 *
 * Usage:
 *   1. Download your 'lifepartner' media folder from Cloudinary Console (Media Library -> Download as ZIP).
 *   2. Unzip into `backend/migration_backup/` (e.g. `backend/migration_backup/profiles/<userId>/photo_0.jpg`).
 *   3. Run: npm run migrate:r2
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import fs from 'fs';
import { prisma } from '../src/prisma';
import { isR2Configured, uploadBufferToR2 } from '../src/services/r2Storage';

async function migrate() {
    if (!isR2Configured()) {
        console.error('❌ Cloudflare R2 is not configured in .env. Please check R2_* variables.');
        process.exit(1);
    }

    const backupDir = path.join(__dirname, '../migration_backup');
    if (!fs.existsSync(backupDir)) {
        console.log(`📁 Backup directory not found at: ${backupDir}`);
        console.log(`
👉 How to migrate your Cloudinary photos to Cloudflare R2:
  1. Log into https://console.cloudinary.com/ -> Media Library.
  2. Select the 'lifepartner' (or 'profiles') folder and click 'Download' (Export ZIP).
  3. Extract the ZIP into: ${backupDir}
  4. Re-run this script to automatically upload all photos to R2 and update the database!
`);
        return;
    }

    console.log('🚀 Starting Cloudflare R2 Migration from local backup...');

    // Scan all user folders in backupDir
    const userFolders = fs.readdirSync(backupDir).filter(f => {
        return fs.statSync(path.join(backupDir, f)).isDirectory();
    });

    console.log(`📊 Found ${userFolders.length} user folders to process.\n`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const folderName of userFolders) {
        // folderName could be a userId or 'profiles' containing userIds
        const userPath = path.join(backupDir, folderName);
        const subItems = fs.readdirSync(userPath);

        // Check if this folder contains subdirectories (userIds) or image files directly
        const isUserDir = subItems.some(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
        
        const targets: Array<{ userId: string; dir: string }> = isUserDir
            ? [{ userId: folderName, dir: userPath }]
            : subItems
                .filter(sub => fs.statSync(path.join(userPath, sub)).isDirectory())
                .map(sub => ({ userId: sub, dir: path.join(userPath, sub) }));

        for (const { userId, dir } of targets) {
            try {
                const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
                if (files.length === 0) continue;

                console.log(`🔄 Migrating User ${userId} (${files.length} photos)...`);
                const newPhotos: string[] = [];

                for (let i = 0; i < files.length; i++) {
                    const filename = files[i];
                    const filePath = path.join(dir, filename);
                    const fileBuffer = fs.readFileSync(filePath);
                    const ext = path.extname(filename).toLowerCase();
                    const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
                    const r2Key = `profiles/${userId}/photo_${i}_${Date.now()}${ext}`;

                    const uploadRes = await uploadBufferToR2(fileBuffer, r2Key, contentType, true);
                    if (uploadRes?.url) {
                        newPhotos.push(uploadRes.url);
                        console.log(`   ✅ Uploaded: ${r2Key}`);
                    }
                }

                if (newPhotos.length > 0) {
                    // Update Database: profiles and users table
                    await prisma.profiles.updateMany({
                        where: { user_id: userId },
                        data: { photos: newPhotos }
                    });

                    await prisma.users.updateMany({
                        where: { id: userId },
                        data: { avatar_url: newPhotos[0] }
                    });

                    console.log(`   🎉 Successfully updated DB for user ${userId}!\n`);
                    migratedCount++;
                }
            } catch (err: any) {
                console.error(`   ❌ Failed migrating user ${userId}:`, err?.message || err);
                errorCount++;
            }
        }
    }

    console.log(`===============================================`);
    console.log(`✨ Migration Complete!`);
    console.log(`   Migrated: ${migratedCount} users`);
    console.log(`   Errors:   ${errorCount}`);
    console.log(`===============================================`);
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

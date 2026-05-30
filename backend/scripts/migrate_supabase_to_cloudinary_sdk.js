const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadBufferToCloudinary(buffer, userId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `lifepartner/profiles/${userId}`,
                transformation: [{ width: 800, height: 800, crop: 'limit' }],
                format: 'jpg',
                quality: 'auto:good'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
}

async function main() {
    console.log('🔍 Scanning database for legacy Supabase photos...');

    const users = await prisma.users.findMany({
        where: {
            avatar_url: { contains: 'supabase.co' }
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    console.log(`📊 Found ${users.length} users with legacy Supabase photos.\n`);

    if (users.length === 0) {
        console.log('✅ No users with Supabase URLs found. All photos are already migrated or clear.');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
        console.log(`-----------------------------------------------`);
        console.log(`🔄 Processing user: ${user.full_name || 'User'} (${user.email})`);
        console.log(`🔗 Current URL: ${user.avatar_url}`);

        try {
            // Extract bucket and filepath from the public Supabase URL
            // Expected format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
            const bucketAndPath = user.avatar_url.split('/object/public/')[1];
            if (!bucketAndPath) {
                throw new Error("Could not extract bucket and file path from URL.");
            }

            const bucket = bucketAndPath.split('/')[0];
            const filePath = bucketAndPath.split('/').slice(1).join('/');

            console.log(`📥 Downloading via Supabase SDK (Bucket: '${bucket}', Path: '${filePath}')...`);
            
            const { data, error } = await supabase.storage.from(bucket).download(filePath);
            
            if (error) {
                throw new Error(`Supabase Download SDK error: ${error.message || String(error)}`);
            }

            if (!data) {
                throw new Error("No data returned from Supabase download.");
            }

            console.log(`   ⚡ Downloaded! Blob size: ${data.size} bytes. Converting to Buffer...`);
            const arrayBuffer = await data.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            console.log(`📤 Uploading direct Buffer to Cloudinary...`);
            const cloudinaryUrl = await uploadBufferToCloudinary(buffer, user.id);
            console.log(`   ✨ Cloudinary URL generated: ${cloudinaryUrl}`);

            // Fetch profiles metadata to synchronize lists
            const profile = await prisma.profiles.findUnique({ where: { user_id: user.id } });
            let metadata = profile && profile.metadata ? profile.metadata : {};
            if (typeof metadata === 'string') {
                try { metadata = JSON.parse(metadata); } catch(e) { metadata = {}; }
            }

            metadata.photos = [cloudinaryUrl];

            // Update Database: users and profiles
            await prisma.users.update({
                where: { id: user.id },
                data: { avatar_url: cloudinaryUrl }
            });

            await prisma.profiles.update({
                where: { user_id: user.id },
                data: { photos: [cloudinaryUrl], metadata }
            });

            console.log(`✅ Successfully migrated ${user.email} to Cloudinary!`);
            successCount++;
        } catch (e) {
            console.error(`❌ Failed to migrate ${user.email}:`, e.message);
            failCount++;
        }

        // Debounce to respect Cloudinary / Supabase rates
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n===============================================`);
    console.log(`🎉 Migration execution finished.`);
    console.log(`📊 Success: ${successCount} | Failed: ${failCount}`);
    console.log(`===============================================`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

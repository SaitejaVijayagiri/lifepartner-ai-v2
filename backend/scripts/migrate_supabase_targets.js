const dns = require('dns');

// Force DNS servers to Google and Cloudflare
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Compliance-grade Process Level DNS Hijack to bypass local ISP DNS blocks
const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
    // Standardize arguments
    let realOptions = options;
    let realCallback = callback;
    if (typeof options === 'function') {
        realCallback = options;
        realOptions = {};
    }

    const isAll = realOptions && realOptions.all;

    // Use asynchronous DNS resolution to bypass ISP DNS poison
    dns.resolve4(hostname, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
            // Fallback to default OS resolver if resolve4 fails (e.g. for localhost/DB poolers)
            return originalLookup(hostname, realOptions, realCallback);
        }

        const family = 4;
        if (isAll) {
            // Return array of address objects
            const results = addresses.map(addr => ({ address: addr, family }));
            return realCallback(null, results);
        } else {
            // Return single address
            return realCallback(null, addresses[0], family);
        }
    });
};

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const customFetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false },
    global: {
        fetch: customFetch
    }
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

async function uploadBase64ToCloudinary(buffer, userId, index) {
    const base64 = buffer.toString('base64');
    const dataUri = `data:image/webp;base64,${base64}`;

    try {
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: `lifepartner/profiles/${userId}`,
            public_id: `photo_${index}_${Date.now()}`,
            resource_type: 'image',
            transformation: [
                { width: 1200, crop: 'limit', quality: 85, fetch_format: 'auto' }
            ],
            overwrite: false,
            timeout: 120000 // 120-second timeout
        });
        return result.secure_url;
    } catch (e) {
        console.error(`      ⚠️ Cloudinary API error:`, e.message || e);
        throw e;
    }
}

async function main() {
    const targetsPath = path.join(__dirname, '../legacy_photo_targets.json');
    if (!fs.existsSync(targetsPath)) {
        console.error(`❌ Targets file not found at ${targetsPath}. Run test_user_list.js first.`);
        return;
    }

    const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
    console.log(`🚀 Starting migration of legacy photos for ${targets.length} users with compliance DNS Hijack...\n`);

    let totalSuccess = 0;
    let totalFailed = 0;

    for (let uIndex = 0; uIndex < targets.length; uIndex++) {
        const target = targets[uIndex];
        const { user, photos } = target;

        console.log(`----------------------------------------------------------------`);
        console.log(`🔄 User [${uIndex + 1}/${targets.length}]: ${user.full_name} (${user.email})`);
        console.log(`   Found ${photos.length} legacy photo(s) on Supabase.`);

        const uploadedUrls = [];

        for (let pIndex = 0; pIndex < photos.length; pIndex++) {
            const photo = photos[pIndex];
            const fullFilePath = `${photo.folder}/${photo.name}`;
            console.log(`   📥 Downloading '${photo.bucket}/${fullFilePath}' from Supabase...`);

            try {
                const { data, error } = await supabase.storage.from(photo.bucket).download(fullFilePath);

                if (error) {
                    throw new Error(`Supabase download error: ${error.message}`);
                }

                if (!data) {
                    throw new Error('No data returned from Supabase download.');
                }

                console.log(`      ⚡ Downloaded! Size: ${data.size} bytes. Converting to Buffer...`);
                const arrayBuffer = await data.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                console.log(`      📤 Uploading base64 to Cloudinary via compliant DNS resolver...`);
                const cloudinaryUrl = await uploadBase64ToCloudinary(buffer, user.id, pIndex);
                console.log(`      ✨ Cloudinary URL: ${cloudinaryUrl}`);
                uploadedUrls.push(cloudinaryUrl);

            } catch (err) {
                console.error(`      ❌ Failed to process photo[${pIndex}]:`, err.message);
            }

            // Small delay between uploads
            await new Promise(r => setTimeout(r, 400));
        }

        if (uploadedUrls.length > 0) {
            console.log(`   💾 Updating database records for ${user.full_name}...`);
            try {
                // Fetch existing profile metadata to merge and preserve fields
                const profile = await prisma.profiles.findUnique({
                    where: { user_id: user.id }
                });

                let metadata = {};
                if (profile && profile.metadata) {
                    metadata = typeof profile.metadata === 'string' 
                        ? JSON.parse(profile.metadata) 
                        : profile.metadata;
                }
                if (!metadata || typeof metadata !== 'object') {
                    metadata = {};
                }

                // Update photos array inside metadata
                metadata.photos = uploadedUrls;

                // 1. Update users table: primary avatar
                await prisma.users.update({
                    where: { id: user.id },
                    data: { avatar_url: uploadedUrls[0] }
                });

                // 2. Update profiles table: photos array + metadata
                await prisma.profiles.update({
                    where: { user_id: user.id },
                    data: {
                        photos: uploadedUrls,
                        metadata: metadata
                    }
                });

                console.log(`   ✅ Successfully migrated ${user.full_name} to Cloudinary!`);
                totalSuccess++;
            } catch (dbErr) {
                console.error(`   ❌ Database update failed for ${user.full_name}:`, dbErr.message);
                totalFailed++;
            }
        } else {
            console.log(`   ⏭️ Skipped database update (0 successful uploads).`);
            totalFailed++;
        }

        // Delay between users
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`\n===============================================`);
    console.log(`🎉 Legacy Migration Execution Finished!`);
    console.log(`📊 Successfully Migrated: ${totalSuccess} users`);
    console.log(`📊 Failed/Skipped        : ${totalFailed} users`);
    console.log(`===============================================`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

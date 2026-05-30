const dns = require('dns');
// Override DNS servers to bypass India ISP DNS block
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
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

async function main() {
    console.log('🔍 Querying Postgres for users with no photos...');
    const users = await prisma.users.findMany({
        where: {
            age: { not: null },
            gender: { not: null }
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    const noPhotoUsers = users.filter(u => {
        const url = u.avatar_url || '';
        return !url || url.includes('dicebear') || url.trim() === '';
    });

    console.log(`📊 Found ${noPhotoUsers.length} users with no photo. Scanning Supabase buckets...\n`);

    let foundCount = 0;
    const scannedTargets = [];

    for (const user of noPhotoUsers) {
        console.log(`----------------------------------------------------------------`);
        console.log(`👤 User: ${user.full_name} (${user.email}) | ID: ${user.id}`);

        let filesFound = [];

        // Scenario 1: Bucket 'reels', Folder 'profiles/${userId}'
        try {
            const { data, error } = await supabase.storage.from('reels').list(`profiles/${user.id}`, {
                limit: 20,
                offset: 0
            });

            if (!error && data && data.length > 0) {
                for (const item of data) {
                    filesFound.push({
                        bucket: 'reels',
                        folder: `profiles/${user.id}`,
                        name: item.name,
                        size: item.metadata?.size || 0,
                        url: `https://mxzflpidclfcdqrgimqn.supabase.co/storage/v1/object/public/reels/profiles/${user.id}/${item.name}`
                    });
                }
            }
        } catch (e) {
            console.log(`   ⚠️ Error checking bucket reels: ${e.message}`);
        }

        // Scenario 2: Bucket 'profiles', Folder '${userId}'
        try {
            const { data, error } = await supabase.storage.from('profiles').list(user.id, {
                limit: 20,
                offset: 0
            });

            if (!error && data && data.length > 0) {
                for (const item of data) {
                    filesFound.push({
                        bucket: 'profiles',
                        folder: user.id,
                        name: item.name,
                        size: item.metadata?.size || 0,
                        url: `https://mxzflpidclfcdqrgimqn.supabase.co/storage/v1/object/public/profiles/${user.id}/${item.name}`
                    });
                }
            }
        } catch (e) {
            console.log(`   ⚠️ Error checking bucket profiles: ${e.message}`);
        }

        if (filesFound.length > 0) {
            console.log(`   ✨ FOUND ${filesFound.length} legacy photo(s) on Supabase!`);
            for (const f of filesFound) {
                console.log(`     📦 Bucket: '${f.bucket}' | File: '${f.name}' (${f.size} bytes)`);
                console.log(`     🔗 URL: ${f.url}`);
            }
            scannedTargets.push({
                user,
                photos: filesFound
            });
            foundCount++;
        } else {
            console.log(`   📭 No legacy files found in any bucket.`);
        }

        // Debounce to respect limits
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n===============================================`);
    console.log(`🎉 Scan finished. Found legacy files for ${foundCount} users.`);
    console.log(`===============================================`);

    // If we found any targets, write them to a JSON file so our migration script can load them!
    if (scannedTargets.length > 0) {
        const targetPath = path.join(__dirname, '../legacy_photo_targets.json');
        require('fs').writeFileSync(targetPath, JSON.stringify(scannedTargets, null, 2));
        console.log(`📁 Wrote ${scannedTargets.length} targets to ${targetPath}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

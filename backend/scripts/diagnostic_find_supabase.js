const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Executing database-wide search for "supabase" references...\n');

    // 1. Check users
    const users = await prisma.users.findMany({
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    const supabaseUsers = [];
    for (const u of users) {
        if (u.avatar_url && u.avatar_url.toLowerCase().includes('supabase')) {
            supabaseUsers.push(u);
        }
    }
    console.log(`👤 Users with "supabase" in avatar_url: ${supabaseUsers.length}`);
    for (const u of supabaseUsers) {
        console.log(`   - ${u.full_name} (${u.email}): ${u.avatar_url}`);
    }

    // 2. Check profiles
    const profiles = await prisma.profiles.findMany({
        select: {
            user_id: true,
            photos: true,
            metadata: true,
            stories: true,
            users: { select: { email: true, full_name: true } }
        }
    });

    const supabaseProfiles = [];
    const supabaseMetadata = [];
    const supabaseStories = [];

    for (const p of profiles) {
        const email = p.users?.email || 'Unknown';
        const name = p.users?.full_name || 'Unknown';

        // Check profiles.photos
        let photos = p.photos || [];
        if (typeof photos === 'string') {
            try { photos = JSON.parse(photos); } catch (e) { photos = []; }
        }
        if (Array.isArray(photos)) {
            const match = photos.filter(url => url && typeof url === 'string' && url.toLowerCase().includes('supabase'));
            if (match.length > 0) {
                supabaseProfiles.push({ id: p.user_id, name, email, photos: match });
            }
        }

        // Check profiles.metadata
        let meta = p.metadata || {};
        if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
        }
        const metaStr = JSON.stringify(meta);
        if (metaStr.toLowerCase().includes('supabase')) {
            supabaseMetadata.push({ id: p.user_id, name, email, meta });
        }

        // Check profiles.stories
        let stories = p.stories || [];
        if (typeof stories === 'string') {
            try { stories = JSON.parse(stories); } catch (e) { stories = []; }
        }
        if (Array.isArray(stories)) {
            const match = stories.filter(s => {
                const sStr = typeof s === 'string' ? s : JSON.stringify(s);
                return sStr.toLowerCase().includes('supabase');
            });
            if (match.length > 0) {
                supabaseStories.push({ id: p.user_id, name, email, stories: match });
            }
        }
    }

    console.log(`\n🖼️ Profiles with "supabase" in photos array: ${supabaseProfiles.length}`);
    for (const p of supabaseProfiles) {
        console.log(`   - ${p.name} (${p.email}):`, p.photos);
    }

    console.log(`\n📝 Profiles with "supabase" in metadata JSON: ${supabaseMetadata.length}`);
    for (const p of supabaseMetadata) {
        console.log(`   - ${p.name} (${p.email})`);
        // Find exact keys in metadata
        findAndPrintKeys(p.meta, 'supabase');
    }

    console.log(`\n📚 Profiles with "supabase" in stories JSON: ${supabaseStories.length}`);
    for (const p of supabaseStories) {
        console.log(`   - ${p.name} (${p.email}):`, p.stories);
    }

    // 3. Check reels
    const reels = await prisma.reels.findMany({
        select: {
            id: true,
            video_url: true,
            user_id: true,
            users: { select: { email: true, full_name: true } }
        }
    });
    const supabaseReels = reels.filter(r => r.video_url && r.video_url.toLowerCase().includes('supabase'));
    console.log(`\n📹 Reels with "supabase" in video_url: ${supabaseReels.length}`);
    for (const r of supabaseReels) {
        console.log(`   - Reel ${r.id} by ${r.users?.full_name || 'Unknown'} (${r.users?.email || 'Unknown'}): ${r.video_url}`);
    }

    // 4. Check verification requests
    const verifications = await prisma.verification_requests.findMany({
        select: {
            id: true,
            document_url: true,
            user_id: true,
            users: { select: { email: true, full_name: true } }
        }
    });
    const supabaseVers = verifications.filter(v => v.document_url && v.document_url.toLowerCase().includes('supabase'));
    console.log(`\n🪪 Verification requests with "supabase" in document_url: ${supabaseVers.length}`);
    for (const v of supabaseVers) {
        console.log(`   - Req ${v.id} by ${v.users?.full_name || 'Unknown'} (${v.users?.email || 'Unknown'}): ${v.document_url}`);
    }
}

function findAndPrintKeys(obj, searchStr, prefix = '') {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        const currentPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'string' && val.toLowerCase().includes(searchStr)) {
            console.log(`     └─ [${currentPrefix}]: ${val}`);
        } else if (typeof val === 'object' && val !== null) {
            findAndPrintKeys(val, searchStr, currentPrefix);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

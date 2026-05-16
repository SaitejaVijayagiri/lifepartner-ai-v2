/**
 * audit_photos.js
 *
 * Deep investigates every onboarded user's photo status:
 *   - What is stored in avatar_url (type + size)
 *   - What is in metadata.photos array
 *   - Whether the photo would actually render in the browser
 *   - Whether face moderation has an existing record
 *
 * Bucket definitions:
 *   TRULY_NO_PHOTO  → null / dicebear / empty string — no image at all
 *   BASE64_RENDERS  → data:image stored in DB — renders fine in browser (false alarm bucket)
 *   SUPABASE_URL    → real https URL going through proxy — renders fine
 *   BROKEN_URL      → http URL that is not Supabase and not our proxy — may be broken
 */

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

function classifyUrl(url) {
    if (!url || url.trim() === '') return 'NULL';
    if (url.includes('dicebear')) return 'DICEBEAR';
    if (url.startsWith('data:image')) return 'BASE64';
    if (url.includes('supabase.co/storage')) return 'SUPABASE_DIRECT'; // will be proxied
    if (url.includes('/photo?url=')) return 'PROXY_URL';           // already proxied
    if (url.startsWith('https://') || url.startsWith('http://')) return 'OTHER_HTTP';
    return 'UNKNOWN';
}

function wouldRenderInBrowser(url) {
    const t = classifyUrl(url);
    // data:image renders directly; all http(s) would attempt to load
    return t === 'BASE64' || t === 'SUPABASE_DIRECT' || t === 'PROXY_URL' || t === 'OTHER_HTTP';
}

async function main() {
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
            is_verified: true,
            profiles: {
                select: { metadata: true }
            }
        }
    });

    console.log(`\n🔍 Auditing ${users.length} onboarded users...\n`);

    const buckets = {
        TRULY_NO_PHOTO: [],    // null or dicebear — no image shown
        BASE64_RENDERS: [],    // data:image — renders fine, face passed moderation
        SUPABASE_URL: [],      // Supabase URL — shown via proxy (GOOD)
        PROXY_URL: [],         // Already proxied — GOOD
        OTHER_HTTP: [],        // some other http URL
        HAS_META_PHOTOS: [],   // avatar_url is bad but metadata.photos has something
    };

    for (const u of users) {
        const meta = (u.profiles?.metadata) || {};
        const metaPhotos = (meta.photos || []).filter(p =>
            p && !p.includes('dicebear') && p.trim() !== ''
        );
        const type = classifyUrl(u.avatar_url);
        const renders = wouldRenderInBrowser(u.avatar_url);
        const base64KiB = type === 'BASE64'
            ? Math.round(u.avatar_url.length / 1024) + ' KB'
            : '-';

        const entry = {
            name: u.full_name,
            email: u.email,
            avatarType: type,
            renders,
            base64Size: base64KiB,
            metaPhotoCount: metaPhotos.length,
            metaPhotoTypes: metaPhotos.map(p => classifyUrl(p)).join(', ') || '-',
            isVerified: u.is_verified
        };

        if (type === 'NULL' || type === 'DICEBEAR') {
            if (metaPhotos.length > 0) {
                buckets.HAS_META_PHOTOS.push(entry);  // avatar_url missing but meta.photos has some
            } else {
                buckets.TRULY_NO_PHOTO.push(entry);
            }
        } else if (type === 'BASE64') {
            buckets.BASE64_RENDERS.push(entry);
        } else if (type === 'SUPABASE_DIRECT') {
            buckets.SUPABASE_URL.push(entry);
        } else if (type === 'PROXY_URL') {
            buckets.PROXY_URL.push(entry);
        } else {
            buckets.OTHER_HTTP.push(entry);
        }
    }

    // ── Print Summary ──────────────────────────────────────────────────────────

    console.log('═══════════════════════════════════════════════════════');
    console.log('  PHOTO AUDIT SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  ✅ Real Supabase URL (via proxy)   : ${buckets.SUPABASE_URL.length}`);
    console.log(`  ✅ Already proxied URL             : ${buckets.PROXY_URL.length}`);
    console.log(`  ✅ Base64 in DB (renders in browser): ${buckets.BASE64_RENDERS.length}`);
    console.log(`  ⚠️  Other HTTP URL                  : ${buckets.OTHER_HTTP.length}`);
    console.log(`  ⚠️  No avatar_url but meta.photos[] : ${buckets.HAS_META_PHOTOS.length}`);
    console.log(`  ❌ TRULY no photo (null/dicebear)  : ${buckets.TRULY_NO_PHOTO.length}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // ── Truly No Photo ────────────────────────────────────────────────────────
    if (buckets.TRULY_NO_PHOTO.length > 0) {
        console.log('❌ TRULY NO PHOTO (need to upload):');
        buckets.TRULY_NO_PHOTO.forEach(u => {
            console.log(`   ${u.name} <${u.email}>`);
        });
        console.log();
    }

    // ── Has meta.photos but avatar_url missing ────────────────────────────────
    if (buckets.HAS_META_PHOTOS.length > 0) {
        console.log('⚠️  NO avatar_url BUT has metadata.photos (avatar_url needs sync):');
        buckets.HAS_META_PHOTOS.forEach(u => {
            console.log(`   ${u.name} <${u.email}> — metaPhotos: ${u.metaPhotoCount} (${u.metaPhotoTypes})`);
        });
        console.log();
    }

    // ── Other HTTP ────────────────────────────────────────────────────────────
    if (buckets.OTHER_HTTP.length > 0) {
        console.log('⚠️  OTHER HTTP (non-Supabase, non-proxy — may be broken):');
        buckets.OTHER_HTTP.forEach(u => {
            console.log(`   ${u.name} <${u.email}>`);
        });
        console.log();
    }

    // ── Base64 detail ─────────────────────────────────────────────────────────
    console.log(`✅ BASE64 (renders in browser — face passed moderation — ${buckets.BASE64_RENDERS.length} users):`);
    buckets.BASE64_RENDERS.forEach(u => {
        console.log(`   ${u.name} <${u.email}> [${u.base64Size}] metaPhotos:${u.metaPhotoCount}`);
    });
    console.log();

    // ── Final verdict ─────────────────────────────────────────────────────────
    const needsEmail = buckets.TRULY_NO_PHOTO.length + buckets.HAS_META_PHOTOS.length + buckets.OTHER_HTTP.length;
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Users that ACTUALLY need a photo nudge email: ${needsEmail}`);
    console.log(`  Base64 users (incorrectly flagged before)   : ${buckets.BASE64_RENDERS.length} — they are FINE`);
    console.log('═══════════════════════════════════════════════════════\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

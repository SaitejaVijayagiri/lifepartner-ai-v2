import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const prisma = new PrismaClient();

async function main() {
    // 1. Create the 'images' bucket if it does not exist
    console.log("=== Checking / Creating 'images' bucket... ===");
    const { data: buckets } = await supabase.storage.listBuckets();
    const imagesBucket = buckets?.find(b => b.name === 'images');

    if (!imagesBucket) {
        const { data, error } = await supabase.storage.createBucket('images', { public: true });
        if (error) {
            console.error("❌ Failed to create 'images' bucket:", error.message);
        } else {
            console.log("✅ Created 'images' bucket as public.");
        }
    } else {
        console.log("✅ 'images' bucket already exists.");
        if (!imagesBucket.public) {
            console.warn("⚠️  'images' bucket is PRIVATE! Updating to public...");
            await supabase.storage.updateBucket('images', { public: true });
            console.log("✅ Updated 'images' bucket to public.");
        }
    }

    // 2. Scan all user avatar_url values in the database
    console.log("\n=== Scanning all avatar_url values in database... ===");
    const users = await prisma.users.findMany({
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    let nullCount = 0, brokenCount = 0, goodCount = 0;
    const broken: string[] = [];

    for (const u of users) {
        if (!u.avatar_url) {
            nullCount++;
            continue;
        }

        try {
            // Quick HEAD request to check reachability
            const res = await fetch(u.avatar_url, { method: 'HEAD' });
            if (res.ok) {
                goodCount++;
            } else {
                brokenCount++;
                broken.push(`${u.email}: HTTP ${res.status} → ${u.avatar_url.substring(0, 70)}`);
            }
        } catch (e: any) {
            brokenCount++;
            broken.push(`${u.email}: FETCH_ERROR → ${u.avatar_url.substring(0, 70)}`);
        }
    }

    console.log(`\n=== Image URL Audit Results (${users.length} users) ===`);
    console.log(`  ✅ Accessible: ${goodCount}`);
    console.log(`  ⚠️  Null/No Image: ${nullCount}`);
    console.log(`  ❌ Broken/Inaccessible: ${brokenCount}`);
    if (broken.length > 0) {
        console.log("\n  --- Broken URLs ---");
        broken.forEach(b => console.log("  •", b));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

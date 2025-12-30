
import { prisma } from '../src/prisma';
import fs from 'fs';
import path from 'path';

async function audit() {
    console.log("🔍 Starting LifePartner AI System Audit...\n");
    let issues = 0;

    // 1. Environment Check
    console.log("1. Checking Environment Variables...");
    const criticalVars = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'RESEND_API_KEY', 'NEXT_PUBLIC_API_URL'];
    criticalVars.forEach(v => {
        if (!process.env[v]) {
            console.error(`   ❌ Missing ${v}`);
            issues++;
        } else {
            console.log(`   ✅ ${v} is set`);
        }
    });

    // 2. Database Connection
    console.log("\n2. Testing Database Connection...");
    try {
        await prisma.$connect();
        console.log("   ✅ Database Connected (Prisma)");
    } catch (e) {
        console.error("   ❌ Database Connection Failed", e);
        issues++;
        return; // Critical failure
    }

    // 3. User Data Integrity (Zombie Accounts)
    console.log("\n3. Checking User Data Integrity...");
    const zombies = await prisma.users.count({
        where: {
            is_verified: true,
            OR: [
                { gender: null },
                { age: null }
            ]
        }
    });
    if (zombies > 0) {
        console.warn(`   ⚠️ Found ${zombies} VERIFIED users with incomplete profiles (Invisible Users).`);
        // List them for debug
        const zombieList = await prisma.users.findMany({
            where: { is_verified: true, OR: [{ gender: null }, { age: null }] },
            select: { email: true, full_name: true }
        });
        console.table(zombieList);
        // Not an error per se, but a warning
    } else {
        console.log("   ✅ All verified users have complete profiles (Gender/Age set).");
    }

    // 4. Matching Logic Sanity Check
    console.log("\n4. Verifying Matching Pool Indices...");
    const females = await prisma.users.count({ where: { gender: { equals: 'Female', mode: 'insensitive' } } });
    const males = await prisma.users.count({ where: { gender: { equals: 'Male', mode: 'insensitive' } } });
    console.log(`   ℹ️  Females: ${females}`);
    console.log(`   ℹ️  Males: ${males}`);

    if (females === 0 && males === 0) {
        console.warn("   ⚠️ Database is empty. No matching possible.");
    } else {
        console.log("   ✅ User pool exists.");
    }

    // 5. Frontend Assets Check (File System)
    console.log("\n5. Verifying Critical Frontend Assets...");
    // Going up to root from backend/scripts
    const webRoot = path.join(__dirname, '../../apps/web');
    const assets = [
        'public/icon.png',
        'public/favicon.ico',
        'public/icons/google.svg',
        'app/layout.tsx',
        'app/auth/callback/google/page.tsx' // Logic check
    ];

    assets.forEach(f => {
        if (fs.existsSync(path.join(webRoot, f))) {
            console.log(`   ✅ Found ${f}`);
        } else {
            console.error(`   ❌ Missing ${f}`);
            issues++;
        }
    });

    console.log(`\n🏁 Audit Complete. Issues Found: ${issues}`);
}

audit()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

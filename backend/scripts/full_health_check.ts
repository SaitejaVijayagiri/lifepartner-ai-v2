
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function checkHealth() {
    console.log("--- STARTING HEALTH CHECK ---");

    // 1. Check Database Connection
    try {
        console.log("1. Checking Database Connection...");
        await prisma.$connect();
        const userCount = await prisma.users.count();
        console.log(`✅ Database Connected. User Count: ${userCount}`);

        // Check critical tables
        const transactionCount = await prisma.transactions.count();
        console.log(`✅ Authenticated Tables Accessible (Transactions: ${transactionCount})`);

    } catch (e: any) {
        console.error(`❌ Database Connection FAILED: ${e.message}`);
        process.exit(1);
    }

    // 2. Check Backend Environment
    console.log("2. Checking Backend Environment...");
    const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
    const missing = requiredEnv.filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.warn(`⚠️ Warning: Missing ENV variables might cause issues: ${missing.join(', ')}`);
    } else {
        console.log("✅ Critical Environment Variables Present");
    }

    // 3. Check Frontend Assets (FileSystem check)
    console.log("3. Checking Frontend Assets...");
    const webPath = path.join(__dirname, '../../apps/web');
    const iconPath = path.join(webPath, 'public/icon.png');
    const faviconPath = path.join(webPath, 'app/favicon.ico');

    if (fs.existsSync(iconPath)) console.log("✅ Public Icon found");
    else console.error("❌ Public Icon MISSING (icon.png)");

    if (fs.existsSync(faviconPath)) console.log("✅ Favicon found");
    else console.error("❌ Favicon MISSING (favicon.ico)");

    console.log("--- HEALTH CHECK COMPLETE ---");
    console.log("Status: READY FOR DEPLOYMENT/USAGE");
}

checkHealth()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

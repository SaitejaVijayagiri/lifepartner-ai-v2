const { PrismaClient } = require('@prisma/client');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log("👑 Starting Female VIP Queen Upgrade Migration...");

    const females = await prisma.users.findMany({
        where: {
            OR: [
                { gender: { equals: 'Female', mode: 'insensitive' } },
                { gender: { equals: 'Woman', mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            full_name: true,
            email: true,
            coins: true,
            free_direct_messages: true,
            is_premium: true
        }
    });

    console.log(`Found ${females.length} female users to upgrade.`);

    let upgraded = 0;
    for (const f of females) {
        const newCoins = Math.max((f.coins || 0), 100);
        await prisma.users.update({
            where: { id: f.id },
            data: {
                free_direct_messages: 999999,
                is_premium: true,
                coins: newCoins
            }
        });

        // Add Queen VIP Notification
        try {
            await prisma.notifications.create({
                data: {
                    user_id: f.id,
                    type: 'VIP_UPGRADE',
                    message: '👑 You are upgraded to Lifetime Queen VIP! Enjoy 100% Free Unlimited Direct Messaging, 100 Coins, and AI Anti-Creep Protection.',
                    data: {
                        badge: 'QUEEN_VIP',
                        perks: ['UNLIMITED_MESSAGES', 'ANTI_CREEP_SHIELD', 'VERIFIED_BOOST']
                    }
                }
            });
        } catch (notifErr) {
            console.error(`Notif failed for ${f.email}:`, notifErr.message);
        }

        upgraded++;
        console.log(`✅ [${upgraded}/${females.length}] Upgraded ${f.full_name || f.email} -> VIP, 999999 msgs, ${newCoins} coins`);
    }

    console.log(`\n🎉 Successfully upgraded all ${upgraded} female users to Queen VIP!`);
    await prisma.$disconnect();
}

main().catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
});

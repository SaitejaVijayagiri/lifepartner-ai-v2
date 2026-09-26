import { prisma } from '../src/prisma';

async function auditTraffic() {
    console.log('======================================================');
    console.log('📊 SITE TRAFFIC & GLOBAL USER CONVERSION AUDIT');
    console.log('======================================================\n');

    // 1. Site Views Counter
    try {
        const views: any[] = await prisma.$queryRawUnsafe(`SELECT * FROM site_views_counter WHERE id = 'global'`);
        console.log('1. Site Views Counter (Global):');
        console.log(views);
    } catch (e: any) {
        console.error('Error fetching site_views_counter:', e.message);
    }

    // 2. Daily Analytics (last 7 days)
    try {
        const daily: any[] = await prisma.$queryRawUnsafe(`
            SELECT to_char(date, 'YYYY-MM-DD') as date_str, views, unique_visitors, countries, top_paths
            FROM daily_site_analytics
            ORDER BY date DESC
            LIMIT 7
        `);
        console.log('\n2. Daily Site Analytics (Recent Days):');
        console.log(JSON.stringify(daily, null, 2));
    } catch (e: any) {
        console.error('Error fetching daily_site_analytics:', e.message);
    }

    // 3. User Signups & Geographic Distribution
    try {
        const totalUsers = await prisma.users.count();
        const verifiedUsers = await prisma.users.count({ where: { is_verified: true } });
        const usersLast7Days = await prisma.users.count({
            where: {
                created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        });

        console.log('\n3. User Registration Metrics:');
        console.log(`   Total Users: ${totalUsers}`);
        console.log(`   Verified Users: ${verifiedUsers}`);
        console.log(`   New Signups in Last 7 Days: ${usersLast7Days}`);

        // Phone numbers / Country codes
        const sampleUsers = await prisma.users.findMany({
            take: 20,
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                location_name: true,
                city: true,
                created_at: true
            }
        });
        console.log('\n4. Recent 20 Signups:');
        console.log(JSON.stringify(sampleUsers, null, 2));

    } catch (e: any) {
        console.error('Error fetching user stats:', e.message);
    }
}

auditTraffic().catch(console.error).finally(() => process.exit(0));

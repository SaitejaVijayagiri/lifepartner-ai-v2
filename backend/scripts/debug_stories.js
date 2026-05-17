const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    // Check ALL stories (including expired) for test developer
    const profiles = await p.profiles.findMany({
        select: { user_id: true, metadata: true, stories: true },
    });

    console.log('\n=== All stories (including expired) ===');
    const now = new Date();
    let found = false;
    for (const prof of profiles) {
        const meta = prof.metadata || {};
        const stories = Array.isArray(prof.stories) ? prof.stories : (meta.stories || []);

        if (stories.length > 0) {
            found = true;
            const user = await p.users.findUnique({
                where: { id: prof.user_id },
                select: { full_name: true, gender: true, email: true }
            });
            console.log(`\nUser: ${user?.full_name} | Gender: [${user?.gender}] | Email: ${user?.email}`);
            stories.forEach(s => {
                const exp = new Date(s.expiresAt);
                const expired = exp < now;
                console.log(`  - ID: ${s.id}`);
                console.log(`    URL: ${s.url}`);
                console.log(`    ExpiresAt: ${s.expiresAt} (${expired ? '❌ EXPIRED' : '✅ ACTIVE'})`);
            });
        }
    }
    if (!found) {
        console.log('No stories found at all in any profile (neither metadata.stories nor profiles.stories column)');
    }

    await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

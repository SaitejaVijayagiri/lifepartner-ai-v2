import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Extracting all unique image domains...");
    const users = await prisma.users.findMany({
        select: { avatar_url: true }
    });

    const domains = new Map<string, number>();

    users.forEach(u => {
        if (!u.avatar_url) {
            domains.set('NULL', (domains.get('NULL') || 0) + 1);
            return;
        }
        try {
            const url = new URL(u.avatar_url);
            domains.set(url.hostname, (domains.get(url.hostname) || 0) + 1);
        } catch (e) {
            domains.set('INVALID_URL', (domains.get('INVALID_URL') || 0) + 1);
            console.log("Invalid URL found:", u.avatar_url);
        }
    });

    console.log(`\n--- Domain Distribution (${users.length} total users) ---`);
    for (const [domain, count] of domains.entries()) {
        console.log(`${domain}: ${count}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

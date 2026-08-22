import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from './prisma';

async function main() {
    console.log("Looking up Ritesh Jain...");
    const users = await prisma.users.findMany({
        where: {
            full_name: {
                contains: "Ritesh Jain",
                mode: "insensitive"
            }
        },
        include: {
            profiles: true
        }
    });

    if (users.length === 0) {
        console.log("No user found.");
        return;
    }

    for (const u of users) {
        console.log(`\nUser: ${u.full_name} (${u.email})`);
        if (u.profiles) {
            const meta: any = u.profiles.metadata || {};
            console.log(`Metadata Location: ${JSON.stringify(meta.location, null, 2)}`);
            console.log(`Metadata City: ${meta.city}`);
            console.log(`Metadata State: ${meta.state}`);
        } else {
            console.log("No profile found for user.");
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

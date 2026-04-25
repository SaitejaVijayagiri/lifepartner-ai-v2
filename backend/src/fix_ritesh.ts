import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from './prisma';

async function main() {
    console.log("Fixing Ritesh Jain's profile location...");
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

    for (const u of users) {
        if (u.profiles) {
            const meta: any = u.profiles.metadata || {};
            
            if (meta.location && meta.location.district === "Ritesh Jain") {
                console.log(`Found bad district for ${u.full_name}, fixing...`);
                // Clear the bad district
                meta.location.district = meta.location.city || "";
                
                await prisma.profiles.update({
                    where: { user_id: u.id },
                    data: {
                        metadata: meta
                    }
                });
                console.log(`✅ Fixed profile for ${u.full_name}`);
            }
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

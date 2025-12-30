
import { prisma } from '../src/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    try {
        const realUsers = await prisma.users.findMany({
            where: {
                email: {
                    contains: '@gmail.com',
                    mode: 'insensitive'
                }
            },
            select: {
                full_name: true,
                email: true,
                avatar_url: true,
                profiles: {
                    select: {
                        metadata: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        let output = "User Profile Pictures:\n\n";
        realUsers.forEach(user => {
            const metadata = user.profiles?.metadata as any || {};
            const photos = metadata.photos || [];

            output += `User: ${user.full_name} (${user.email})\n`;
            output += `Avatar URL: ${user.avatar_url || 'N/A'}\n`;
            if (photos.length > 0) {
                output += `Additional Photos:\n`;
                photos.forEach((p: string) => output += `  - ${p}\n`);
            } else {
                output += `Additional Photos: None\n`;
            }
            output += "\n------------------------------------------------\n\n";
        });

        const outputPath = path.join(__dirname, '../profile_pics_output.txt');
        fs.writeFileSync(outputPath, output);
        console.log(`Successfully wrote to ${outputPath}`);

    } catch (error) {
        console.error('Error fetching pics:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();


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
                id: true,
                full_name: true,
                email: true,
                is_verified: true,
                created_at: true,
                gender: true,
                age: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        const output = JSON.stringify(realUsers, null, 2);
        const outputPath = path.join(__dirname, '../users_gmail.txt');

        fs.writeFileSync(outputPath, output);
        console.log(`Successfully wrote ${realUsers.length} users to ${outputPath}`);

    } catch (error) {
        console.error('Error finding users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

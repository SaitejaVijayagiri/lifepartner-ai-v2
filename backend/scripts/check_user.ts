import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'saitejavijayagiri123@gmail.com';
    const password = 'Saitejauday@0102';

    console.log(`Checking user: ${email}`);
    const user = await prisma.users.findUnique({
        where: { email },
    });

    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log('User found:', {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_verified: user.is_verified,
        is_admin: user.is_admin,
        created_at: user.created_at,
    });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`Password valid: ${validPassword}`);

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

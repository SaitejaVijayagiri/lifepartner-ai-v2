
import { prisma } from '../src/prisma';

async function main() {
    const c = await prisma.users.findUnique({
        where: { email: 'crternikar@gmail.com' },
        select: { full_name: true, gender: true }
    });
    console.log("User:", c);
}
main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    select: { id: true, email: true, avatar_url: true, full_name: true },
    where: { avatar_url: { not: null } },
    take: 5
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

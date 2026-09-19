const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const dotenv = require('dotenv');
dotenv.config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const verifiedFemales = await prisma.users.count({ where: { gender: 'Female', is_verified: true } });
  const unverifiedFemales = await prisma.users.count({ where: { gender: 'Female', is_verified: false } });
  const verifiedMales = await prisma.users.count({ where: { gender: 'Male', is_verified: true } });
  const unverifiedMales = await prisma.users.count({ where: { gender: 'Male', is_verified: false } });

  console.log({
    verifiedFemales,
    unverifiedFemales,
    totalFemales: verifiedFemales + unverifiedFemales,
    verifiedMales,
    unverifiedMales,
    totalMales: verifiedMales + unverifiedMales
  });

  const unverifiedFemaleList = await prisma.users.findMany({
    where: { gender: 'Female', is_verified: false },
    select: { id: true, full_name: true, email: true, created_at: true }
  });
  console.log(`Unverified females (${unverifiedFemaleList.length}):`, unverifiedFemaleList);
}

check().catch(console.error).finally(() => prisma.$disconnect());

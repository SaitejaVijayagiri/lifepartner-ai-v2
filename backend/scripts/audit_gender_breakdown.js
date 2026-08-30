const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function runAudit() {
  const completeMales = await prisma.users.count({ where: { gender: { equals: 'Male', mode: 'insensitive' }, age: { not: null }, is_verified: true } });
  const completeFemales = await prisma.users.count({ where: { gender: { equals: 'Female', mode: 'insensitive' }, age: { not: null }, is_verified: true } });
  const totalVerified = await prisma.users.count({ where: { is_verified: true } });
  const totalUnverified = await prisma.users.count({ where: { is_verified: false } });
  
  console.log('Complete Verified Males:', completeMales);
  console.log('Complete Verified Females:', completeFemales);
  console.log('Total Verified Users:', totalVerified);
  console.log('Total Unverified Users:', totalUnverified);

  // Check Female users list
  const females = await prisma.users.findMany({
    where: { gender: { equals: 'Female', mode: 'insensitive' } },
    select: { id: true, email: true, full_name: true, age: true, is_verified: true, avatar_url: true, created_at: true }
  });
  console.log('\n--- FEMALE USERS (' + females.length + ') ---');
  console.table(females.map(f => ({
    Email: f.email,
    Name: f.full_name,
    Age: f.age,
    Verified: f.is_verified,
    HasAvatar: Boolean(f.avatar_url),
    Created: f.created_at
  })));
}

runAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function main() {
  console.log("==========================================");
  console.log("       DETAILED USER ISSUES AUDIT        ");
  console.log("==========================================");

  // 1. Users created in August & September 2026
  const recentUsers = await prisma.users.findMany({
    where: {
      created_at: {
        gte: new Date('2026-08-01')
      }
    },
    orderBy: { created_at: 'desc' },
    include: {
      profiles: true,
      device_tokens: true
    }
  });

  console.log(`\n📅 Users created since Aug 1, 2026: ${recentUsers.length}`);
  recentUsers.forEach((u, i) => {
    console.log(`[${i+1}] ${u.full_name || 'NO_NAME'} | ${u.email} | Gender: ${u.gender || 'NULL'} | Age: ${u.age || 'NULL'} | City: ${u.city || u.location_name || 'NULL'} | Avatar: ${u.avatar_url ? 'YES' : 'NO'} | Profile photos: ${u.profiles?.photos?.length || 0} | DeviceTokens: ${u.device_tokens?.length || 0} | Created: ${u.created_at}`);
  });

  // 2. Look for users with 0 matches or stuck onboarding
  const allUsersCount = await prisma.users.count();
  const usersWithNoMatches = await prisma.users.findMany({
    where: {
      gender: { not: null },
      matches_matches_user_a_idTousers: { none: {} },
      matches_matches_user_b_idTousers: { none: {} }
    },
    select: { id: true, email: true, full_name: true, gender: true, created_at: true }
  });
  console.log(`\n💔 Onboarded users with ZERO matches: ${usersWithNoMatches.length}`);
  usersWithNoMatches.slice(0, 10).forEach(u => {
    console.log(`  - ${u.full_name} (${u.email}) [${u.gender}] Created: ${u.created_at}`);
  });

  // 3. Interactions breakdown
  const interactions = await prisma.interactions.groupBy({
    by: ['type', 'status'],
    _count: true
  });
  console.log('\n🤝 Interactions summary:');
  console.table(interactions);

  // 4. Check Lounge Messages
  const loungeMessages = await prisma.lounge_messages.findMany({
    orderBy: { created_at: 'desc' },
    take: 20,
    include: {
      users: { select: { email: true, full_name: true } }
    }
  });
  console.log(`\n☕ Lounge Messages (${loungeMessages.length}):`);
  loungeMessages.forEach(m => {
    console.log(`  [${m.created_at}] ${m.users?.full_name}: "${m.content}"`);
  });

  // 5. Check Call Logs
  const callLogs = await prisma.call_logs.findMany({
    orderBy: { started_at: 'desc' },
    take: 10,
    include: {
      users_call_logs_caller_idTousers: { select: { email: true, full_name: true } },
      users_call_logs_receiver_idTousers: { select: { email: true, full_name: true } }
    }
  });
  console.log(`\n📞 Call Logs (${callLogs.length}):`);
  callLogs.forEach(c => {
    console.log(`  [${c.started_at}] ${c.users_call_logs_caller_idTousers?.full_name} -> ${c.users_call_logs_receiver_idTousers?.full_name} | Type: ${c.type} | Status: ${c.status} | Duration: ${c.duration_seconds}s`);
  });

  // 6. Check unread notifications / notification volume
  const notificationsCount = await prisma.notifications.count();
  const unreadNotificationsCount = await prisma.notifications.count({ where: { is_read: false } });
  console.log(`\n🔔 Notifications: Total ${notificationsCount}, Unread ${unreadNotificationsCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

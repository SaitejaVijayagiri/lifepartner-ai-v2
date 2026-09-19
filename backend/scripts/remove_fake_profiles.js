const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("🔍 Scanning for fake, seed, and test profiles...");

  const allUsers = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      full_name: true,
      gender: true,
      age: true,
      is_admin: true,
      is_verified: true,
      created_at: true,
    },
    orderBy: { created_at: 'asc' }
  });

  const fakeUsers = [];
  const genuineUsers = [];

  for (const u of allUsers) {
    // Admin is NEVER fake
    if (u.is_admin) {
      genuineUsers.push(u);
      continue;
    }

    const email = (u.email || '').toLowerCase().trim();
    const name = (u.full_name || '').toLowerCase().trim();
    const domain = email.split('@')[1] || '';

    // Criteria for fake, seed, test accounts:
    const isSeedDomain = domain === 'lifepartnerai.in' || domain === 'example.com';
    const isTempDomain = ['30minemail.com', 'aspensif.com', 'brixozu.com', 'fanchatu.com', 'cadebek.com', 'adsprite.com', 'luxudata.com', 'soco7.com'].includes(domain);
    const isTestEmail = email.startsWith('test_flow') || email === 'sai@email.com' || email.includes('test-signup');
    const isTestName = name === 'test user' || name === 'verified user' || name === 'flow test' || (name === 'lifepartner' && email.includes('lifepartnerai'));

    if (isSeedDomain || isTempDomain || isTestEmail || isTestName) {
      fakeUsers.push(u);
    } else {
      genuineUsers.push(u);
    }
  }

  const fakeIds = fakeUsers.map(u => u.id);
  console.log(`Found ${fakeIds.length} fake/seed/test accounts to remove.`);
  console.log(`Preserving ${genuineUsers.length} genuine accounts.`);

  if (fakeIds.length === 0) {
    console.log("No fake profiles found to remove.");
    await prisma.$disconnect();
    return;
  }

  console.log("\n🧹 Removing related dependencies in safe order...");

  await prisma.$transaction(async (tx) => {
    // 1. Blocks
    const deletedBlocks = await tx.blocks.deleteMany({
      where: {
        OR: [
          { blocker_id: { in: fakeIds } },
          { blocked_id: { in: fakeIds } }
        ]
      }
    });
    console.log(`- Deleted ${deletedBlocks.count} blocks`);

    // 2. Call Logs
    const deletedCallLogs = await tx.call_logs.deleteMany({
      where: {
        OR: [
          { caller_id: { in: fakeIds } },
          { receiver_id: { in: fakeIds } }
        ]
      }
    });
    console.log(`- Deleted ${deletedCallLogs.count} call logs`);

    // 3. Messages
    const deletedMessages = await tx.messages.deleteMany({
      where: {
        OR: [
          { sender_id: { in: fakeIds } },
          { receiver_id: { in: fakeIds } }
        ]
      }
    });
    console.log(`- Deleted ${deletedMessages.count} messages`);

    // 4. Interactions
    const deletedInteractions = await tx.interactions.deleteMany({
      where: {
        OR: [
          { from_user_id: { in: fakeIds } },
          { to_user_id: { in: fakeIds } }
        ]
      }
    });
    console.log(`- Deleted ${deletedInteractions.count} interactions`);

    // 5. Matches
    const deletedMatches = await tx.matches.deleteMany({
      where: {
        OR: [
          { user_a_id: { in: fakeIds } },
          { user_b_id: { in: fakeIds } }
        ]
      }
    });
    console.log(`- Deleted ${deletedMatches.count} matches`);

    // 6. Device Tokens
    const deletedTokens = await tx.device_tokens.deleteMany({
      where: { user_id: { in: fakeIds } }
    });
    console.log(`- Deleted ${deletedTokens.count} device tokens`);

    // 7. Notifications
    const deletedNotifs = await tx.notifications.deleteMany({
      where: { user_id: { in: fakeIds } }
    });
    console.log(`- Deleted ${deletedNotifs.count} notifications`);

    // 8. Transactions
    const deletedTx = await tx.transactions.deleteMany({
      where: { user_id: { in: fakeIds } }
    });
    console.log(`- Deleted ${deletedTx.count} transactions`);

    // 9. Profiles
    const deletedProfiles = await tx.profiles.deleteMany({
      where: { user_id: { in: fakeIds } }
    });
    console.log(`- Deleted ${deletedProfiles.count} profiles`);

    // 10. Users
    const deletedUsers = await tx.users.deleteMany({
      where: { id: { in: fakeIds } }
    });
    console.log(`- Deleted ${deletedUsers.count} users from users table`);
  });

  // Verify remaining users
  const remainingUsers = await prisma.users.count();
  const remainingFemales = await prisma.users.count({ where: { gender: { in: ['Female', 'female'] } } });
  const remainingMales = await prisma.users.count({ where: { gender: { in: ['Male', 'male'] } } });

  console.log("\n==========================================");
  console.log(`✅ SUCCESS: All fake profiles removed.`);
  console.log(`Total Genuine Users Remaining: ${remainingUsers}`);
  console.log(`- Genuine Females: ${remainingFemales}`);
  console.log(`- Genuine Males: ${remainingMales}`);
  console.log("==========================================");

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("❌ Error during removal:", e);
  process.exit(1);
});

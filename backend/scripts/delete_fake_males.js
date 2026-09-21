const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Confirmed Fake, Dummy, Test & Duplicate Male Accounts
const PROFILES_TO_REMOVE = [
  // 1. Obvious Dummy / Test Accounts
  {
    id: 'ea300803-b5d6-4c91-8b43-2430fd11eb45',
    name: 'Test',
    email: 't6491214@gmail.com',
    reason: 'Explicit test account with name "Test"'
  },
  {
    id: 'd0e729d7-6ab8-4432-bccb-1fd1a325b310',
    name: 'Xyz',
    email: 'Xyz.com',
    reason: 'Fake dummy account with invalid email "Xyz.com"'
  },
  {
    id: 'ef494bee-9907-48fd-acf0-31e33a733a24',
    name: 'Uuuuu',
    email: 'sitaramgouda2402@gmail.com',
    reason: 'Gibberish placeholder name "Uuuuu", unverified, 0 activity'
  },
  {
    id: '984dbe36-2dbf-4375-9f4f-dd77f14d3627',
    name: 'hiding fox',
    email: 'arjun9@gmail.com',
    reason: 'Dummy pseudonym "hiding fox", unverified, 0 activity'
  },
  {
    id: 'c500d85b-7634-4a2b-a16e-efff51be96e1',
    name: 'Rqj',
    email: 'raj@gmail.com',
    reason: 'Fake typo registration "Rqj", unverified, 0 activity'
  },
  {
    id: '8112fe96-0068-40a8-a66b-e7259af4fee4',
    name: 'King',
    email: 'king98@gmail.com',
    reason: 'Dummy pseudonym "King", unverified, 0 activity'
  },
  {
    id: '137a28d4-1579-409b-be85-2ec997edbcf9',
    name: 'Remo romeo',
    email: 'romeoremo104@gmail.com',
    reason: 'Dummy test name "Remo romeo", unverified, 0 activity'
  },
  {
    id: '6642d48b-cabf-4ee6-a011-c05315454002',
    name: 'APOSTLE DR GODSLOVE McCHRIST',
    email: 'godslovemcchrist333@gmail.com',
    reason: 'Spam/bot profile, unverified, 0 activity'
  },
  {
    id: '42255807-00bc-4cb0-a5f7-60c876dbd26b',
    name: 'Rae',
    email: 'guahej@gmail.com',
    reason: 'Spam/throwaway email, unverified duplicate registered 18s prior'
  },
  {
    id: '0abda1c7-0057-4260-8e29-06e8b54a248a',
    name: 'Rae',
    email: 't.he.oba.ld.27.9.8@gmail.com',
    reason: 'Spam dot-trick email with UK location, age 18, 0 activity'
  },

  // 2. Rapid Duplicate Registrations (Duplicate clones created by same person within minutes)
  {
    id: '3a3175ab-f459-4516-baa1-dd02cdb705bb',
    name: 'Yaseen khan',
    email: 'yaseenkhan7665927552@gmail.com',
    reason: 'Duplicate clone 1 of 4 created in 8 min (Primary kept: 8aabc716-b99e-49d6-91ea-ca63361fd78a)'
  },
  {
    id: '41d24b1b-25ce-49af-a727-88ae12217653',
    name: 'Pathaan Yaseen khan',
    email: 'yaseenkhan7675927552@gmail.com',
    reason: 'Duplicate clone 2 of 4 created in 8 min (Primary kept: 8aabc716-b99e-49d6-91ea-ca63361fd78a)'
  },
  {
    id: 'badf97ea-c2bf-42fe-a942-077d0ed7112b',
    name: 'Pathaan Yaseen khan',
    email: 'yaseenkhan9396256756@gmail.com',
    reason: 'Duplicate clone 3 of 4 created in 8 min (Primary kept: 8aabc716-b99e-49d6-91ea-ca63361fd78a)'
  },
  {
    id: 'a7628c38-457a-452f-adac-2416e4d4ceea',
    name: 'Jatin Chauhan',
    email: 'jc2438006@gmail.com',
    reason: 'Duplicate clone registered 37s apart, unverified, 0 activity'
  },
  {
    id: 'dddbbcf8-609c-48c5-9bb8-27bd679f9c79',
    name: 'Jatin Chauhan',
    email: 'jatinchauhan6560@gmail.com',
    reason: 'Duplicate clone registered 37s apart, unverified, 0 activity'
  },
  {
    id: '937e2f84-b74a-4fa3-be0e-dd1dff609d50',
    name: 'S Bhaskar',
    email: 'svbyedu@gmail.com',
    reason: 'Unverified clone created 28s prior to genuine verified account (0d004e37-67e0-4a0b-a143-1b29f4cfefd9)'
  },
  {
    id: '8c58ffb5-e79c-47f1-b348-f09112e58c11',
    name: 'Vikram',
    email: 'vijayphysio6@gmail.com',
    reason: 'Unverified clone created 2m prior to genuine verified account (5ef24042-09e3-4206-9791-253a9b94b252)'
  },
  {
    id: '7698966c-e950-4360-aa3f-f6f6b298de4b',
    name: 'Satyanandh',
    email: 'satyanandh64@gmail.com',
    reason: 'Inactive clone without photo (genuine profile with photo kept: 542dbaef-d521-4639-aa28-f498c978a05b)'
  },
  {
    id: 'e3c77210-c004-4669-a333-2c6693808786',
    name: 'Senthil',
    email: 'senthilsai670@gmail.com',
    reason: 'Duplicate inactive clone of Senthil (ebed9e9e-865a-44c1-9faa-25ef3a07b176)'
  }
];

async function removeUser(userId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Clear referrals pointing to this user
    await tx.users.updateMany({
      where: { referred_by: userId },
      data: { referred_by: null }
    });

    // 2. Delete messages in matches involving this user
    const userMatches = await tx.matches.findMany({
      where: {
        OR: [{ user_a_id: userId }, { user_b_id: userId }]
      },
      select: { id: true }
    });
    const matchIds = userMatches.map(m => m.id);
    if (matchIds.length > 0) {
      await tx.messages.deleteMany({
        where: { match_id: { in: matchIds } }
      });
    }

    // 3. Delete direct messages sent/received
    await tx.messages.deleteMany({
      where: {
        OR: [{ sender_id: userId }]
      }
    });

    // 4. Delete matches
    await tx.matches.deleteMany({
      where: {
        OR: [{ user_a_id: userId }, { user_b_id: userId }]
      }
    });

    // 5. Delete interactions
    await tx.interactions.deleteMany({
      where: {
        OR: [{ from_user_id: userId }, { to_user_id: userId }]
      }
    });

    // 6. Delete call logs
    await tx.call_logs.deleteMany({
      where: {
        OR: [{ caller_id: userId }, { receiver_id: userId }]
      }
    });

    // 7. Delete blocks
    await tx.blocks.deleteMany({
      where: {
        OR: [{ blocker_id: userId }, { blocked_id: userId }]
      }
    });

    // 8. Delete reports
    await tx.reports.deleteMany({
      where: {
        OR: [{ reporter_id: userId }, { reported_id: userId }]
      }
    });

    // 9. Delete lounge messages
    await tx.lounge_messages.deleteMany({
      where: { sender_id: userId }
    });

    // 9.5 Delete verification requests
    await tx.verification_requests.deleteMany({
      where: { user_id: userId }
    });

    // 10. Delete game moves and games
    await tx.game_moves.deleteMany({
      where: { player_id: userId }
    });
    await tx.games.deleteMany({
      where: {
        OR: [{ player_a_id: userId }, { player_b_id: userId }, { winner_id: userId }]
      }
    });

    // 11. Delete reel comments & likes
    await tx.reel_comments.deleteMany({
      where: { user_id: userId }
    });
    await tx.reel_likes.deleteMany({
      where: { user_id: userId }
    });
    await tx.reels.deleteMany({
      where: { user_id: userId }
    });

    // 12. Delete device tokens & notifications
    await tx.device_tokens.deleteMany({
      where: { user_id: userId }
    });
    await tx.notifications.deleteMany({
      where: { user_id: userId }
    });

    // 13. Delete transactions
    await tx.transactions.deleteMany({
      where: { user_id: userId }
    });

    // 14. Delete profile
    await tx.profiles.deleteMany({
      where: { user_id: userId }
    });

    // 15. Delete user
    return await tx.users.delete({
      where: { id: userId }
    });
  });
}

async function main() {
  const isExecute = process.argv.includes('--execute');
  console.log(`=== MALE FAKE & DUPLICATE PROFILE CLEANUP ===`);
  console.log(`Mode: ${isExecute ? 'EXECUTE (DELETING RECORDS)' : 'DRY RUN (NO CHANGES)'}\n`);
  console.log(`Identified ${PROFILES_TO_REMOVE.length} profiles to delete:\n`);

  let deletedCount = 0;
  for (const item of PROFILES_TO_REMOVE) {
    const existing = await prisma.users.findUnique({
      where: { id: item.id },
      select: { id: true, full_name: true, email: true, is_verified: true }
    });

    if (!existing) {
      console.log(`[SKIP] ID ${item.id} ("${item.name}") does not exist in DB.`);
      continue;
    }

    console.log(`• [${existing.id}] "${existing.full_name}" <${existing.email}> (Verified: ${existing.is_verified})`);
    console.log(`  Reason: ${item.reason}`);

    if (isExecute) {
      await removeUser(existing.id);
      console.log(`  -> DELETED SUCCESSFULLY.`);
      deletedCount++;
    }
  }

  if (isExecute) {
    console.log(`\nSuccessfully removed ${deletedCount} fake/duplicate male profiles from the database.`);
  } else {
    console.log(`\nDry run completed. To execute deletion, run with '--execute'.`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});

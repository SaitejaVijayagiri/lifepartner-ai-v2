import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function runFullAnalysis() {
  console.log("==========================================");
  console.log("  LIFEPARTNER AI - FULL USER ANALYSIS    ");
  console.log("==========================================");

  // 1. Contact Inquiries & Feedback (User Reported Issues)
  console.log("\n--- 1. CONTACT INQUIRIES & USER FEEDBACK ---");
  try {
    const inquiries = await prisma.contact_inquiries.findMany({
      orderBy: { created_at: 'desc' },
      take: 50
    });
    console.log(`Total Contact Inquiries: ${inquiries.length}`);
    inquiries.forEach((inq, idx) => {
      console.log(`[${idx+1}] [${inq.status}] ${inq.name} (${inq.email}): "${inq.message}" (${inq.created_at})`);
    });
  } catch (e: any) {
    console.error("Error fetching contact_inquiries:", e.message);
  }

  // 2. Reports & Moderation Flags
  console.log("\n--- 2. USER REPORTS & MODERATION ---");
  try {
    const reports = await prisma.reports.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users_reports_reporter_idTousers: { select: { email: true, full_name: true } },
        users_reports_reported_idTousers: { select: { email: true, full_name: true } }
      },
      take: 50
    });
    console.log(`Total User Reports: ${reports.length}`);
    reports.forEach((rep, idx) => {
      console.log(`[${idx+1}] Reporter: ${rep.users_reports_reporter_idTousers?.email} -> Reported: ${rep.users_reports_reported_idTousers?.email} | Reason: ${rep.reason} | Details: ${rep.details} | Status: ${rep.status}`);
    });

    const blockCount = await prisma.blocks.count();
    console.log(`Total Blocks Count: ${blockCount}`);
  } catch (e: any) {
    console.error("Error fetching reports/blocks:", e.message);
  }

  // 3. User Identity & Pre/Post Login Overview
  console.log("\n--- 3. USER ACCOUNTS & PRE/POST LOGIN METRICS ---");
  try {
    const totalUsers = await prisma.users.count();
    const verifiedUsers = await prisma.users.count({ where: { is_verified: true } });
    const unverifiedUsers = await prisma.users.count({ where: { is_verified: false } });
    const bannedUsers = await prisma.users.count({ where: { is_banned: true } });
    const deactivatedUsers = await prisma.users.count({ where: { is_deactivated: true } });

    console.log(`Total Users: ${totalUsers}`);
    console.log(`Verified Users (KYC / Phone done): ${verifiedUsers}`);
    console.log(`Unverified Users (Incomplete Signup/OTP): ${unverifiedUsers}`);
    console.log(`Banned Users: ${bannedUsers}`);
    console.log(`Deactivated Users: ${deactivatedUsers}`);

    // Auth provider breakdown
    const googleUsers = await prisma.users.count({ where: { google_id: { not: null } } });
    const appleUsers = await prisma.users.count({ where: { apple_id: { not: null } } });
    const emailPhoneUsers = totalUsers - googleUsers - appleUsers;

    console.log(`Auth Providers -> Google: ${googleUsers}, Apple: ${appleUsers}, Email/Phone: ${emailPhoneUsers}`);

    // Check users with potential issues (e.g. no full name, no age, no gender, no location)
    const incompleteUsers = await prisma.users.findMany({
      where: {
        OR: [
          { full_name: null },
          { gender: null },
          { age: null },
          { location_name: null }
        ]
      },
      select: { id: true, email: true, phone: true, created_at: true, is_verified: true, full_name: true, gender: true, age: true }
    });

    console.log(`\nIncomplete Profiles (Stuck during onboarding / setup): ${incompleteUsers.length}`);
    incompleteUsers.forEach(u => {
      console.log(`  - ID: ${u.id} | Email: ${u.email} | Phone: ${u.phone} | Verified: ${u.is_verified} | Name: ${u.full_name} | Gender: ${u.gender} | Age: ${u.age} | Created: ${u.created_at}`);
    });

    // Verification Requests
    const verifReqs = await prisma.verification_requests.findMany({
      orderBy: { created_at: 'desc' }
    });
    console.log(`\nVerification Requests (${verifReqs.length}):`);
    verifReqs.forEach(v => {
      console.log(`  - User ${v.user_id} | Status: ${v.status} | Doc: ${v.document_url} | Notes: ${v.admin_notes}`);
    });

  } catch (e: any) {
    console.error("Error analyzing user accounts:", e.message);
  }

  // 4. Feature Engagement & Usage Statistics
  console.log("\n--- 4. FEATURE ENGAGEMENT STATISTICS ---");
  try {
    // Profiles details & photos
    const profiles = await prisma.profiles.findMany({
      select: {
        user_id: true,
        photos: true,
        reels: true,
        stories: true,
        voice_intro_url: true,
        raw_prompt: true,
        location_name: true
      }
    });
    const profilesWithPhotos = profiles.filter(p => p.photos && Array.isArray(p.photos) && (p.photos as any[]).length > 0).length;
    const profilesWithVoice = profiles.filter(p => p.voice_intro_url).length;
    const profilesWithPrompt = profiles.filter(p => p.raw_prompt).length;

    console.log(`Profiles Total: ${profiles.length}`);
    console.log(`Profiles with Photos: ${profilesWithPhotos}`);
    console.log(`Profiles with Voice Intro: ${profilesWithVoice}`);
    console.log(`Profiles with AI Prompt: ${profilesWithPrompt}`);

    // Interactions
    const totalInteractions = await prisma.interactions.count();
    const interactionTypes = await prisma.interactions.groupBy({
      by: ['type', 'status'],
      _count: { id: true }
    });
    console.log(`\nInteractions Total: ${totalInteractions}`);
    console.log("Interactions Breakdown:", JSON.stringify(interactionTypes, null, 2));

    // Matches
    const totalMatches = await prisma.matches.count();
    const matchesStatus = await prisma.matches.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    console.log(`\nMatches Total: ${totalMatches}`);
    console.log("Matches Breakdown:", JSON.stringify(matchesStatus, null, 2));

    // Messages & Chat
    const totalMessages = await prisma.messages.count();
    const mediatorMessages = await prisma.messages.count({ where: { is_mediator_message: true } });
    console.log(`\nMessages Total: ${totalMessages} (Mediator AI Messages: ${mediatorMessages})`);

    // Lounge Messages
    const loungeCount = await prisma.lounge_messages.count();
    console.log(`Lounge Messages Total: ${loungeCount}`);

    // Reels & Engagement
    const totalReels = await prisma.reels.count();
    const reelLikesCount = await prisma.reel_likes.count();
    const reelCommentsCount = await prisma.reel_comments.count();
    console.log(`\nReels Total: ${totalReels} | Reel Likes: ${reelLikesCount} | Reel Comments: ${reelCommentsCount}`);

    // Call Logs
    const totalCalls = await prisma.call_logs.count();
    const callStatusBreakdown = await prisma.call_logs.groupBy({
      by: ['status', 'type'],
      _count: { id: true }
    });
    console.log(`\nCall Logs Total: ${totalCalls}`);
    console.log("Call Logs Breakdown:", JSON.stringify(callStatusBreakdown, null, 2));

    // Games
    const totalGames = await prisma.games.count();
    const totalGameMoves = await prisma.game_moves.count();
    console.log(`\nGames Total: ${totalGames} | Game Moves: ${totalGameMoves}`);

    // Device Tokens (Notifications)
    const deviceTokenCount = await prisma.device_tokens.count();
    console.log(`Device Push Tokens Registered: ${deviceTokenCount}`);

    // Notifications Sent
    const notificationCount = await prisma.notifications.count();
    console.log(`Notifications In-App Count: ${notificationCount}`);

    // Monetization & Transactions
    const totalTx = await prisma.transactions.count();
    const txBreakdown = await prisma.transactions.groupBy({
      by: ['type', 'status'],
      _count: { id: true },
      _sum: { amount: true }
    });
    console.log(`\nTransactions Total: ${totalTx}`);
    console.log("Transactions Breakdown:", JSON.stringify(txBreakdown, null, 2));

  } catch (e: any) {
    console.error("Error analyzing engagement:", e.message);
  }

  // 5. Recent User List & Detailed Status
  console.log("\n--- 5. ALL USERS DETAILED SUMMARY ---");
  try {
    const usersList = await prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        age: true,
        gender: true,
        is_verified: true,
        is_premium: true,
        coins: true,
        created_at: true,
        city: true,
        google_id: true,
        apple_id: true
      }
    });

    console.table(usersList.map(u => ({
      ID: u.id.slice(0, 8) + '...',
      Email: u.email,
      Name: u.full_name || 'N/A',
      Phone: u.phone || 'N/A',
      Gender: u.gender || 'N/A',
      Age: u.age || 'N/A',
      Verified: u.is_verified,
      Coins: u.coins,
      Created: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : 'N/A'
    })));

  } catch (e: any) {
    console.error("Error listing users:", e.message);
  }

  console.log("\n==========================================");
  console.log("  ANALYSIS COMPLETE                      ");
  console.log("==========================================");
}

runFullAnalysis()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

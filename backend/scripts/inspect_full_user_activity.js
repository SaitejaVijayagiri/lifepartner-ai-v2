const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function runFullAnalysis() {
  const output = {};

  // 1. Contact Inquiries & Feedback
  try {
    const inquiries = await prisma.contact_inquiries.findMany({
      orderBy: { created_at: 'desc' }
    });
    output.contact_inquiries = inquiries;
  } catch (e) {
    output.contact_inquiries_error = e.message;
  }

  // 2. Reports & Moderation Flags
  try {
    const reports = await prisma.reports.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users_reports_reporter_idTousers: { select: { email: true, full_name: true } },
        users_reports_reported_idTousers: { select: { email: true, full_name: true } }
      }
    });
    const blockCount = await prisma.blocks.count();
    output.reports = reports;
    output.blockCount = blockCount;
  } catch (e) {
    output.reports_error = e.message;
  }

  // 3. User Identity & Pre/Post Login Overview
  try {
    const totalUsers = await prisma.users.count();
    const verifiedUsers = await prisma.users.count({ where: { is_verified: true } });
    const unverifiedUsers = await prisma.users.count({ where: { is_verified: false } });
    const bannedUsers = await prisma.users.count({ where: { is_banned: true } });
    const deactivatedUsers = await prisma.users.count({ where: { is_deactivated: true } });

    const googleUsers = await prisma.users.count({ where: { google_id: { not: null } } });
    const appleUsers = await prisma.users.count({ where: { apple_id: { not: null } } });
    const emailPhoneUsers = totalUsers - googleUsers - appleUsers;

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

    const verifReqs = await prisma.verification_requests.findMany({
      orderBy: { created_at: 'desc' }
    });

    output.user_counts = {
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      bannedUsers,
      deactivatedUsers,
      authProviders: { googleUsers, appleUsers, emailPhoneUsers },
      incompleteUsersCount: incompleteUsers.length,
      incompleteUsers,
      verifReqs
    };

  } catch (e) {
    output.user_counts_error = e.message;
  }

  // 4. Feature Engagement Statistics
  try {
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
    const profilesWithPhotos = profiles.filter(p => p.photos && Array.isArray(p.photos) && p.photos.length > 0).length;
    const profilesWithVoice = profiles.filter(p => p.voice_intro_url).length;
    const profilesWithPrompt = profiles.filter(p => p.raw_prompt).length;

    const totalInteractions = await prisma.interactions.count();
    const interactionTypes = await prisma.interactions.groupBy({
      by: ['type', 'status'],
      _count: { id: true }
    });

    const totalMatches = await prisma.matches.count();
    const matchesStatus = await prisma.matches.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const totalMessages = await prisma.messages.count();
    const mediatorMessages = await prisma.messages.count({ where: { is_mediator_message: true } });
    const loungeCount = await prisma.lounge_messages.count();

    const totalReels = await prisma.reels.count();
    const reelLikesCount = await prisma.reel_likes.count();
    const reelCommentsCount = await prisma.reel_comments.count();

    const totalCalls = await prisma.call_logs.count();
    const callStatusBreakdown = await prisma.call_logs.groupBy({
      by: ['status', 'type'],
      _count: { id: true }
    });

    const totalGames = await prisma.games.count();
    const totalGameMoves = await prisma.game_moves.count();
    const deviceTokenCount = await prisma.device_tokens.count();
    const notificationCount = await prisma.notifications.count();

    const totalTx = await prisma.transactions.count();
    const txBreakdown = await prisma.transactions.groupBy({
      by: ['type', 'status'],
      _count: { id: true },
      _sum: { amount: true }
    });

    output.engagement = {
      profilesTotal: profiles.length,
      profilesWithPhotos,
      profilesWithVoice,
      profilesWithPrompt,
      totalInteractions,
      interactionTypes,
      totalMatches,
      matchesStatus,
      totalMessages,
      mediatorMessages,
      loungeCount,
      totalReels,
      reelLikesCount,
      reelCommentsCount,
      totalCalls,
      callStatusBreakdown,
      totalGames,
      totalGameMoves,
      deviceTokenCount,
      notificationCount,
      totalTx,
      txBreakdown
    };

  } catch (e) {
    output.engagement_error = e.message;
  }

  // Save to file
  fs.writeFileSync(path.join(__dirname, '../analysis_output.json'), JSON.stringify(output, null, 2));
  console.log("Analysis output successfully written to analysis_output.json");
}

runFullAnalysis()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

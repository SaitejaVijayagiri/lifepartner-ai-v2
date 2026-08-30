const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function deepAudit() {
  console.log("=================================================");
  console.log("     DEEP DATABASE AUDIT & USER ISSUE SCAN      ");
  console.log("=================================================");

  const report = {};

  // 1. Contact Inquiries
  console.log("\n[1] Fetching Contact Inquiries...");
  const inquiries = await prisma.contact_inquiries.findMany({
    orderBy: { created_at: 'desc' }
  });
  report.inquiries = inquiries;
  console.log(`Found ${inquiries.length} contact inquiries.`);

  // 2. User Reports
  console.log("\n[2] Fetching User Reports...");
  const reports = await prisma.reports.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      users_reports_reporter_idTousers: { select: { id: true, email: true, full_name: true } },
      users_reports_reported_idTousers: { select: { id: true, email: true, full_name: true } }
    }
  });
  report.reports = reports;
  console.log(`Found ${reports.length} user reports.`);

  // 3. Verification Requests
  console.log("\n[3] Fetching Verification Requests...");
  const verifications = await prisma.verification_requests.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      users: { select: { id: true, email: true, full_name: true, is_verified: true } }
    }
  });
  report.verifications = verifications;
  console.log(`Found ${verifications.length} verification requests.`);

  // 4. Transactions (Failed, Pending, Refunded, or Anomaly)
  console.log("\n[4] Fetching Transactions & Payments...");
  const transactions = await prisma.transactions.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      users: { select: { id: true, email: true, full_name: true, is_premium: true, coins: true } }
    }
  });
  report.transactions = transactions;
  const failedTx = transactions.filter(t => t.status !== 'SUCCESS');
  console.log(`Found ${transactions.length} transactions total (${failedTx.length} non-success/failed/pending).`);

  // 5. User Count & Funnel Drop-off Analysis
  console.log("\n[5] User Funnel & Drop-off Analysis...");
  const totalUsers = await prisma.users.count();
  const verifiedUsers = await prisma.users.count({ where: { is_verified: true } });
  const unverifiedUsers = await prisma.users.count({ where: { is_verified: false } });
  const bannedUsers = await prisma.users.count({ where: { is_banned: true } });
  const deactivatedUsers = await prisma.users.count({ where: { is_deactivated: true } });
  const usersWithNoGender = await prisma.users.count({ where: { gender: null } });
  const usersWithNoAge = await prisma.users.count({ where: { age: null } });
  const usersWithNoName = await prisma.users.count({ where: { full_name: null } });
  const usersWithNoLocation = await prisma.users.count({ where: { location_name: null, city: null } });
  const usersWithNoAvatar = await prisma.users.count({ where: { avatar_url: null } });

  // Profiles table analysis
  const totalProfiles = await prisma.profiles.count();
  const profiles = await prisma.profiles.findMany({
    select: {
      user_id: true,
      photos: true,
      raw_prompt: true,
      voice_intro_url: true,
      traits: true,
      values: true,
      dealbreakers: true,
      metadata: true
    }
  });

  const profilesWithEmptyPhotos = profiles.filter(p => !p.photos || (Array.isArray(p.photos) && p.photos.length === 0));
  const profilesWithLegacySupabase = profiles.filter(p => {
    if (!p.photos || !Array.isArray(p.photos)) return false;
    return p.photos.some(url => typeof url === 'string' && url.includes('supabase'));
  });
  const profilesWithBase64 = profiles.filter(p => {
    if (!p.photos || !Array.isArray(p.photos)) return false;
    return p.photos.some(url => typeof url === 'string' && url.startsWith('data:image'));
  });

  report.userFunnel = {
    totalUsers,
    verifiedUsers,
    unverifiedUsers,
    bannedUsers,
    deactivatedUsers,
    usersWithNoGender,
    usersWithNoAge,
    usersWithNoName,
    usersWithNoLocation,
    usersWithNoAvatar,
    totalProfiles,
    profilesWithEmptyPhotosCount: profilesWithEmptyPhotos.length,
    profilesWithLegacySupabaseCount: profilesWithLegacySupabase.length,
    profilesWithBase64Count: profilesWithBase64.length
  };
  console.log("User funnel stats:", report.userFunnel);

  // 6. Inspect User Chat Messages for Complaints / Issues
  console.log("\n[6] Scanning Chat Messages for User Complaints & Issues...");
  const issueKeywords = [
    'problem', 'issue', 'bug', 'error', 'fail', 'failed', 'stuck', 'not working', 
    'fake', 'scam', 'cheat', 'complaint', 'support', 'help', 'cant login', "can't login",
    'otp', 'payment', 'money', 'deducted', 'refund', 'photo', 'delete', 'privacy',
    'contact', 'whatsapp', 'call', 'crash', 'slow', 'disconnect', 'admin'
  ];

  const chatConditions = issueKeywords.map(kw => ({
    content: { contains: kw, mode: 'insensitive' }
  }));

  const issueChats = await prisma.messages.findMany({
    where: { OR: chatConditions },
    orderBy: { created_at: 'desc' },
    take: 150,
    include: {
      users_messages_sender_idTousers: { select: { id: true, email: true, full_name: true } },
      users_messages_receiver_idTousers: { select: { id: true, email: true, full_name: true } }
    }
  });
  report.issueChats = issueChats.map(m => ({
    id: m.id,
    sender: (m.users_messages_sender_idTousers?.full_name || 'Unknown') + " (" + (m.users_messages_sender_idTousers?.email || 'N/A') + ")",
    receiver: (m.users_messages_receiver_idTousers?.full_name || 'Unknown') + " (" + (m.users_messages_receiver_idTousers?.email || 'N/A') + ")",
    content: m.content,
    date: m.created_at,
    is_mediator: m.is_mediator_message
  }));
  console.log(`Found ${issueChats.length} messages containing complaint/issue keywords.`);

  // 7. Lounge messages scan
  console.log("\n[7] Scanning Lounge Messages...");
  const loungeMessages = await prisma.lounge_messages.findMany({
    orderBy: { created_at: 'desc' },
    take: 100,
    include: {
      users: { select: { email: true, full_name: true } }
    }
  });
  report.loungeMessages = loungeMessages;

  // 8. Match & Interaction Anomalies
  console.log("\n[8] Checking Match & Interaction Anomalies...");
  const totalMatches = await prisma.matches.count();
  const totalInteractions = await prisma.interactions.count();
  const pendingInteractions = await prisma.interactions.count({ where: { status: 'PENDING' } });
  const acceptedInteractions = await prisma.interactions.count({ where: { status: 'ACCEPTED' } });
  const rejectedInteractions = await prisma.interactions.count({ where: { status: 'REJECTED' } });

  report.matchStats = {
    totalMatches,
    totalInteractions,
    pendingInteractions,
    acceptedInteractions,
    rejectedInteractions
  };

  // 9. Call logs & failures
  console.log("\n[9] Checking Call Logs & Failure Rates...");
  const callLogs = await prisma.call_logs.findMany({
    orderBy: { started_at: 'desc' },
    take: 100
  });
  report.callLogs = callLogs;

  // 10. Device Tokens & Push Notifications Status
  console.log("\n[10] Device Tokens & Notifications...");
  const totalDeviceTokens = await prisma.device_tokens.count();
  const notificationsCount = await prisma.notifications.count();
  const unreadNotifications = await prisma.notifications.count({ where: { is_read: false } });

  report.notificationStats = {
    totalDeviceTokens,
    notificationsCount,
    unreadNotifications
  };

  // 11. Find All Users with Stuck Onboarding
  console.log("\n[11] Identifying Specific Users Stuck or Facing Incomplete Flows...");
  const stuckUsers = await prisma.users.findMany({
    where: {
      OR: [
        { is_verified: false },
        { gender: null },
        { age: null },
        { full_name: null },
        { avatar_url: null }
      ]
    },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      email: true,
      phone: true,
      full_name: true,
      gender: true,
      age: true,
      avatar_url: true,
      is_verified: true,
      is_premium: true,
      coins: true,
      created_at: true,
      google_id: true,
      apple_id: true,
      city: true
    }
  });
  report.stuckUsers = stuckUsers;

  fs.writeFileSync(path.join(__dirname, '../deep_audit_db_report.json'), JSON.stringify(report, null, 2));
  console.log(`\n✅ Deep DB Audit complete! Output saved to backend/deep_audit_db_report.json`);
}

deepAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

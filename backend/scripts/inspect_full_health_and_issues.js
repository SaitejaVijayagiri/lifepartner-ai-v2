const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function runIssueScan() {
  console.log("=== COMPREHENSIVE USER ISSUE SCANNER ===");
  
  // 1. Check all users
  const allUsers = await prisma.users.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      profiles: true,
      device_tokens: true
    }
  });

  console.log(`Total Users in DB: ${allUsers.length}`);

  const issues = {
    missingGender: [],
    missingAge: [],
    missingName: [],
    missingProfile: [],
    emptyPhotos: [],
    brokenPhotoUrls: [],
    corruptedMetadata: [],
    usersWithNoDeviceTokens: [],
    failedTransactions: [],
    recentContactInquiries: [],
    recentReports: [],
    recentChatExcerpts: []
  };

  for (const u of allUsers) {
    if (!u.gender) issues.missingGender.push({ id: u.id, email: u.email, name: u.full_name, created_at: u.created_at });
    if (!u.age) issues.missingAge.push({ id: u.id, email: u.email, name: u.full_name, created_at: u.created_at });
    if (!u.full_name) issues.missingName.push({ id: u.id, email: u.email, created_at: u.created_at });
    if (!u.profiles) {
      issues.missingProfile.push({ id: u.id, email: u.email, name: u.full_name, created_at: u.created_at });
    } else {
      const photos = u.profiles.photos;
      if (!photos || (Array.isArray(photos) && photos.length === 0)) {
        issues.emptyPhotos.push({ id: u.id, email: u.email, name: u.full_name, avatar: u.avatar_url });
      } else if (Array.isArray(photos)) {
        const broken = photos.filter(p => typeof p === 'string' && (p.includes('supabase') || p.startsWith('data:image')));
        if (broken.length > 0) {
          issues.brokenPhotoUrls.push({ id: u.id, email: u.email, brokenCount: broken.length, sample: broken[0].substring(0, 50) });
        }
      }
    }
    if (!u.device_tokens || u.device_tokens.length === 0) {
      issues.usersWithNoDeviceTokens.push({ id: u.id, email: u.email, name: u.full_name });
    }
  }

  // 2. Check Transactions
  const tx = await prisma.transactions.findMany({
    where: { status: { not: 'SUCCESS' } },
    include: { users: { select: { email: true, full_name: true } } }
  });
  issues.failedTransactions = tx;

  // 3. Check Recent Contact Inquiries
  const inqs = await prisma.contact_inquiries.findMany({
    orderBy: { created_at: 'desc' },
    take: 10
  });
  issues.recentContactInquiries = inqs;

  // 4. Check Reports
  const reports = await prisma.reports.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    include: {
      users_reports_reporter_idTousers: { select: { email: true, full_name: true } },
      users_reports_reported_idTousers: { select: { email: true, full_name: true } }
    }
  });
  issues.recentReports = reports;

  // 5. Check last 50 messages across system
  const recentMsgs = await prisma.messages.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
    include: {
      users_messages_sender_idTousers: { select: { email: true, full_name: true } },
      users_messages_receiver_idTousers: { select: { email: true, full_name: true } }
    }
  });
  issues.recentChatExcerpts = recentMsgs.map(m => ({
    from: m.users_messages_sender_idTousers?.full_name + ` (${m.users_messages_sender_idTousers?.email})`,
    to: m.users_messages_receiver_idTousers?.full_name + ` (${m.users_messages_receiver_idTousers?.email})`,
    content: m.content?.length > 100 ? m.content.substring(0, 100) + '...' : m.content,
    created_at: m.created_at,
    type: m.type
  }));

  // 6. Check Call Logs
  const callLogs = await prisma.call_logs.findMany({
    orderBy: { started_at: 'desc' },
    take: 20
  });

  // 7. Check Reels
  const reels = await prisma.reels.findMany({
    orderBy: { created_at: 'desc' },
    take: 20
  });

  console.log("\n--- SUMMARY OF DETECTED DB ISSUES ---");
  console.log(`Total Users: ${allUsers.length}`);
  console.log(`Users missing gender: ${issues.missingGender.length}`);
  console.log(`Users missing age: ${issues.missingAge.length}`);
  console.log(`Users missing full_name: ${issues.missingName.length}`);
  console.log(`Users missing profile row: ${issues.missingProfile.length}`);
  console.log(`Users with empty photos: ${issues.emptyPhotos.length}`);
  console.log(`Users with legacy/broken photo URLs (Supabase/Base64): ${issues.brokenPhotoUrls.length}`);
  console.log(`Users with no device tokens: ${issues.usersWithNoDeviceTokens.length}`);
  console.log(`Failed/pending transactions: ${issues.failedTransactions.length}`);
  console.log(`Contact Inquiries: ${issues.recentContactInquiries.length}`);
  console.log(`User Reports: ${issues.recentReports.length}`);
  console.log(`Total Call Logs: ${callLogs.length}`);
  console.log(`Total Reels: ${reels.length}`);

  if (issues.missingGender.length > 0) {
    console.log("\nUsers with missing gender/onboarding incomplete:");
    issues.missingGender.forEach(u => console.log(`  - ${u.name || 'Unnamed'} (${u.email}) [ID: ${u.id}] Created: ${u.created_at}`));
  }

  if (issues.brokenPhotoUrls.length > 0) {
    console.log("\nUsers with broken photo URLs:");
    issues.brokenPhotoUrls.forEach(u => console.log(`  - ${u.email}: ${u.brokenCount} broken photos (sample: ${u.sample})`));
  }

  if (issues.failedTransactions.length > 0) {
    console.log("\nFailed Transactions:");
    issues.failedTransactions.forEach(t => console.log(`  - User: ${t.users?.email}, Plan: ${t.plan_name}, Amount: ${t.amount}, Status: ${t.status}, Created: ${t.created_at}`));
  }

  console.log("\nLatest 15 Messages in system:");
  issues.recentChatExcerpts.slice(0, 15).forEach(m => {
    console.log(`  [${m.created_at}] ${m.from} -> ${m.to} (${m.type}): "${m.content}"`);
  });

  fs.writeFileSync(path.join(__dirname, '../issue_scan_results.json'), JSON.stringify({
    totalUsers: allUsers.length,
    issues,
    callLogs,
    reels
  }, null, 2));

  console.log("\nSaved detailed issue scan to backend/issue_scan_results.json");
}

runIssueScan()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

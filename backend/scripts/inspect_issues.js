const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('--- LOUNGE MESSAGES ---');
  const lounge = await prisma.lounge_messages.findMany({
    orderBy: { created_at: 'desc' },
    take: 40,
    include: { users: { select: { full_name: true, email: true, gender: true } } }
  });
  console.log('Total lounge messages:', lounge.length);
  lounge.reverse().forEach(m => {
    console.log(`[${m.created_at?.toISOString()}] ${m.users?.full_name} (${m.users?.gender}): ${m.text}`);
  });

  console.log('\n--- CONTACT INQUIRIES ---');
  const inquiries = await prisma.contact_inquiries.findMany({
    orderBy: { created_at: 'desc' }
  });
  console.log('Total inquiries:', inquiries.length);
  inquiries.forEach(i => {
    console.log(`[${i.created_at?.toISOString()}] ${i.name} (${i.email}): ${i.message}`);
  });

  console.log('\n--- REPORTS ---');
  const reports = await prisma.reports.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      users_reports_reporter_idTousers: { select: { full_name: true, email: true } },
      users_reports_reported_idTousers: { select: { full_name: true, email: true } }
    }
  });
  console.log('Total reports:', reports.length);
  reports.forEach(r => {
    console.log(`[${r.created_at?.toISOString()}] Reporter: ${r.users_reports_reporter_idTousers?.email} -> Reported: ${r.users_reports_reported_idTousers?.email} | Reason: ${r.reason} | Details: ${r.details}`);
  });

  console.log('\n--- RECENT CHAT MESSAGES (LAST 60) ---');
  const recentMsgs = await prisma.messages.findMany({
    orderBy: { created_at: 'desc' },
    take: 60,
    include: {
      users_messages_sender_idTousers: { select: { full_name: true, gender: true, email: true } },
      users_messages_receiver_idTousers: { select: { full_name: true, gender: true, email: true } }
    }
  });
  recentMsgs.reverse().forEach(m => {
    let text = m.content;
    if (text && text.startsWith('[IMAGE]')) text = '[IMAGE BASE64]';
    console.log(`[${m.created_at?.toISOString()}] ${m.users_messages_sender_idTousers?.full_name} (${m.users_messages_sender_idTousers?.email}) -> ${m.users_messages_receiver_idTousers?.full_name} (${m.users_messages_receiver_idTousers?.email}): ${text}`);
  });

  console.log('\n--- ALL MESSAGES WITH ISSUE/PROBLEM/BUG/HELP/CALL/AUDIO/VIDEO/OTP/ERROR ---');
  const keywords = ['issue', 'problem', 'bug', 'error', 'not working', 'work', 'call', 'audio', 'voice', 'sound', 'video', 'fail', 'fake', 'otp', 'photo', 'stuck', 'help', 'slow', 'cant', "can't", 'unable', 'broken', 'load', 'loading'];
  const allMsgs = await prisma.messages.findMany({
    where: {
      OR: keywords.map(kw => ({ content: { contains: kw, mode: 'insensitive' } }))
    },
    orderBy: { created_at: 'desc' },
    take: 100,
    include: {
      users_messages_sender_idTousers: { select: { full_name: true, email: true } },
      users_messages_receiver_idTousers: { select: { full_name: true, email: true } }
    }
  });
  console.log(`Found ${allMsgs.length} messages matching issue keywords:`);
  allMsgs.forEach(m => {
    let text = m.content;
    if (text && text.startsWith('[IMAGE]')) text = '[IMAGE BASE64]';
    console.log(`[${m.created_at?.toISOString()}] ${m.users_messages_sender_idTousers?.full_name} -> ${m.users_messages_receiver_idTousers?.full_name}: "${text}"`);
  });

  console.log('\n--- CALL LOGS ---');
  const calls = await prisma.call_logs.findMany({
    orderBy: { started_at: 'desc' },
    take: 30,
    include: {
      users_call_logs_caller_idTousers: { select: { full_name: true, email: true } },
      users_call_logs_receiver_idTousers: { select: { full_name: true, email: true } }
    }
  });
  console.log(`Total call logs: ${calls.length}`);
  calls.forEach(c => {
    console.log(`[${c.started_at?.toISOString()}] Type: ${c.type} | Status: ${c.status} | Duration: ${c.duration_seconds}s | Caller: ${c.users_call_logs_caller_idTousers?.full_name} -> Receiver: ${c.users_call_logs_receiver_idTousers?.full_name}`);
  });

  console.log('\n--- FAILED TRANSACTIONS ---');
  const transactions = await prisma.transactions.findMany({
    where: { status: { not: 'SUCCESS' } },
    orderBy: { created_at: 'desc' },
    take: 20
  });
  console.log(`Failed transactions: ${transactions.length}`);
  transactions.forEach(t => console.log(t));

  console.log('\n--- TARGET USER AUDIT (NAJAR) ---');
  const najar = await prisma.users.findFirst({
    where: { full_name: { contains: 'Najar', mode: 'insensitive' } },
    include: { device_tokens: true, profiles: true }
  });
  console.log('Najar:', najar?.id, najar?.full_name, najar?.email, najar?.gender);
  console.log('Tokens count:', najar?.device_tokens?.length);
  console.log('Device Tokens:', najar?.device_tokens);
  console.log('Photos:', najar?.profiles?.photos);
  console.log('Avatar:', najar?.avatar_url);

  console.log('\n--- TARGET USER AUDIT (SWETHA) ---');
  const swetha = await prisma.users.findFirst({
    where: { email: 'saitejavijayagiri123@gmail.com' },
    include: { device_tokens: true, profiles: true }
  });
  console.log('Swetha:', swetha?.id, swetha?.full_name, swetha?.email);
  console.log('Swetha Device Tokens:', swetha?.device_tokens?.length);

  console.log('\n--- MATCHES AUDIT ---');
  const najarMatches = await prisma.matches.findMany({
    where: {
      OR: [
        { user_a_id: '4e2f6386-2fc6-45a6-97d9-30bc6c46ecbd' },
        { user_b_id: '4e2f6386-2fc6-45a6-97d9-30bc6c46ecbd' }
      ]
    },
    include: {
      users_matches_user_a_idTousers: { select: { id: true, full_name: true, gender: true, email: true } },
      users_matches_user_b_idTousers: { select: { id: true, full_name: true, gender: true, email: true } }
    }
  });

  console.log('Najar matches count:', najarMatches.length);
  najarMatches.forEach(m => {
    console.log(`  ${m.users_matches_user_a_idTousers?.full_name} (${m.users_matches_user_a_idTousers?.gender}) <-> ${m.users_matches_user_b_idTousers?.full_name} (${m.users_matches_user_b_idTousers?.gender})`);
  });

  const allMatches = await prisma.matches.findMany({
    include: {
      users_matches_user_a_idTousers: { select: { gender: true } },
      users_matches_user_b_idTousers: { select: { gender: true } }
    }
  });

  const sameGenderMatches = allMatches.filter(m => 
    m.users_matches_user_a_idTousers?.gender &&
    m.users_matches_user_b_idTousers?.gender &&
    m.users_matches_user_a_idTousers.gender.toLowerCase() === m.users_matches_user_b_idTousers.gender.toLowerCase()
  );
  console.log('Total matches in DB:', allMatches.length);
  console.log('Same-gender matches (e.g. Male-Male or Female-Female):', sameGenderMatches.length);

  // Check recent match recommendations / discover feed logic
  console.log('\n--- REPORTED USER SAHI AUDIT ---');
  const sahi = await prisma.users.findFirst({
    where: { email: 'sahi41335@gmail.com' }
  });
  console.log('Reported user sahi:', sahi?.id, sahi?.full_name, sahi?.email, 'is_banned:', sahi?.is_banned);

  console.log('\n--- LIVE SPEED DATE EVENTS IN DB ---');
  try {
    const events = await prisma.$queryRawUnsafe('SELECT * FROM live_speed_date_events ORDER BY created_at DESC LIMIT 10;');
    console.log('Live events count:', events.length);
    events.forEach(e => console.log(e));
  } catch (err) {
    console.log('Error:', err.message);
  }



}

main().catch(console.error).finally(() => prisma.$disconnect());

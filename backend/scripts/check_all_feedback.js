const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function checkAllFeedback() {
  console.log("==========================================");
  console.log("  CHECKING ALL USER FEEDBACK & REPORTS   ");
  console.log("==========================================");

  const results = {};

  // 1. Contact Inquiries
  try {
    const inquiries = await prisma.contact_inquiries.findMany({
      orderBy: { created_at: 'desc' }
    });
    console.log(`\n📬 Contact Inquiries (${inquiries.length}):`);
    inquiries.forEach((inq, i) => {
      console.log(`[${i+1}] Name: ${inq.name} | Email: ${inq.email} | Status: ${inq.status} | Date: ${inq.created_at}`);
      console.log(`    Message: "${inq.message}"`);
    });
    results.contact_inquiries = inquiries;
  } catch (e) {
    console.error("Error fetching contact_inquiries:", e.message);
  }

  // 2. User Reports
  try {
    const reports = await prisma.reports.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users_reports_reporter_idTousers: { select: { email: true, full_name: true } },
        users_reports_reported_idTousers: { select: { email: true, full_name: true } }
      }
    });
    console.log(`\n🚩 User Reports (${reports.length}):`);
    reports.forEach((rep, i) => {
      console.log(`[${i+1}] Reporter: ${rep.users_reports_reporter_idTousers?.email} -> Reported: ${rep.users_reports_reported_idTousers?.email}`);
      console.log(`    Reason: ${rep.reason} | Details: ${rep.details} | Status: ${rep.status} | Date: ${rep.created_at}`);
    });
    results.reports = reports;
  } catch (e) {
    console.error("Error fetching reports:", e.message);
  }

  // 3. Verification Requests & Admin Notes
  try {
    const verifications = await prisma.verification_requests.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { email: true, full_name: true } }
      }
    });
    console.log(`\n🛡️ Verification Requests (${verifications.length}):`);
    verifications.forEach((v, i) => {
      console.log(`[${i+1}] User: ${v.users?.full_name} (${v.users?.email}) | Status: ${v.status} | Notes: ${v.admin_notes} | Date: ${v.created_at}`);
    });
    results.verifications = verifications;
  } catch (e) {
    console.error("Error fetching verifications:", e.message);
  }

  // 4. User Messages mentioning Feedback / Issues / Support / Help / Bugs
  try {
    const keywords = ['feedback', 'bug', 'issue', 'problem', 'error', 'not working', 'help', 'support', 'otp', 'login', 'pay', 'fake', 'worst', 'bad', 'good', 'love', 'like', 'app'];
    
    const conditions = keywords.map(kw => ({
      content: { contains: kw, mode: 'insensitive' }
    }));

    const feedbackMessages = await prisma.messages.findMany({
      where: {
        OR: conditions
      },
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        users_messages_sender_idTousers: { select: { email: true, full_name: true } },
        users_messages_receiver_idTousers: { select: { email: true, full_name: true } }
      }
    });

    console.log(`\n💬 Chat Messages with Feedback/Keywords (${feedbackMessages.length}):`);
    feedbackMessages.forEach((msg, i) => {
      console.log(`[${i+1}] Sender: ${msg.users_messages_sender_idTousers?.full_name} (${msg.users_messages_sender_idTousers?.email}) -> Receiver: ${msg.users_messages_receiver_idTousers?.full_name}`);
      console.log(`    Content: "${msg.content}" | Date: ${msg.created_at}`);
    });
    results.feedbackMessages = feedbackMessages;
  } catch (e) {
    console.error("Error searching feedback messages:", e.message);
  }

  // 5. Check if there are feedback submissions in profiles metadata or raw prompts
  try {
    const feedbackPrompts = await prisma.profiles.findMany({
      where: {
        raw_prompt: { contains: 'feedback', mode: 'insensitive' }
      },
      select: { user_id: true, raw_prompt: true, updated_at: true }
    });
    console.log(`\n📝 Profile Raw Prompts mentioning feedback: ${feedbackPrompts.length}`);
    results.feedbackPrompts = feedbackPrompts;
  } catch (e) {
    console.error("Error searching profile prompts:", e.message);
  }

  fs.writeFileSync(path.join(__dirname, '../feedback_output.json'), JSON.stringify(results, null, 2));
  console.log("\nSaved feedback output to feedback_output.json");
}

checkAllFeedback()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

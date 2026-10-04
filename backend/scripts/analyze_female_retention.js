const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const females = await prisma.users.findMany({
    where: {
      OR: [
        { gender: { equals: 'Female', mode: 'insensitive' } },
        { gender: { equals: 'Woman', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      created_at: true,
      city: true,
      state: true,
      messages_messages_sender_idTousers: { select: { id: true, content: true, created_at: true }, orderBy: { created_at: 'asc' } },
      messages_messages_receiver_idTousers: { select: { id: true, content: true, created_at: true } },
      call_logs_call_logs_caller_idTousers: { select: { id: true, status: true, started_at: true } },
      call_logs_call_logs_receiver_idTousers: { select: { id: true, status: true, started_at: true } }
    }
  });

  console.log('Total females:', females.length);
  const activeFemales = females.filter(f => f.messages_messages_sender_idTousers.length > 0);
  console.log('Females who sent at least 1 message:', activeFemales.length);
  
  // Measure retention: how many sent messages > 24 hours after account creation?
  const retainedFemales = females.filter(f => {
    const regTime = new Date(f.created_at).getTime();
    return f.messages_messages_sender_idTousers.some(m => new Date(m.created_at).getTime() - regTime > 24 * 3600 * 1000);
  });
  console.log('Females active > 24h after registration (Retained):', retainedFemales.length, '/', females.length);

  // Look at incoming messages females receive
  let spamCount = 0;
  females.forEach(f => {
    const rx = f.messages_messages_receiver_idTousers;
    // Check if received unsolicited sexual or contact asking messages
    rx.forEach(m => {
      const txt = (m.content || '').toLowerCase();
      if (txt.includes('boob') || txt.includes('sexy') || txt.includes('sex') || txt.includes('nude') || txt.includes('whatsapp') || txt.includes('call me') || txt.includes('phone') || txt.includes('number')) {
        spamCount++;
      }
    });
  });
  console.log('Spam / Harassment / Unsolicited number asks sent to females:', spamCount);

  // Check how many females ever came back in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const recentActiveFemales = females.filter(f => {
    return f.messages_messages_sender_idTousers.some(m => new Date(m.created_at) > thirtyDaysAgo);
  });
  console.log('Females active in last 30 days:', recentActiveFemales.length);

  // Print females with their message counts
  console.log('\nTop Female Activity:');
  females.sort((a,b) => b.messages_messages_sender_idTousers.length - a.messages_messages_sender_idTousers.length)
    .slice(0, 10)
    .forEach(f => {
      console.log(`- ${f.full_name} (${f.city || 'No city'}): Sent ${f.messages_messages_sender_idTousers.length} msgs, Received ${f.messages_messages_receiver_idTousers.length} msgs, Calls received ${f.call_logs_call_logs_receiver_idTousers.length}`);
    });

  await prisma.$disconnect();
}
run().catch(console.error);

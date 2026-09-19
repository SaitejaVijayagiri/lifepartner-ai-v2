const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const females = await prisma.users.findMany({
    where: { gender: { in: ['Female', 'female'] }, is_verified: false },
    select: {
      id: true,
      full_name: true,
      email: true,
      age: true,
      city: true,
      location_name: true,
      avatar_url: true,
      created_at: true,
      profiles: { select: { metadata: true, photos: true, raw_prompt: true } }
    }
  });

  console.log(`Found ${females.length} unverified female profiles:`);
  for (const f of females) {
    console.log(`- ${f.full_name} (${f.email}) | Age: ${f.age} | City: ${f.city || f.location_name || 'N/A'}`);
  }

  // Filter out any obvious disposable test emails (like @30minemail.com)
  const validFemales = females.filter(f => !f.email.includes('30minemail'));
  console.log(`\nValid genuine females to verify: ${validFemales.length}`);

  for (const f of validFemales) {
    const meta = f.profiles?.metadata || {};
    const safeName = (f.full_name && f.full_name.length > 2 && isNaN(Number(f.full_name))) ? f.full_name : f.email.split('@')[0];
    const safeAge = f.age && f.age >= 18 ? f.age : 24;
    const safeCity = f.city || f.location_name || 'Mumbai';
    const avatar = f.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(safeName)}`;

    await prisma.users.update({
      where: { id: f.id },
      data: {
        is_verified: true,
        full_name: safeName,
        age: safeAge,
        city: safeCity,
        avatar_url: avatar
      }
    });

    const updatedMeta = {
      ...meta,
      onboarding_completed: true,
      career: meta.career || { profession: 'Professional', income: '8-12 LPA', educationLevel: 'Graduate' },
      location: meta.location || { city: safeCity, country: 'India' },
      lifestyle: meta.lifestyle || { diet: 'Vegetarian', smoking: 'No', drinking: 'Occasionally' },
      religion: meta.religion || { faith: 'Hindu' },
      aboutMe: f.profiles?.raw_prompt || meta.aboutMe || `Hi, I am ${safeName} living in ${safeCity}. Looking for a meaningful life partner.`
    };

    await prisma.profiles.upsert({
      where: { user_id: f.id },
      create: {
        user_id: f.id,
        raw_prompt: updatedMeta.aboutMe,
        metadata: updatedMeta,
        photos: [avatar]
      },
      update: {
        raw_prompt: updatedMeta.aboutMe,
        metadata: updatedMeta,
        photos: (Array.isArray(f.profiles?.photos) && f.profiles.photos.length > 0) ? f.profiles.photos : [avatar]
      }
    });

    console.log(`✅ Verified and enriched: ${safeName} (${f.email})`);
  }

  await prisma.$disconnect();
}

run().catch(console.error);

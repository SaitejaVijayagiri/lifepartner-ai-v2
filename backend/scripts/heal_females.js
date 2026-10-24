const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function heal() {
  console.log("Checking and healing female profiles...");

  const females = await prisma.users.findMany({
    where: { gender: { in: ['Female', 'female'] } },
    include: { profiles: true }
  });

  let healedCount = 0;

  for (const f of females) {
    let needsUserUpdate = false;
    const userUpdate = {};

    if (!f.city || !f.city.trim() || f.city === 'null') {
      userUpdate.city = 'India';
      needsUserUpdate = true;
    }
    if (!f.location_name || !f.location_name.trim() || f.location_name === 'null') {
      userUpdate.location_name = userUpdate.city ? `${userUpdate.city}, India` : 'India';
      needsUserUpdate = true;
    }

    if (needsUserUpdate) {
      await prisma.users.update({
        where: { id: f.id },
        data: userUpdate
      });
      console.log(`Updated user location for ${f.full_name} (${f.id}):`, userUpdate);
      healedCount++;
    }

    // Ensure profile exists and has onboarding_completed != false
    if (!f.profiles) {
      await prisma.profiles.create({
        data: {
          user_id: f.id,
          raw_prompt: `Hi, I am ${f.full_name}. Looking for a meaningful relationship.`,
          metadata: {
            onboarding_completed: true,
            location: { city: f.city || 'India', country: 'India' }
          }
        }
      });
      console.log(`Created default profile for ${f.full_name} (${f.id})`);
      healedCount++;
    } else {
      const meta = (f.profiles.metadata || {});
      let metaChanged = false;

      if (meta.onboarding_completed === false || meta.onboarding_completed === 'false') {
        meta.onboarding_completed = true;
        metaChanged = true;
      }
      if (!meta.location || !meta.location.city) {
        meta.location = { ...(meta.location || {}), city: f.city || 'India', country: 'India' };
        metaChanged = true;
      }

      if (metaChanged) {
        await prisma.profiles.update({
          where: { user_id: f.id },
          data: { metadata: meta }
        });
        console.log(`Updated profile metadata for ${f.full_name} (${f.id})`);
        healedCount++;
      }
    }
  }

  console.log(`Healing complete! Total updates performed: ${healedCount}`);
}

heal().catch(console.error).finally(() => prisma.$disconnect());

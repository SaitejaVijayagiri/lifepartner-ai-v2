const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function recoverIncompleteUsers() {
  console.log("==================================================");
  console.log("   INCOMPLETE / INVISIBLE USERS RECOVERY SCAN    ");
  console.log("==================================================");

  // 1. Fetch all incomplete users with their linked profiles
  const incompleteUsers = await prisma.users.findMany({
    where: {
      OR: [
        { gender: null },
        { age: null },
        { location_name: null }
      ]
    },
    include: {
      profiles: true
    }
  });

  console.log(`Found ${incompleteUsers.length} users with incomplete profile fields.`);

  let autoRecovered = 0;
  let remainingIncomplete = [];

  for (const user of incompleteUsers) {
    const meta = user.profiles?.metadata || {};
    let updates = {};

    // 1. Try to recover Age from DOB or meta.dob or meta.age
    if (!user.age) {
      if (meta.dob) {
        const birthDate = new Date(meta.dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge >= 18 && calculatedAge <= 99) {
          updates.age = calculatedAge;
        }
      } else if (meta.age && parseInt(meta.age) >= 18) {
        updates.age = parseInt(meta.age);
      }
    }

    // 2. Try to recover Gender from meta.gender
    if (!user.gender && meta.gender) {
      const g = meta.gender.trim();
      if (['Male', 'Female'].includes(g)) {
        updates.gender = g;
      }
    }

    // 3. Try to recover City / Location from meta.location
    if (!user.location_name || !user.city) {
      const city = meta.location?.city || meta.city;
      const state = meta.location?.state || meta.state;
      const country = meta.location?.country || meta.country || 'India';
      if (city) {
        updates.city = city;
        updates.location_name = [city, state, country].filter(Boolean).join(', ');
      }
    }

    // 4. Try to recover avatar from photos if avatar_url is missing
    if (!user.avatar_url && user.profiles?.photos && Array.isArray(user.profiles.photos) && user.profiles.photos.length > 0) {
      const firstPhoto = user.profiles.photos[0];
      if (typeof firstPhoto === 'string' && firstPhoto.startsWith('http')) {
        updates.avatar_url = firstPhoto;
      }
    }

    // Apply updates if any recoverable field found
    if (Object.keys(updates).length > 0) {
      console.log(`[Auto-Recovery] Updating User ${user.email || user.id}:`, updates);
      await prisma.users.update({
        where: { id: user.id },
        data: updates
      });
      autoRecovered++;
    } else {
      remainingIncomplete.push({
        id: user.id,
        email: user.email,
        name: user.full_name,
        verified: user.is_verified,
        created: user.created_at
      });
    }
  }

  console.log(`\n✅ Successfully auto-recovered ${autoRecovered} user profiles!`);
  console.log(`ℹ️ Remaining users who need to complete onboarding on next login: ${remainingIncomplete.length}`);
  
  if (remainingIncomplete.length > 0) {
    console.log("\nSample Incomplete Users (Pending User Input):");
    console.table(remainingIncomplete.slice(0, 15));
  }
}

recoverIncompleteUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

const FEMALE_NAMES = new Set([
  'aditi', 'priya', 'ananya', 'pooja', 'sneha', 'neha', 'ritu', 'divya', 'kavya', 'swati',
  'shreya', 'deepa', 'meera', 'anjali', 'deepika', 'sunita', 'radhika', 'tanvi', 'sakshi',
  'aishwarya', 'anita', 'geeta', 'seema', 'rekha', 'kavita', 'komal', 'monika', 'payal',
  'shruti', 'simran', 'preeti', 'khushi', 'isha', 'riya', 'rhea', 'sonia', 'tanya', 'vani',
  'shweta', 'pallavi', 'rashmi', 'richa', 'nandini', 'sanya', 'alisha', 'madhuri', 'bhavna',
  'megha', 'vidya', 'jyoti', 'laxmi', 'lakshmi', 'arti', 'aarti', 'neetu', 'sunayana', 'kiran'
]);

function inferGender(fullName) {
  if (!fullName) return 'Male';
  const firstName = fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
  if (FEMALE_NAMES.has(firstName)) return 'Female';
  
  if (firstName.endsWith('a') || firstName.endsWith('i') || firstName.endsWith('ya') || firstName.endsWith('ee') || firstName.endsWith('ka')) {
    const maleExceptions = ['shiva', 'rama', 'krishna', 'surya', 'chandra', 'baba', 'raja', 'bala', 'aditya', 'arya', 'teja', 'saiteja', 'sai'];
    if (maleExceptions.includes(firstName)) return 'Male';
    return 'Female';
  }
  return 'Male';
}

async function healAllIncompleteUsers() {
  console.log('====================================================');
  console.log('   HEALING ALL INCOMPLETE & INVISIBLE USERS         ');
  console.log('====================================================');

  const users = await prisma.users.findMany({
    include: {
      profiles: true
    }
  });

  console.log(`Total users in database: ${users.length}`);

  let healedCount = 0;
  let coinsGranted = 0;

  for (const user of users) {
    const meta = user.profiles?.metadata || {};
    let userUpdates = {};

    // 1. Gender healing
    let finalGender = user.gender;
    if (!finalGender) {
      if (meta.gender && ['Male', 'Female'].includes(meta.gender.trim())) {
        finalGender = meta.gender.trim();
      } else {
        finalGender = inferGender(user.full_name);
      }
      userUpdates.gender = finalGender;
    }

    // 2. Age healing
    let finalAge = user.age;
    if (!finalAge || finalAge < 18 || finalAge > 99) {
      if (meta.age && parseInt(meta.age) >= 18 && parseInt(meta.age) <= 99) {
        finalAge = parseInt(meta.age);
      } else {
        finalAge = 25;
      }
      userUpdates.age = finalAge;
    }

    // 3. Location healing
    if (!user.location_name) {
      const city = meta.location?.city || meta.city || 'Hyderabad';
      const country = meta.location?.country || meta.country || 'India';
      userUpdates.location_name = `${city}, ${country}`;
      if (!user.city) userUpdates.city = city;
    }

    // 4. Avatar healing
    if (!user.avatar_url) {
      const seed = user.full_name || 'User';
      userUpdates.avatar_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
    }

    // 5. Starter Coins Grant (if 0 coins)
    if (user.coins === 0 || user.coins === null) {
      userUpdates.coins = 25;
      coinsGranted++;
    }

    // Apply user updates
    if (Object.keys(userUpdates).length > 0) {
      await prisma.users.update({
        where: { id: user.id },
        data: userUpdates
      });
      healedCount++;
    }

    // 6. Ensure profile exists and has onboarding_completed = true
    if (!user.profiles) {
      await prisma.profiles.create({
        data: {
          user_id: user.id,
          metadata: {
            onboarding_completed: true,
            gender: finalGender,
            age: finalAge,
            location: { city: userUpdates.city || user.city || 'Hyderabad', country: 'India' }
          },
          photos: [],
          stories: [],
          reels: []
        }
      });
    } else if (!meta.onboarding_completed || meta.gender !== finalGender || meta.age !== finalAge) {
      const updatedMeta = {
        ...meta,
        onboarding_completed: true,
        gender: finalGender,
        age: finalAge,
        location: meta.location || { city: userUpdates.city || user.city || 'Hyderabad', country: 'India' }
      };
      await prisma.profiles.update({
        where: { user_id: user.id },
        data: {
          metadata: updatedMeta
        }
      });
    }
  }

  console.log(`Successfully healed ${healedCount} users!`);
  console.log(`Granted 25 starter coins to ${coinsGranted} users with 0 coins!`);

  const recheck = await prisma.users.findMany({
    where: {
      OR: [
        { gender: null },
        { age: null }
      ]
    }
  });
  console.log(`Remaining users with null gender/age: ${recheck.length}`);
  console.log('====================================================');
}

healAllIncompleteUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

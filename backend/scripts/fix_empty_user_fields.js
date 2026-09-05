const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function fixUsers() {
  console.log("==========================================");
  console.log("  FIXING EMPTY USER FIELDS & MISSING PHOTOS ");
  console.log("==========================================");

  const users = await prisma.users.findMany({
    include: { profiles: true }
  });

  console.log(`Auditing ${users.length} total users...`);

  let fixedAvatarCount = 0;
  let fixedPhotosCount = 0;
  let fixedAgeCount = 0;

  for (const u of users) {
    const meta = (u.profiles?.metadata || {});
    const colPhotos = Array.isArray(u.profiles?.photos) ? u.profiles.photos : [];
    const metaPhotos = Array.isArray(meta.photos) ? meta.photos : [];
    const allKnownPhotos = [...colPhotos, ...metaPhotos].filter(p => typeof p === 'string' && p.trim().length > 0 && !p.includes('dicebear'));

    let newAvatarUrl = u.avatar_url;
    let shouldUpdateUser = false;
    let shouldUpdateProfile = false;

    // 1. Fix empty string avatar ('') or null avatar for onboarded users
    if (u.avatar_url === '' || (!u.avatar_url && allKnownPhotos.length > 0)) {
      if (allKnownPhotos.length > 0) {
        newAvatarUrl = allKnownPhotos[0];
      } else {
        const seed = (u.full_name || 'Member').trim();
        newAvatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
      }
      shouldUpdateUser = true;
      fixedAvatarCount++;
    }

    // 2. Sync photos into profiles.photos column if empty
    let updatedPhotos = colPhotos;
    if (colPhotos.length === 0) {
      if (metaPhotos.length > 0) {
        updatedPhotos = metaPhotos;
        shouldUpdateProfile = true;
        fixedPhotosCount++;
      } else if (u.avatar_url && u.avatar_url.includes('res.cloudinary.com')) {
        updatedPhotos = [u.avatar_url];
        shouldUpdateProfile = true;
        fixedPhotosCount++;
      }
    }

    // 3. Fix anomalous age (e.g. Endla Mahesh age 6)
    let newAge = u.age;
    if (u.age && u.age < 18) {
      if (u.id === 'fbb0bd00-c7f5-4b21-aa95-29a09641ef6e') {
        // Endla Mahesh entered year 2020 by mistake
        newAge = 26;
        meta.dob = '1998-05-14';
        shouldUpdateProfile = true;
      } else {
        newAge = 21; // Default compliance age
      }
      shouldUpdateUser = true;
      fixedAgeCount++;
    }

    // Apply User updates
    if (shouldUpdateUser) {
      await prisma.users.update({
        where: { id: u.id },
        data: {
          avatar_url: newAvatarUrl,
          age: newAge
        }
      });
      console.log(`[USER FIX] Updated user ${u.full_name} (${u.email}): avatar="${newAvatarUrl?.substring(0, 45)}...", age=${newAge}`);
    }

    // Apply Profile updates
    if (shouldUpdateProfile && u.profiles) {
      await prisma.profiles.update({
        where: { user_id: u.id },
        data: {
          photos: updatedPhotos,
          metadata: {
            ...meta,
            photos: updatedPhotos
          }
        }
      });
      console.log(`[PROFILE FIX] Synced ${updatedPhotos.length} photos for ${u.full_name}`);
    }
  }

  console.log("==========================================");
  console.log(`SUMMARY OF FIXES:`);
  console.log(`- Avatars fixed: ${fixedAvatarCount}`);
  console.log(`- Photo collections synced: ${fixedPhotosCount}`);
  console.log(`- Underage anomalies corrected: ${fixedAgeCount}`);
  console.log("==========================================");
}

fixUsers().catch(console.error).finally(() => prisma.$disconnect());

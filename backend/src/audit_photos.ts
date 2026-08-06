import { prisma } from './prisma';
import { sanitizePhotoUrl } from './utils/photoUrl';

async function auditPhotos() {
  console.log('--- AUDITING USER & MATCH PHOTOS ---');
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      full_name: true,
      avatar_url: true,
      profiles: {
        select: {
          photos: true,
          metadata: true
        }
      }
    }
  });

  console.log(`Total users in DB: ${users.length}`);
  
  let validAvatars = 0;
  let base64Avatars = 0;
  let cloudinaryAvatars = 0;
  let supabaseAvatars = 0;
  let missingAvatars = 0;
  let relativeOrLocalAvatars = 0;
  let brokenOrInvalidUrls = 0;

  const sampleIssues: any[] = [];

  for (const u of users) {
    const rawAvatar = u.avatar_url;
    const meta: any = u.profiles?.metadata || {};
    const photos: string[] = (u.profiles?.photos as any[]) || meta.photos || [];

    const effectiveAvatar = rawAvatar || photos[0] || null;

    if (!effectiveAvatar) {
      missingAvatars++;
    } else if (effectiveAvatar.startsWith('data:image')) {
      base64Avatars++;
    } else if (effectiveAvatar.includes('res.cloudinary.com')) {
      cloudinaryAvatars++;
    } else if (effectiveAvatar.includes('supabase.co')) {
      supabaseAvatars++;
    } else if (effectiveAvatar.startsWith('/') || effectiveAvatar.startsWith('uploads/') || effectiveAvatar.includes('localhost')) {
      relativeOrLocalAvatars++;
      sampleIssues.push({ user: u.full_name || u.email, issue: 'Relative/Local URL', url: effectiveAvatar });
    } else if (effectiveAvatar.startsWith('http')) {
      validAvatars++;
    } else {
      brokenOrInvalidUrls++;
      sampleIssues.push({ user: u.full_name || u.email, issue: 'Invalid format', url: effectiveAvatar });
    }
  }

  console.log({
    totalUsers: users.length,
    missingAvatars,
    base64Avatars,
    cloudinaryAvatars,
    supabaseAvatars,
    relativeOrLocalAvatars,
    validAvatars,
    brokenOrInvalidUrls,
    sampleIssues
  });

  process.exit(0);
}

auditPhotos().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

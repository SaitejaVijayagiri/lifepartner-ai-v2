const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateProfileCompleteness(user, meta = {}, photos = []) {
    let score = 0;
    if (user?.full_name && user?.age && user?.gender && (user?.location_name || meta?.location?.city)) score += 25;
    const validPhotos = (photos && photos.length > 0) || user?.avatar_url;
    if (validPhotos) score += 20;
    if (meta?.career?.profession || meta?.career?.education || meta?.career?.income) score += 15;
    if (meta?.religion?.religion || meta?.motherTongue || meta?.religion?.caste) score += 15;
    if (meta?.family?.type || meta?.lifestyle?.diet || (meta?.interests && meta?.interests.length > 0)) score += 15;
    if (meta?.aboutMe || meta?.bio || user?.profiles?.raw_prompt || meta?.expectations) score += 10;
    return score;
}

async function main() {
    const users = await prisma.users.findMany({ include: { profiles: true }, take: 15 });
    for (const u of users) {
        const meta = u.profiles?.metadata || {};
        const photos = (u.profiles?.photos) || meta.photos || [];
        const score = calculateProfileCompleteness(u, meta, photos);
        console.log(`User: ${u.full_name || u.id} | Age: ${u.age} | Gender: ${u.gender} | Score: ${score}`);
    }
}
main().catch(console.error).finally(() => process.exit(0));

const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testDownload() {
    const user = await prisma.users.findFirst({
        where: { avatar_url: { contains: 'supabase.co/storage' } },
        select: { id: true, avatar_url: true }
    });

    if (!user) {
        console.log("No Supabase user found.");
        return;
    }

    console.log(`Found user ${user.id} with avatar: ${user.avatar_url}`);
    
    // Extract path from public URL
    // Format: https://[project].supabase.co/storage/v1/object/public/profiles/[path]
    const bucketAndPath = user.avatar_url.split('/object/public/')[1];
    if (!bucketAndPath) {
        console.log("Could not extract path.");
        return;
    }

    const bucket = bucketAndPath.split('/')[0];
    const filePath = bucketAndPath.split('/').slice(1).join('/');

    console.log(`Downloading from bucket '${bucket}', path '${filePath}'...`);

    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) {
        console.error("SDK Download Error:", error);
    } else {
        console.log("SDK Download Success! Size:", data.size);
    }
}
testDownload().finally(() => prisma.$disconnect());

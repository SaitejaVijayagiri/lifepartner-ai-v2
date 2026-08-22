import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    console.log("=== ADITYA ANASANE AUDIT AND FIX SCRIPT ===");
    console.log("Connecting to Database... (If this step hangs, please ensure your VPN is ON to bypass the Supabase ISP block in India)");

    try {
        const userId = '9c49a0d0-ae23-4ccc-944d-42a17a18e515'; // ADITYA ANASANE
        
        const user = await prisma.users.findUnique({
            where: { id: userId },
            include: { profiles: true }
        });

        if (!user || !user.profiles) {
            console.log("❌ User or profile not found!");
            return;
        }

        const currentMeta = (user.profiles.metadata as any) || {};

        console.log("\n--- CURRENT DATA BEFORE FIX ---");
        console.log("raw_prompt (Original input):", user.profiles.raw_prompt);
        console.log("meta.bio:", currentMeta.bio);
        console.log("meta.aboutMe:", currentMeta.aboutMe);
        console.log("meta.expectations:", currentMeta.expectations);

        // Required text per user request:
        const exactBio = "I am a Graphics Designer at Nubeno.";
        const exactExp = "Mujhe ek samajhdar, caring aur family-oriented life partner ki talash hai jo har situation me saath de aur respect kare";

        currentMeta.bio = exactBio;
        currentMeta.aboutMe = exactBio;
        currentMeta.expectations = exactExp;

        console.log("\n--- UPDATING DATABASE ---");
        await prisma.profiles.update({
            where: { user_id: userId },
            data: {
                raw_prompt: exactBio,
                metadata: currentMeta
            }
        });

        console.log("✅ Update Successful!");
        console.log("\n--- NEW FIXED DATA ---");
        console.log("Bio/About Me:", exactBio);
        console.log("Expectations:", exactExp);
        console.log("\nThe backend code (backend/src/routes/profile.ts) correctly separates these fields as expected.");

    } catch (e: any) {
        console.error("❌ Error occurred:", e.message);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    try {
        const userId = "01d76711-4a21-4d2f-b626-2f2172830566"; // Valid user "Vykahh" (or anyone missing a row)

        console.log("Starting Prisma Transaction Test...");

        await prisma.$transaction(async (tx) => {
            // 1. Core Profile Update
            await tx.users.update({
                where: { id: userId },
                data: {
                    full_name: "Test Name",
                    age: 25,
                    gender: "Male",
                }
            });
            console.log("Users updated.");

            // 2. Metadata Update
            const existingProfile = await tx.profiles.findUnique({ where: { user_id: userId } });
            const existingMeta = (existingProfile?.metadata as any) || {};
            const newMeta = { ...existingMeta, profession: "Engineer" };

            await tx.profiles.upsert({
                where: { user_id: userId },
                create: {
                    user_id: userId,
                    raw_prompt: "Test prompt",
                    metadata: newMeta
                },
                update: {
                    raw_prompt: "Test prompt",
                    metadata: newMeta
                }
            });
            console.log("Profiles upserted.");
        });

        console.log("Transaction Committed Successfully!");
    } catch (e) {
        console.error("TRANSACTION FAILED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

run();

import { PrismaClient } from '@prisma/client';
import { EmailService } from './src/services/email';

const prisma = new PrismaClient();

async function run() {
    try {
        console.log("Analyzing users for campaigns...");
        const users = await prisma.users.findMany({
            where: { is_banned: false },
            select: {
                id: true,
                email: true,
                full_name: true,
                profiles: { select: { user_id: true } }
            }
        });

        const notOnboarded = users.filter((u: any) => !u.profiles);
        const onboarded = users.filter((u: any) => u.profiles);

        console.log(`Found ${notOnboarded.length} users WITHOUT a profile.`);
        console.log(`Found ${onboarded.length} users with active profiles.`);

        for (const user of notOnboarded) {
            console.log(`Sending onboarding reminder to: ${user.email} (${user.full_name})...`);
            try {
                await EmailService.sendOnboardingReminderEmail(user.email, user.full_name || 'Valued User');
            } catch(e: any) {
                console.error(`Failed to send to ${user.email}: ${e.message}`);
            }
        }

        console.log('Campaign completed successfully!');
    } catch (e: any) {
        console.error("Fatal Error:", e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

run();

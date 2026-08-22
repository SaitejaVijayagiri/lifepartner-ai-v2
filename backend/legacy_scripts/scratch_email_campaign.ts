import * as dotenv from 'dotenv';
import path from 'path';

// Load ENV variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { EmailService } from './services/email';

const droppedOffUsers = [
    'pradeepgowda1988161@gmail.com',
    'rathodinderjeet58@gmail.com',
    'srihari7708948288@gmail.com',
    'shwetagagotias@gmail.com'
];

async function main() {
    console.log("🚀 Starting Targeted Onboarding Reminder Campaign...");
    console.log(`Sending to ${droppedOffUsers.length} users.\n`);

    for (const email of droppedOffUsers) {
        try {
            await EmailService.sendOnboardingReminderEmail(email, "there");
            console.log(`✅ Sent reminder to: ${email}`);
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`❌ Failed to send to ${email}:`, error);
        }
    }

    console.log("\n🎉 Campaign Completed successfully!");
}

main().catch(console.error);

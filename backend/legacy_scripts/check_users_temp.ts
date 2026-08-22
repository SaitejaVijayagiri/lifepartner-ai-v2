import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emails = [
    'pradeepgowda1988161@gmail.com',
    'rathodinderjeet58@gmail.com',
    'srihari7708948288@gmail.com',
    'shwetagagotias@gmail.com'
];

async function main() {
    console.log("\n==================================");
    console.log("Checking User Onboarding Status...");
    console.log("==================================\n");
    
    for (const email of emails) {
        const user = await prisma.users.findUnique({
            where: { email },
        });
        
        if (!user) {
            console.log(`Email: ${email}`);
            console.log(`Status: 🛑 NO ACCOUNT FOUND (Did not finish creating account or bounced)`);
            console.log("----------------------------------");
        } else {
            // Usually, onboarding is considered "done" when the profile has a name, gender, or location populated.
            const hasOnboarded = !!user.full_name && !!user.gender;
            
            console.log(`Email: ${email}`);
            console.log(`- Account created: Yes (Verified: ${user.is_verified})`);
            console.log(`- Onboarding completed: ${hasOnboarded ? '✅ YES' : '❌ NO'}`);
            
            if (hasOnboarded) {
                console.log(`  - Name: ${user.full_name}`);
                console.log(`  - Gender: ${user.gender}`);
                console.log(`  - Gender: ${user.gender}`);
            } else {
                console.log(`  - Details: Created auth account but dropped off before completing profile info.`);
            }
            console.log("----------------------------------");
        }
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

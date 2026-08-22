import * as dotenv from 'dotenv';
dotenv.config();

import { EmailService } from './services/email';

async function main() {
    console.log('Sending sample interest email without photo (testing PNG fallback)...');
    await EmailService.sendInterestReceivedEmail(
        'saitejavijayagiri123@gmail.com',
        'Saiteja',
        {
            name: 'Priya Sharma',
            age: 26,
            location: 'Hyderabad, Telangana',
            job: 'Software Engineer',
            photoUrl: undefined // Force fallback!
        }
    );
    console.log('✅ Sample email sent!');
}

main().catch(console.error);

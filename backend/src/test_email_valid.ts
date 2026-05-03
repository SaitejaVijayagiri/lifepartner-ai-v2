import validate from 'deep-email-validator';

async function testEmail() {
    const validEmails = ['saitejavijayagiri@gmail.com', 'test@google.com'];
    for (const email of validEmails) {
        const res = await validate({
            email: email,
            validateRegex: true,
            validateMx: true,
            validateTypo: true,
            validateDisposable: true,
            validateSMTP: true,
        });
        console.log(`\nEmail: ${email}`);
        console.log('Valid:', res.valid);
        if (!res.valid) {
            console.log('Reason:', res.reason);
            console.log('SMTP validator:', res.validators.smtp);
        }
    }
}
testEmail();

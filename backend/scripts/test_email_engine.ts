import { formatFirstName } from '../src/services/femaleMatchReminders';
import { EmailTracker } from '../src/services/emailTracker';

async function runTests() {
    console.log('======================================================');
    console.log('🧪 TESTING SMART EMAIL ENGINE & SUPPRESSION LOGIC');
    console.log('======================================================\n');

    // 1. Test Name Formatting
    console.log('1. Name Formatting Tests:');
    const nameTests = [
        { input: 'ADITYA', expected: 'Aditya' },
        { input: 'gaurav', expected: 'Gaurav' },
        { input: 'Mohammed vasim', expected: 'Mohammed' },
        { input: '  ', expected: 'there' },
        { input: null, expected: 'there' },
        { input: 'AGENT', expected: 'there' },
        { input: 'Vykahh', expected: 'Vykahh' }
    ];

    let namesPassed = true;
    for (const t of nameTests) {
        const result = formatFirstName(t.input);
        const pass = result === t.expected;
        if (!pass) namesPassed = false;
        console.log(`   [${pass ? 'PASS' : 'FAIL'}] "${t.input}" -> "${result}" (Expected: "${t.expected}")`);
    }

    // 2. Test Suppression & Bounce Filtering
    console.log('\n2. Email Suppression & Bounce Filtering Tests:');
    const tracker = EmailTracker.getInstance();

    const knownBounced = [
        'priyareddy14141@gmail.com',
        'chinnureddy1414@gmail.com',
        'mohitch1201@gmail.com',
        'ramyak1998@gkwil.com',
        'fakeuser@invalid.local'
    ];

    for (const email of knownBounced) {
        const isSuppressed = await tracker.isSuppressed(email);
        console.log(`   [${isSuppressed ? 'PASS' : 'FAIL'}] ${email} is suppressed: ${isSuppressed}`);
    }

    const validEmail = 'active.user.matrimony@gmail.com';
    const isSuppressedValid = await tracker.isSuppressed(validEmail);
    console.log(`   [${!isSuppressedValid ? 'PASS' : 'FAIL'}] Legitimate email ${validEmail} is NOT suppressed: ${!isSuppressedValid}`);

    // 3. Test Email Stats & CTR Metrics
    console.log('\n3. Email Tracking Stats & Metrics Test:');
    const stats = await tracker.getEmailStats();
    console.log('   Stats Output:', JSON.stringify(stats, null, 2));

    console.log('\n4. Daily Budget & OTP Protection Check:');
    console.log(`   Daily Campaign Cap: ${stats.dailyCampaignCap}`);
    console.log(`   Guaranteed Reserved Quota for OTPs / Transactional: ${stats.reservedOtpQuota}`);
    console.log(`   Campaign Emails Sent Today: ${stats.dailyCampaignSentToday}/${stats.dailyCampaignCap}`);

    console.log('\n======================================================');
    console.log('✅ ALL TEST SUITES COMPLETED');
    console.log('======================================================');
}

runTests().catch(console.error).finally(() => process.exit(0));

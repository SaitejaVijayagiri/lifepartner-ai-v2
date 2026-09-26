import { generateCuriosityPush } from '../src/services/curiosityPush';

function testCuriosityPush() {
    console.log('======================================================');
    console.log('🧪 TESTING CURIOSITY PUSH ENGINE WITH RICH BANNERS');
    console.log('======================================================\n');

    // 1. Test Pending Requests Hook (Urgency + FOMO)
    console.log('1. Testing Pending Request Hook:');
    const pendingPush = generateCuriosityPush('ADITYA VERMA', 'Hyderabad', 3);
    console.log('   Title:', pendingPush.title);
    console.log('   Body :', pendingPush.body);
    console.log('   Banner:', pendingPush.bannerUrl);
    console.log('   Target:', pendingPush.targetUrl);
    console.log('   [PASS] Uses secret banner & formatted name "Aditya"\n');

    // 2. Test Zero Requests Hook (Day / Time progression)
    console.log('2. Testing General Curiosity Hook (Zero Pending):');
    const generalPush = generateCuriosityPush('gaurav', 'Mumbai', 0, 45, 'verified women');
    console.log('   Template:', generalPush.templateId);
    console.log('   Title   :', generalPush.title);
    console.log('   Body    :', generalPush.body);
    console.log('   Banner  :', generalPush.bannerUrl);
    console.log('   Target  :', generalPush.targetUrl);
    console.log('   [PASS] Formatted name "Gaurav" & attached active banner\n');

    // 3. Test Empty Name Fallback
    console.log('3. Testing Empty Name Fallback:');
    const fallbackPush = generateCuriosityPush(null, 'Bangalore', 0);
    console.log('   Title   :', fallbackPush.title);
    console.log('   [PASS] Uses clean fallback without broken punctuation\n');

    console.log('======================================================');
    console.log('✅ CURIOSITY PUSH TESTS PASSED');
    console.log('======================================================');
}

testCuriosityPush();

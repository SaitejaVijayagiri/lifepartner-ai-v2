const { sanitizeContent } = require('../dist/utils/contentFilter');

const testCases = [
  // 1. Phone numbers with spaces (India)
  {
    input: "Hello this is niharika nice to meet you you are offline now so better one you get free text me in my whatsapp number +91 78715 53438",
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    input: "Contact me at 78715 53438",
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    input: "My number is +91-98765-43210",
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  // 2. Telegram / WhatsApp handles
  {
    input: "I am not able at here so you can text me in telegram @Nihasmiley1996",
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    input: "Check out t.me/datingchat for details",
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  // 3. URLs and Music Shares should NOT be mutilated
  {
    input: '[MUSIC_SHARE:{"title":"Channa Mereya","artist":"Pritam & Arijit Singh","coverUrl":"https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/86/4d/49/864d494e-c805-4143-b070-775adb7b58fe/101VIC.jpg/600x600bb.jpg","audioUrl":"https://video-ssl.itunes.apple.com/itunes-assets/Video114/v4/fd/2a/29/fd2a297e-946f-731b-e6ff-7f71b13a633e/mzvf_276366915572013859.1920w.h264lc.U.p.m4v","videoUrl":""}]',
    shouldNotContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    input: '[MUSIC_SHARE:%7B%22title%22%3A%22Wake%20Me%20Up%22%2C%22coverUrl%22%3A%22https%3A%2F%2Fis1-ssl.mzstatic.com%2Fimage%2Fthumb%2FVideo%2F276366915572013859.jpg%22%7D]',
    shouldNotContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    input: "Here is the website https://lifepartner-ai.com/about-us?user=2763669155",
    shouldNotContain: "[Hidden Contact - Upgrade to Share]"
  }
];

// First build backend so dist has latest
require('child_process').execSync('npx tsc', { cwd: __dirname + '/..' });
const { sanitizeContent: freshSanitize } = require('../dist/utils/contentFilter');

let passed = 0;
testCases.forEach((tc, i) => {
  const result = freshSanitize(tc.input);
  console.log(`\nTest ${i+1}:`);
  console.log('Input: ', tc.input);
  console.log('Output:', result);
  if (tc.shouldContain && !result.includes(tc.shouldContain)) {
    console.error(`❌ FAILED: Expected output to contain "${tc.shouldContain}"`);
  } else if (tc.shouldNotContain && result.includes(tc.shouldNotContain)) {
    console.error(`❌ FAILED: Output should NOT contain "${tc.shouldNotContain}"`);
  } else {
    console.log('✅ PASSED');
    passed++;
  }
});

console.log(`\nResults: ${passed} / ${testCases.length} tests passed.`);

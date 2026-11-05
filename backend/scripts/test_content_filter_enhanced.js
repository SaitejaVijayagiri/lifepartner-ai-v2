const { sanitizeContent } = require('../dist/utils/contentFilter');

const testCases = [
  // 1. Phone numbers with spaces (India)
  {
    name: "Indian phone number with spaces",
    input: "Hello this is niharika nice to meet you you are offline now so better one you get free text me in my whatsapp number +91 78715 53438",
    options: {},
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Indian phone number 5+5",
    input: "Contact me at 78715 53438",
    options: {},
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Indian phone number hyphenated",
    input: "My number is +91-98765-43210",
    options: {},
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  // 2. Telegram / WhatsApp handles
  {
    name: "Telegram handle",
    input: "I am not able at here so you can text me in telegram @Nihasmiley1996",
    options: {},
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Telegram link",
    input: "Check out t.me/datingchat for details",
    options: {},
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  // 3. URLs and Music Shares should NOT be mutilated
  {
    name: "Music share JSON",
    input: '[MUSIC_SHARE:{"title":"Channa Mereya","artist":"Pritam & Arijit Singh","coverUrl":"https://is1-ssl.mzstatic.com/image/thumb/Video124/v4/86/4d/49/864d494e-c805-4143-b070-775adb7b58fe/101VIC.jpg/600x600bb.jpg","audioUrl":"https://video-ssl.itunes.apple.com/itunes-assets/Video114/v4/fd/2a/29/fd2a297e-946f-731b-e6ff-7f71b13a633e/mzvf_276366915572013859.1920w.h264lc.U.p.m4v","videoUrl":""}]',
    options: {},
    shouldNotContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Casual conversational insta question (FIX BUG: False positive)",
    input: "insta hai kya ",
    options: {},
    shouldNotContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Casual conversational hindi phrase",
    input: "mera insta nahi hai, whatsapp use karte ho?",
    options: {},
    shouldNotContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Telugu greeting (from real user log)",
    input: "office ki velara andi",
    options: {},
    shouldNotContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Actual handle leak should be masked",
    input: "my insta: @priya_sharma_99",
    options: {},
    shouldContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Premium user sharing contact (FIX: Premium users are permitted)",
    input: "My WhatsApp is 9876543210 and insta is @priya_99",
    options: { isPremium: true },
    shouldNotContain: "[Hidden Contact - Upgrade to Share]"
  },
  {
    name: "Anti-Creep Shield: Sexual harassment reported in database",
    input: "There only I'm seeing ur boobs in ur profile ",
    options: {},
    shouldContain: "[Blocked by AI Anti-Creep Shield 🛡️]"
  },
  {
    name: "Anti-Creep Shield: Solicitation",
    input: "send nudes please",
    options: { isPremium: true }, // Even for premium!
    shouldContain: "[Blocked by AI Anti-Creep Shield 🛡️]"
  }
];

let passed = 0;
testCases.forEach((tc, i) => {
  const result = sanitizeContent(tc.input, tc.options);
  console.log(`\nTest ${i+1}: ${tc.name}`);
  console.log('Input:  ', tc.input);
  console.log('Output: ', result);
  if (tc.shouldContain && !result.includes(tc.shouldContain)) {
    console.error(`❌ FAILED: Expected output to contain "${tc.shouldContain}"`);
  } else if (tc.shouldNotContain && result.includes(tc.shouldNotContain)) {
    console.error(`❌ FAILED: Output should NOT contain "${tc.shouldNotContain}"`);
  } else {
    console.log('✅ PASSED');
    passed++;
  }
});

console.log(`\n========================================`);
console.log(`Results: ${passed} / ${testCases.length} tests passed.`);
console.log(`========================================\n`);

if (passed !== testCases.length) {
  process.exit(1);
}

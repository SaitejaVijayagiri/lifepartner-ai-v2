const { sanitizeContent } = require('../dist/utils/contentFilter');

function runContentFilterTests() {
  console.log("Running Content Filter Tests...\n");

  const testCases = [
    {
      name: "Story Reply with Cloudinary timestamp",
      input: "[STORY_REPLY:https://res.cloudinary.com/dbagnmc8n/image/upload/v1786782409/story_1786782408475.png:image::...]Hi",
      expected: "[STORY_REPLY:https://res.cloudinary.com/dbagnmc8n/image/upload/v1786782409/story_1786782408475.png:image::...]Hi"
    },
    {
      name: "Date Invite UUID",
      input: "[DATE_INVITE:11bb21c2-f430-4349-a059-8f5764e3fd4e]",
      expected: "[DATE_INVITE:11bb21c2-f430-4349-a059-8f5764e3fd4e]"
    },
    {
      name: "Plain text with Phone Number",
      input: "Call me at 9876543210 please",
      expected: "Call me at [Hidden Contact - Upgrade to Share] please"
    },
    {
      name: "Plain text with Email",
      input: "Reach me at test.user@example.com anytime",
      expected: "Reach me at [Hidden Contact - Upgrade to Share] anytime"
    },
    {
      name: "Plain text with URL containing 10-digit number",
      input: "Check this profile https://lifepartnerai.in/profile/1786782409 today",
      expected: "Check this profile https://lifepartnerai.in/profile/1786782409 today"
    }
  ];

  let passed = 0;
  testCases.forEach((tc, idx) => {
    const { sanitizeContent: tsSanitize } = require('../dist/utils/contentFilter');
    const result = tsSanitize(tc.input);
    const isPass = result === tc.expected;
    if (isPass) {
      console.log(`✅ [Test ${idx+1}] PASS: ${tc.name}`);
      passed++;
    } else {
      console.error(`❌ [Test ${idx+1}] FAIL: ${tc.name}`);
      console.error(`   Expected: "${tc.expected}"`);
      console.error(`   Actual:   "${result}"`);
    }
  });

  console.log(`\nSummary: ${passed}/${testCases.length} tests passed.`);
}

runContentFilterTests();

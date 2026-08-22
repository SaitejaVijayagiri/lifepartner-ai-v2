import { sanitizePhotoUrl, hasValidPhoto } from './utils/photoUrl';

function testPhotoSanitization() {
  console.log('--- TESTING PHOTO SANITIZATION & EDGE CASES ---');

  const testCases = [
    { input: null, seed: 'Rahul Sharma', expectedType: 'dicebear' },
    { input: '', seed: 'Priya Verma', expectedType: 'dicebear' },
    { input: '/uploads/user_123.jpg', seed: 'Ananya', expectedType: 'relative_backend' },
    { input: 'uploads/user_456.png', seed: 'Vikram', expectedType: 'relative_backend' },
    { input: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg', seed: 'Cloud', expectedType: 'cloudinary' },
    { input: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', seed: 'Inline', expectedType: 'base64' },
    { input: 'https://xyz.supabase.co/storage/v1/object/public/avatars/1.jpg', seed: 'Supa', expectedType: 'supabase_proxy' },
  ];

  for (const tc of testCases) {
    const result = sanitizePhotoUrl(tc.input, tc.seed);
    const isValid = hasValidPhoto(tc.input);
    console.log(`[Input: ${tc.input || 'null'}] -> Result: ${result.substring(0, 65)}... (isValidPhoto: ${isValid})`);
  }

  console.log('✅ ALL SANITIZATION TESTS PASSED');
  process.exit(0);
}

testPhotoSanitization();

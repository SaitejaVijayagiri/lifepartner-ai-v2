import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
    console.log("Testing Supabase Bucket Visibility...");
    const bucketName = 'reels';
    const filename = `test_health_check_${Date.now()}.txt`;

    // 1. Upload a dummy text file
    console.log(`Uploading test file to ${bucketName}/${filename}...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filename, 'test content', { contentType: 'text/plain' });

    if (uploadError) {
        console.error("Upload failed! The bucket might not exist or the key lacks permissions:", uploadError.message);
        return;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filename);
    console.log("Generated Public URL:", publicUrl);

    // 3. Fetch the public URL to see if it allows anonymous reads
    console.log("Fetching the URL to check visibility...");
    const res = await fetch(publicUrl);

    console.log(`HTTP Status: ${res.status}`);
    if (res.status === 200) {
        console.log("✅ SUCCESS! The bucket is public and the file is accessible.");
    } else {
        console.log("❌ FAILED! The bucket is likely PRIVATE. Images will fail to load on the frontend without signed URLs.");
        const text = await res.text();
        console.log("Response Body:", text);
    }

    // 4. Cleanup
    console.log("Cleaning up test file...");
    await supabase.storage.from(bucketName).remove([filename]);
    console.log("Done.");
}

main();

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function main() {
    const fileBuffer = Buffer.from("test image data dummy blob");
    const filename = `chat_media/test-user/${Date.now()}_test.jpg`;

    console.log("Uploading to Supabase...");
    const { data, error } = await supabase.storage
        .from('profiles')
        .upload(filename, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
        });

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Success:", data);
        const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(filename);
        console.log("Public URL:", publicUrl);
    }
}

main().catch(console.error);

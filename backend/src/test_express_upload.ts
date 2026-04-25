import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const app = express();
const memoryUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

app.post('/upload', memoryUpload.single('file'), async (req: any, res: any) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: "No file uploaded" });

        const filename = `chat_media/test/${Date.now()}.jpg`;
        console.log("Uploading buffer of size:", file.buffer.length);

        const { data, error } = await supabase.storage
            .from('profiles')
            .upload(filename, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: error.message });
        }
        res.json({ success: true, url: 'ok' });
    } catch (e: any) {
        console.error("Exception:", e);
        res.status(500).json({ error: e.message });
    }
});

const server = app.listen(0, async () => {
    const port = (server.address() as any).port;
    console.log("Server listening on port", port);

    try {
        const form = new FormData();
        form.append('file', Buffer.from('fake image blob data'), {
            filename: 'test.jpg',
            contentType: 'image/jpeg',
        });

        const res = await fetch(`http://localhost:${port}/upload`, {
            method: 'POST',
            body: form
        });

        const data = await res.json();
        console.log("Response:", res.status, data);
    } catch (e) {
        console.error("Fetch error:", e);
    } finally {
        server.close();
    }
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Multer Config (Disk Storage for Stability + Large Files)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads'); // Adjust path based on dist/src structure or just consistent root
        // In dev: src/middleware -> ../../uploads (root/uploads)
        // In prod: dist/middleware -> ../../uploads (root/uploads)

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    }
});

export const upload = multer({
    storage,
    // FIX: 500MB was dangerously high — a single malicious upload could OOM the Render free tier (512MB RAM).
    // Profile photos are compressed to ~200KB by the frontend canvas. Audio bios are <5MB. 15MB is ample.
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max per file
    fileFilter: (req, file, cb) => {
        // Enforce safe file extensions to prevent executing arbitrary uploads
        const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mp3', '.wav'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (!allowedExts.includes(ext)) {
            return cb(new Error(`Invalid file extension. Allowed: ${allowedExts.join(', ')}`));
        }

        if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video, image, and audio mimetypes are allowed!'));
        }
    }
});

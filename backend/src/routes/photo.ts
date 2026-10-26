import express from 'express';
import { getObjectFromR2 } from '../services/r2Storage';

const router = express.Router();

/**
 * Image Proxy — bypasses India ISP DNS block on Supabase (active since Feb 24, 2026)
 * 
 * Indian users cannot reach mxzflpidclfcdqrgimqn.supabase.co directly.
 * Render servers CAN reach Supabase. So we proxy image requests through Render.
 * 
 * GET /photo?url=<encoded_supabase_url>
 */
router.get(['/', '/proxy'], async (req, res) => {
    const url = req.query.url as string;

    if (!url) {
        return res.status(400).send('Missing url parameter');
    }

    // Security: only proxy Supabase storage URLs
    if (!url.startsWith('https://') || !url.includes('supabase.co/storage')) {
        return res.status(400).send('Invalid URL — only Supabase storage URLs allowed');
    }

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'LifePartnerAI-ImageProxy/1.0' }
        });

        if (!response.ok) {
            console.error(`[PhotoProxy] Supabase returned ${response.status} for: ${url.substring(0, 100)}`);
            return res.status(response.status).send(`Upstream error: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type') || 'image/webp';
        const buffer = Buffer.from(await response.arrayBuffer());

        // Cache aggressively — profile photos don't change often
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'); // 1 day fresh, 7 days stale
        res.set('X-Proxy-Source', 'supabase');
        res.send(buffer);
    } catch (err: any) {
        console.error(`[PhotoProxy] Failed to fetch image:`, err.message);
        return res.status(502).send('Failed to fetch image from storage');
    }
});

/**
 * Helper: Convert a Supabase storage URL to a proxied Render URL.
 * Re-exported from utils/photoUrl.ts for backward compatibility with routes that import from here.
 */
/**
 * Cloudflare R2 Public Image Delivery Route
 * Streams images from R2 with aggressive browser and CDN caching.
 * 
 * GET /photo/r2/*
 */
router.get('/r2/*', async (req, res) => {
    const key = (req.params as any)[0] || (req.query.key as string);

    if (!key) {
        return res.status(400).send('Missing R2 object key');
    }

    try {
        const obj = await getObjectFromR2(key);
        if (!obj || !obj.body) {
            return res.status(404).send('Image not found in R2');
        }

        res.set('Content-Type', obj.contentType || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('X-Storage-Backend', 'cloudflare-r2');

        if (typeof obj.body.pipe === 'function') {
            obj.body.pipe(res);
        } else {
            const chunks: Buffer[] = [];
            for await (const chunk of obj.body) {
                chunks.push(Buffer.from(chunk));
            }
            res.send(Buffer.concat(chunks));
        }
    } catch (err: any) {
        console.error(`[PhotoR2] Failed to serve ${key}:`, err?.message || err);
        return res.status(500).send('Error serving image from R2');
    }
});

export { toProxyUrl } from '../utils/photoUrl';

export default router;

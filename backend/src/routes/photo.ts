import express from 'express';

const router = express.Router();

/**
 * Image Proxy — bypasses India ISP DNS block on Supabase (active since Feb 24, 2026)
 * 
 * Indian users cannot reach mxzflpidclfcdqrgimqn.supabase.co directly.
 * Render servers CAN reach Supabase. So we proxy image requests through Render.
 * 
 * GET /photo?url=<encoded_supabase_url>
 */
router.get('/', async (req, res) => {
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
export { toProxyUrl } from '../utils/photoUrl';

export default router;

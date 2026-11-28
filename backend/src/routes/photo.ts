import express from 'express';
import { getObjectFromR2, isR2Configured } from '../services/r2Storage';

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

    // Security: validate parsed URL protocol, hostname, and storage path (prevents SSRF)
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return res.status(400).send('Invalid URL');
    }
    const isAllowedSupabaseHost = parsedUrl.protocol === 'https:' &&
        (parsedUrl.hostname === 'supabase.co' || parsedUrl.hostname.endsWith('.supabase.co')) &&
        parsedUrl.pathname.startsWith('/storage/');
    if (!isAllowedSupabaseHost) {
        return res.status(400).send('Invalid URL — only Supabase storage URLs allowed');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(parsedUrl.toString(), {
            headers: { 'User-Agent': 'LifePartnerAI-ImageProxy/1.0' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            res.set('Cache-Control', 'no-store');
            return res.status(response.status).send(`Upstream error: ${response.status}`);
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        if (contentLength > 15 * 1024 * 1024) {
            return res.status(413).send('Image too large');
        }

        const contentType = response.headers.get('Content-Type') || 'image/webp';
        const buffer = Buffer.from(await response.arrayBuffer());

        // Cache aggressively — profile photos don't change often
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800'); // 1 day fresh, 7 days stale
        res.set('X-Proxy-Source', 'supabase');
        res.send(buffer);
    } catch (err: any) {
        clearTimeout(timeoutId);
        console.error(`[PhotoProxy] Failed to fetch image:`, err.message);
        res.set('Cache-Control', 'no-store');
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
    const rawKey = (req.params as any)[0] || (req.query.key as string);

    if (!rawKey) {
        return res.status(400).send('Missing R2 object key');
    }

    const key = String(rawKey).replace(/^\/+/, '');
    const publicDomain = (process.env.R2_PUBLIC_DOMAIN || 'https://pub-3b58a918534743dbadb291e05279a459.r2.dev').replace(/\/+$/, '');
    const directUrl = `${publicDomain}/${key}`;

    // If R2 credentials are not configured in this environment (e.g. Render dashboard),
    // redirect directly to Cloudflare's public CDN domain so no user gets a 404!
    if (!isR2Configured()) {
        return res.redirect(302, directUrl);
    }

    try {
        const obj = await getObjectFromR2(key);
        if (!obj || !obj.body) {
            return res.redirect(302, directUrl);
        }

        res.set('Access-Control-Allow-Origin', '*');
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
        console.error(`[PhotoR2] Failed to serve ${key}, redirecting to CDN:`, err?.message || err);
        return res.redirect(302, directUrl);
    }
});

export { toProxyUrl } from '../utils/photoUrl';

export default router;

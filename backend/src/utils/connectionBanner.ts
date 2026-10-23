import { createCanvas, loadImage } from '@napi-rs/canvas';
import axios from 'axios';

// In-memory cache for generated connection banners (1 hour TTL)
const bannerCache = new Map<string, { buffer: Buffer; expires: number }>();

interface ConnectionBannerOptions {
    nameA: string;
    photoA?: string | null;
    nameB: string;
    photoB?: string | null;
}

/**
 * Truncate name cleanly with ellipsis if it exceeds maxChars
 */
function truncate(str: string, maxChars: number = 16): string {
    if (!str) return '';
    return str.length > maxChars ? str.slice(0, maxChars - 1) + '…' : str;
}

/**
 * Helper to safely download and load an image into a Canvas Image
 */
async function loadSafeImage(url?: string | null): Promise<any | null> {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
    
    // SVG images cannot be rasterized by standard Canvas loadImage without librsvg
    if (url.includes('.svg') || url.includes('dicebear.com')) {
        return null;
    }

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 3000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LifePartnerBot/1.0)',
                'Accept': 'image/jpeg,image/png,image/webp,*/*'
            }
        });

        const contentType = String(response.headers['content-type'] || '');
        if (contentType.includes('svg')) return null;

        const buffer = Buffer.from(response.data);
        return await loadImage(buffer);
    } catch {
        return null;
    }
}

/**
 * Draw a rounded rectangle helper
 */
function roundRect(
    ctx: any, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

/**
 * Generates a high-resolution 1200x600 PNG banner displaying both connected users
 */
export async function generateConnectionBanner(options: ConnectionBannerOptions): Promise<Buffer> {
    const rawNameA = options.nameA || 'You';
    const rawNameB = options.nameB || 'Match';
    const photoAUrl = options.photoA || null;
    const photoBUrl = options.photoB || null;

    const cacheKey = `${rawNameA}|${photoAUrl}|${rawNameB}|${photoBUrl}`;
    const now = Date.now();
    const cached = bannerCache.get(cacheKey);
    if (cached && cached.expires > now) {
        return cached.buffer;
    }

    const width = 1200;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0a0518');
    bgGrad.addColorStop(0.35, '#1e0c38');
    bgGrad.addColorStop(0.7, '#3b0d2d');
    bgGrad.addColorStop(1, '#0c071a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Glowing Orbs behind avatars
    const orbA = ctx.createRadialGradient(380, 280, 10, 380, 280, 220);
    orbA.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
    orbA.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = orbA;
    ctx.fillRect(160, 60, 440, 440);

    const orbB = ctx.createRadialGradient(820, 280, 10, 820, 280, 220);
    orbB.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    orbB.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = orbB;
    ctx.fillRect(600, 60, 440, 440);

    // 3. Top Tag Pill: "✨ MUTUAL CONNECTION ✨"
    const tagText = '✨ MUTUAL CONNECTION ✨';
    ctx.save();
    ctx.font = 'bold 15px sans-serif';
    const tagWidth = 260;
    const tagHeight = 36;
    const tagX = (width - tagWidth) / 2;
    const tagY = 55;
    roundRect(ctx, tagX, tagY, tagWidth, tagHeight, 18);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.stroke();

    ctx.fillStyle = '#fda4af';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, width / 2, tagY + tagHeight / 2);
    ctx.restore();

    // 4. Headline: "Rahul & Priya are Connected!"
    ctx.save();
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;
    const headlineText = `${truncate(rawNameA, 14)} & ${truncate(rawNameB, 14)} are Connected!`;
    ctx.fillText(headlineText, width / 2, 130);
    ctx.restore();

    // 5. Connecting Line between Avatar Centers (380, 280) -> (820, 280)
    ctx.save();
    const lineGrad = ctx.createLinearGradient(380, 280, 820, 280);
    lineGrad.addColorStop(0, '#f43f5e');
    lineGrad.addColorStop(0.5, '#ec4899');
    lineGrad.addColorStop(1, '#a855f7');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(380, 280);
    ctx.lineTo(820, 280);
    ctx.stroke();
    ctx.restore();

    // 6. Draw Avatars (Parallel fetch with fallbacks)
    const [imgA, imgB] = await Promise.all([
        loadSafeImage(photoAUrl),
        loadSafeImage(photoBUrl)
    ]);

    const avatarRadius = 85;
    const leftX = 380;
    const rightX = 820;
    const centerY = 280;

    // Helper to draw an avatar with border
    const drawAvatar = (
        img: any | null, 
        cx: number, 
        cy: number, 
        name: string, 
        accentColor: string, 
        secondaryColor: string
    ) => {
        ctx.save();
        // Circular clip
        ctx.beginPath();
        ctx.arc(cx, cy, avatarRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (img) {
            // Center crop fill
            const scale = Math.max((avatarRadius * 2) / img.width, (avatarRadius * 2) / img.height);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            const drawX = cx - drawW / 2;
            const drawY = cy - drawH / 2;
            ctx.drawImage(img, drawX, drawY, drawW, drawH);
        } else {
            // Gradient initial avatar
            const letterGrad = ctx.createLinearGradient(cx - avatarRadius, cy - avatarRadius, cx + avatarRadius, cy + avatarRadius);
            letterGrad.addColorStop(0, accentColor);
            letterGrad.addColorStop(1, secondaryColor);
            ctx.fillStyle = letterGrad;
            ctx.fillRect(cx - avatarRadius, cy - avatarRadius, avatarRadius * 2, avatarRadius * 2);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 72px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
            ctx.fillText(initial, cx, cy);
        }
        ctx.restore();

        // Glowing border ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, avatarRadius, 0, Math.PI * 2);
        ctx.lineWidth = 6;
        ctx.strokeStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.restore();
    };

    // Draw Left Avatar (User A)
    drawAvatar(imgA, leftX, centerY, rawNameA, '#f43f5e', '#be123c');

    // Draw Right Avatar (User B)
    drawAvatar(imgB, rightX, centerY, rawNameB, '#a855f7', '#7e22ce');

    // 7. Center Heart Floating Badge
    const badgeX = width / 2;
    const badgeY = centerY;
    const badgeR = 48;

    ctx.save();
    // Center badge shadow & glow
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    const badgeGrad = ctx.createLinearGradient(badgeX - badgeR, badgeY - badgeR, badgeX + badgeR, badgeY + badgeR);
    badgeGrad.addColorStop(0, '#e11d48');
    badgeGrad.addColorStop(1, '#9333ea');
    ctx.fillStyle = badgeGrad;
    ctx.shadowColor = 'rgba(244, 63, 94, 0.8)';
    ctx.shadowBlur = 24;
    ctx.fill();

    // Center badge white outline
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Heart icon / text in badge
    ctx.fillStyle = '#ffffff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💖', badgeX, badgeY - 6);

    // "CONNECTED" label below heart
    ctx.font = 'bold 10px sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('CONNECTED', badgeX, badgeY + 22);
    ctx.restore();

    // 8. Name Labels under Avatars
    ctx.save();
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(truncate(rawNameA, 16), leftX, centerY + avatarRadius + 18);
    ctx.fillText(truncate(rawNameB, 16), rightX, centerY + avatarRadius + 18);
    ctx.restore();

    // 9. Subtitle CTA
    ctx.save();
    ctx.font = '500 20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('You can now chat, voice call & video call freely! Tap to say hello 👋', width / 2, 475);
    ctx.restore();

    // 10. Footer Branding
    ctx.save();
    ctx.textBaseline = 'middle';

    // Left brand
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'left';
    ctx.fillText('LIFEPARTNER AI', 80, 555);

    // Right verification badge
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'right';
    ctx.fillText('🔒 100% Free & Verified Match', width - 80, 555);
    ctx.restore();

    const buffer = canvas.toBuffer('image/png');

    // Cache buffer for 1 hour
    bannerCache.set(cacheKey, {
        buffer,
        expires: now + 60 * 60 * 1000
    });

    // Clean up cache if too large (> 100 items)
    if (bannerCache.size > 100) {
        for (const [k, v] of bannerCache.entries()) {
            if (v.expires <= now) bannerCache.delete(k);
        }
    }

    return buffer;
}

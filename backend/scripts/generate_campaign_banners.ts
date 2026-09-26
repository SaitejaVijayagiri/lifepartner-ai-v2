import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(__dirname, '../../apps/web/public/images/campaigns');

function drawRoundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function createBanner(config: {
    filename: string;
    badgeText: string;
    badgeBg: string;
    badgeColor: string;
    title: string;
    subtitle: string;
    gradientStart: string;
    gradientMid: string;
    gradientEnd: string;
    iconEmoji: string;
    accentGlow: string;
}) {
    const width = 1024;
    const height = 576;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, config.gradientStart);
    bgGradient.addColorStop(0.5, config.gradientMid);
    bgGradient.addColorStop(1, config.gradientEnd);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Radial Glow Circles
    const radialGlow = ctx.createRadialGradient(width * 0.8, height * 0.3, 20, width * 0.8, height * 0.3, 350);
    radialGlow.addColorStop(0, config.accentGlow);
    radialGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    const bottomGlow = ctx.createRadialGradient(width * 0.2, height * 0.8, 10, width * 0.2, height * 0.8, 300);
    bottomGlow.addColorStop(0, 'rgba(255,255,255,0.08)');
    bottomGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Central Glass Card
    const cardX = 48;
    const cardY = 48;
    const cardW = width - 96;
    const cardH = height - 96;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;

    ctx.fillStyle = 'rgba(15, 15, 23, 0.65)';
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 4. Pill Badge (Top Left)
    const badgeX = cardX + 48;
    const badgeY = cardY + 48;
    const badgeW = 320;
    const badgeH = 44;

    ctx.fillStyle = config.badgeBg;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 22);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = config.badgeColor;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);

    // 5. Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.title, cardX + 48, badgeY + badgeH + 32);

    // 6. Subtitle
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '22px sans-serif';
    ctx.fillText(config.subtitle, cardX + 48, badgeY + badgeH + 96);

    // 7. Interactive CTA Button Preview (Bottom Left)
    const btnX = cardX + 48;
    const btnY = cardH - 24;
    const btnW = 260;
    const btnH = 52;

    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    btnGrad.addColorStop(0, '#e11d48');
    btnGrad.addColorStop(1, '#9333ea');
    ctx.fillStyle = btnGrad;
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 26);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Tap to View Now →', btnX + btnW / 2, btnY + btnH / 2);

    // 8. Large Icon / Illustration (Right Side)
    const iconCenterX = cardX + cardW - 140;
    const iconCenterY = cardY + cardH / 2;

    // Glowing circle around icon
    ctx.save();
    ctx.shadowColor = config.accentGlow;
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(iconCenterX, iconCenterY, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.font = '80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.iconEmoji, iconCenterX, iconCenterY);

    // Save PNG file
    const buffer = canvas.toBuffer('image/png');
    const destPath = path.join(OUTPUT_DIR, config.filename);
    fs.writeFileSync(destPath, buffer);
    console.log(`✅ Generated banner: ${config.filename} (${buffer.length} bytes)`);
}

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // 1. Connection Request Spark Banner
    createBanner({
        filename: 'match_spark.png',
        badgeText: '💌 NEW CONNECTION REQUEST',
        badgeBg: 'rgba(225, 29, 72, 0.35)',
        badgeColor: '#fecdd3',
        title: 'Someone Wants to Connect With You',
        subtitle: 'A verified suitor sent you an interest. Tap to reply!',
        gradientStart: '#881337',
        gradientMid: '#4c0519',
        gradientEnd: '#1e1b4b',
        iconEmoji: '💖',
        accentGlow: 'rgba(244, 63, 94, 0.6)'
    });

    // 2. Secret Admirer / Profile View Banner
    createBanner({
        filename: 'profile_viewer.png',
        badgeText: '👀 SECRET ADMIRER DETECTED',
        badgeBg: 'rgba(147, 51, 234, 0.35)',
        badgeColor: '#e9d5ff',
        title: 'Someone Viewed Your Profile',
        subtitle: 'A verified suitor spent time looking at your bio & photos.',
        gradientStart: '#3b0764',
        gradientMid: '#18181b',
        gradientEnd: '#09090b',
        iconEmoji: '✨',
        accentGlow: 'rgba(168, 85, 247, 0.6)'
    });

    // 3. 96% AI Compatibility Spotlight Banner
    createBanner({
        filename: 'ai_spotlight.png',
        badgeText: '🎯 96% COMPATIBILITY MATCH',
        badgeBg: 'rgba(16, 185, 129, 0.35)',
        badgeColor: '#a7f3d0',
        title: 'Your AI Compatibility Drop',
        subtitle: 'Exceptional alignment detected in values & lifestyle.',
        gradientStart: '#064e3b',
        gradientMid: '#0f172a',
        gradientEnd: '#0284c7',
        iconEmoji: '💫',
        accentGlow: 'rgba(52, 211, 153, 0.6)'
    });

    // 4. Voice Intro Audio Mystery Banner
    createBanner({
        filename: 'voice_intro.png',
        badgeText: '🎙️ NEW VOICE BIO RECORDED',
        badgeBg: 'rgba(59, 130, 246, 0.35)',
        badgeColor: '#bfdbfe',
        title: 'Hear Their Voice Intro',
        subtitle: 'Listen to their authentic voice & see compatibility.',
        gradientStart: '#1e3a8a',
        gradientMid: '#1e1b4b',
        gradientEnd: '#0f172a',
        iconEmoji: '🎧',
        accentGlow: 'rgba(96, 165, 250, 0.6)'
    });
}

main().catch(console.error);

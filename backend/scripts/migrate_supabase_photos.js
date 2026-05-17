const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const FROM = process.env.EMAIL_FROM || 'LifePartner AI <hello@lifepartnerai.in>';

function buildMigrationEmail(firstName) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; color: white;">Server Upgrade Notice 🚀</h1>
        </div>
        <div style="padding: 32px;">
            <p style="font-size: 16px; color: #1e293b;">Hi <strong>${firstName}</strong>,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                We recently upgraded our servers to make LifePartner AI faster and more secure. During this transition, we were unable to transfer a small batch of older profile photos—including yours.
            </p>
            <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                To ensure your profile remains visible and continues getting matches, please take a moment to upload a new, clear photo of yourself.
            </p>
            <div style="background: #f8fafc; border-left: 4px solid #9333EA; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-size: 14px; color: #334155;">
                    💡 <strong>Quick Tip:</strong> Profiles with a high-quality, verified photo receive up to <strong>8x more connection requests!</strong>
                </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://lifepartnerai.in'}/dashboard"
                   style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #E11D48, #9333EA); color: white; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: bold;">
                    Update My Photo
                </a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px;">
                LifePartner AI · Hyderabad, India<br/>
                If you have any questions, simply reply to this email!
            </p>
        </div>
    </div>`;
}

async function uploadBase64ToCloudinary(base64, userId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `lifepartner/profiles/${userId}`,
                transformation: [{ width: 800, height: 800, crop: 'limit' }],
                format: 'jpg',
                quality: 'auto:good'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        uploadStream.end(Buffer.from(base64.split(',')[1] || base64, 'base64'));
    });
}

async function main() {
    console.log('Scanning for legacy Supabase/Base64 photos...');

    const users = await prisma.users.findMany({
        where: {
            OR: [
                { avatar_url: { contains: 'supabase' } },
                { avatar_url: { startsWith: 'data:' } }
            ]
        },
        select: { id: true, email: true, full_name: true, avatar_url: true }
    });

    console.log(`Found ${users.length} users to process.`);

    for (const user of users) {
        const firstName = user.full_name ? user.full_name.split(' ')[0] : 'there';
        const isBase64 = user.avatar_url && user.avatar_url.startsWith('data:');

        // Fetch profile to update metadata
        const profile = await prisma.profiles.findUnique({ where: { user_id: user.id } });
        let metadata = profile && profile.metadata ? profile.metadata : {};
        if (typeof metadata === 'string') {
            try { metadata = JSON.parse(metadata); } catch(e) { metadata = {}; }
        }

        if (isBase64) {
            console.log(`🔄 Migrating Base64 photo for ${user.email}...`);
            try {
                const cloudinaryUrl = await uploadBase64ToCloudinary(user.avatar_url, user.id);
                metadata.photos = [cloudinaryUrl];
                
                await prisma.users.update({
                    where: { id: user.id },
                    data: { avatar_url: cloudinaryUrl }
                });

                await prisma.profiles.update({
                    where: { user_id: user.id },
                    data: { photos: [cloudinaryUrl], metadata }
                });
                console.log(`   ✅ Successfully migrated to Cloudinary!`);
            } catch (e) {
                console.error(`   ❌ Failed to upload to Cloudinary:`, e.message);
            }
        } else {
            console.log(`🗑️ Clearing dead Supabase photo for ${user.email}...`);
            
            // Clear photos
            metadata.photos = [];
            await prisma.users.update({
                where: { id: user.id },
                data: { avatar_url: null }
            });
            await prisma.profiles.update({
                where: { user_id: user.id },
                data: { photos: [], metadata }
            });

            // Send friendly notification
            try {
                await resend.emails.send({
                    from: FROM,
                    to: user.email,
                    subject: `Action Required: Please update your profile photo 📸`,
                    html: buildMigrationEmail(firstName)
                });
                console.log(`   📧 Sent server upgrade notification.`);
            } catch (e) {
                console.error(`   ❌ Email failed:`, e.message);
            }
        }

        // Sleep to respect rate limits
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log('Migration complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

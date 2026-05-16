import * as dotenv from 'dotenv';
dotenv.config();

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
    console.log('Sending real email to test...');
    
    const senderName = "Priya Sharma";
    const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random&color=fff&size=256`;
    const detailsString = "26 yrs • Software Engineer • Hyderabad, Telangana";

    const result = await resend.emails.send({
        from: 'LifePartner AI <no-reply@lifepartnerai.in>',
        to: 'saitejavijayagiri123@gmail.com',
        subject: `✨ ${senderName} is interested in you!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f0f; color: #f5f5f5; border-radius: 16px; overflow: hidden; border: 1px solid #333;">
                <div style="background: linear-gradient(135deg, #E11D48, #9333EA); padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; color: white;">You have a new admirer! 💖</h1>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <img src="${photoUrl}" alt="${senderName}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #4F46E5; margin-bottom: 20px;" />
                    <h2 style="margin: 0 0 10px 0; color: #fff; font-size: 22px;">${senderName}</h2>
                    <p style="margin: 0 0 20px 0; color: #aaa; font-size: 16px;">${detailsString}</p>
                    
                    <p style="font-size: 15px; color: #ccc; line-height: 1.6; margin-bottom: 30px;">
                        <strong>${senderName}</strong> saw your profile and sent you an interest request. Don't keep them waiting!
                    </p>
                    
                    <a href="https://lifepartnerai.in/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4F46E5, #3B82F6); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold;">View Profile & Respond</a>
                </div>
                <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-top: 1px solid #333;">
                    <p style="color: #666; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LifePartner AI. All rights reserved.</p>
                </div>
            </div>
        `
    });
    console.log(result);
}
main();

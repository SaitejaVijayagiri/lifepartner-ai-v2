import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// import { pool } from '../db';
import { prisma } from '../prisma';
import { Resend } from 'resend';
import validateEmail from 'deep-email-validator';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY || 're_123_mock');

// JWT_SECRET is guaranteed to be set — server.ts throws at startup if missing
const JWT_SECRET = process.env.JWT_SECRET!;

// Helper: Generate Token
const generateToken = (userId: string) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Helper: Set HttpOnly Cookie
const setTokenCookie = (res: express.Response, token: string) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.json({ success: true, message: "Logged out" });
});

// 1. Register with OTP
router.post('/register', async (req, res) => {
    try {
        const { email, phone, password, full_name, age, gender, location_name } = req.body;

        // 1. Validation
        if ((!email && !phone) || !password) {
            return res.status(400).json({ error: "Email/Phone and Password required" });
        }

        // 1.5 Deep Email Validation (SMTP/MX check)
        if (email) {
            try {
                const emailValidation = await validateEmail({
                    email: email,
                    validateRegex: true,
                    validateMx: true,
                    validateTypo: true,
                    validateDisposable: true,
                    validateSMTP: false, // Turned off to prevent false positives for real users
                });

                if (!emailValidation.valid) {
                    // Check if it failed SMTP (mailbox doesn't exist) or something else
                    const isTypoOrDisposable = emailValidation.validators.typo?.valid === false || emailValidation.validators.disposable?.valid === false;
                    const reason = emailValidation.reason;
                    
                    console.log(`❌ Email Validation Failed: ${email} -> ${reason}`);
                    
                    if (isTypoOrDisposable) {
                        return res.status(400).json({ error: "Please use a valid, non-disposable email address." });
                    } else {
                        return res.status(400).json({ error: "This email address does not appear to exist. Please check for typos." });
                    }
                }
            } catch (validationErr) {
                console.error("Deep Email Validation Error:", validationErr);
                // Continue if the validation service itself errors out, to not block signups
            }
        }

        const identifier = email || phone;
        const targetEmail = email; // For now only email OTP

        // 2. Check existence
        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [
                    { email: email || undefined },
                    { phone: phone || undefined }
                ]
            }
        });

        if (existingUser) {
            // Self-Healing Logic: If user is UNVERIFIED, allow overwrite and resend OTP
            if (!existingUser.is_verified) {
                console.log(`♻️ Self-Healing Registration for unverified user: ${email || phone}`);

                // 3. Hash New Password (Optimized: reuse existing hash if password passes compare)
                const isSamePassword = await bcrypt.compare(password, existingUser.password_hash);
                const passwordHash = isSamePassword ? existingUser.password_hash : await bcrypt.hash(password, 10);

                // 4. Generate New OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

                // Update User Record
                await prisma.users.update({
                    where: { id: existingUser.id },
                    data: {
                        email: email, // Update email in case of typo fix
                        phone: phone, // Update phone
                        password_hash: passwordHash,
                        full_name: full_name,
                        otp_code: otp,
                        otp_expires_at: otpExpiresAt,
                        // Don't reset created_at, keep original timestamp or not?
                        // Let's keep ID same. 
                    }
                });

                // Send OTP Email
                if (email) {
                    try {
                        const apiKey = process.env.RESEND_API_KEY;
                        if (apiKey && !apiKey.toLowerCase().includes('mock')) {
                            const { data, error } = await resend.emails.send({
                                from: process.env.EMAIL_FROM || 'LifePartner AI <no-reply@lifepartnerai.in>',
                                to: email,
                                subject: 'Your Verification Code (Resend)',
                                html: `
                                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                                    <div style="background: linear-gradient(135deg, #E11D48 0%, #4F46E5 100%); padding: 30px; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">LifePartner AI</h1>
                                        <p style="color: rgba(255,255,255,0.9); margin-top: 5px; font-size: 14px;">Where Tradition Meets Technology</p>
                                    </div>
                                    <div style="padding: 40px 30px; text-align: center;">
                                        <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 20px;">Verify Your Email Address</h2>
                                        <p style="color: #64748b; margin-bottom: 30px; line-height: 1.6;">
                                            Please enter the following verification code to complete your registration. This code is valid for 10 minutes.
                                        </p>
                                        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; margin-bottom: 30px; display: inline-block;">
                                            ${otp}
                                        </div>
                                        <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
                                            If you didn't request this code, you can safely ignore this email.
                                        </p>
                                    </div>
                                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LifePartner AI. All rights reserved.</p>
                                    </div>
                                </div>
                                `
                            });

                            if (error) {
                                console.error("❌ Self-Heal Email Rejected by Resend:", error);
                                return res.status(400).json({ error: "Invalid email address. Unable to send verification code." });
                            }
                            console.log(`✅ Self-Heal OTP sent to ${email}`);
                        }
                    } catch (e) {
                        console.error("Self-Heal Email Error", e);
                        return res.status(500).json({ error: "Failed to send verification email." });
                    }
                }

                // Return Success
                return res.json({
                    success: true,
                    requiresVerification: true,
                    email: email,
                    message: "Verification code resent (Profile updated)"
                });
            }

            return res.status(400).json({ error: "User already exists" });
        }

        // 3. Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Generate OTP
        // SECURITY: Removed demo-email OTP backdoor ('123456' for emails containing 'demo').
        // All users now receive a real random OTP regardless of email address.
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // 5. Transaction: Insert User + Handle Referral
        const newUser = await prisma.$transaction(async (tx: any) => {
            // Referral Logic
            let referredByUserId = null;
            if (req.body.referralCode) {
                const referrer = await tx.users.findUnique({
                    where: { referral_code: req.body.referralCode }
                });
                if (referrer) {
                    referredByUserId = referrer.id;
                    console.log(`🤝 Referred by: ${referredByUserId}`);
                }
            }

            // Generate Self Referral Code
            const safeName = full_name || "User";
            const baseName = safeName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const myReferralCode = `${baseName}${randomSuffix}`;

            const user = await tx.users.create({
                data: {
                    email,
                    phone,
                    password_hash: passwordHash,
                    full_name,
                    age,
                    gender,
                    location_name,
                    otp_code: otp,
                    otp_expires_at: otpExpiresAt,
                    is_verified: false,
                    referral_code: myReferralCode,
                    referred_by: referredByUserId
                },
                select: { id: true, full_name: true }
            });

            // Referral Tracking (Coins are now deferred to Onboarding completion in profile.ts)
            if (referredByUserId) {
                console.log(`🤝 Referral logged for User ${user.id} -> Referrer ${referredByUserId} (Pending Onboarding)`);
            }

            return user;
        });

        // 6. Send OTP
        if (targetEmail) {
            try {
                const apiKey = process.env.RESEND_API_KEY;
                console.log(`📧 Sending OTP with Key: ${apiKey?.substring(0, 5)}... From: ${process.env.EMAIL_FROM}`);
                if (apiKey && !apiKey.toLowerCase().includes('mock')) {
                    // Synchronous send to catch invalid emails immediately
                    const { data, error } = await resend.emails.send({
                        from: process.env.EMAIL_FROM || 'LifePartner AI <no-reply@lifepartnerai.in>',
                        to: targetEmail,
                        subject: 'Your Verification Code',
                        text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nSent from LifePartner AI.`,
                        html: `
                        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #E11D48 0%, #4F46E5 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">LifePartner AI</h1>
                                <p style="color: rgba(255,255,255,0.9); margin-top: 5px; font-size: 14px;">Where Tradition Meets Technology</p>
                            </div>
                            <div style="padding: 40px 30px; text-align: center;">
                                <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 20px;">Verify Your Email Address</h2>
                                <p style="color: #64748b; margin-bottom: 30px; line-height: 1.6;">
                                    Please enter the following verification code to complete your registration. This code is valid for 10 minutes.
                                </p>
                                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 5px; margin-bottom: 30px; display: inline-block;">
                                    ${otp}
                                </div>
                                <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
                                    If you didn't request this code, you can safely ignore this email.
                                </p>
                            </div>
                            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LifePartner AI. All rights reserved.</p>
                            </div>
                        </div>
                        `
                    });

                    if (error) {
                        console.error("❌ Register Email Rejected by Resend:", error);
                        // Rollback User Creation!
                        await prisma.users.delete({ where: { id: newUser.id } });
                        return res.status(400).json({ error: "Invalid email address. We could not deliver a verification code to this address." });
                    }
                    console.log(`✅ Register OTP sent: ${data?.id}`);

                } else {
                    console.warn(`⚠️ Email skipped: RESEND_API_KEY is missing or mock. OTP: ${otp}`);
                }
            } catch (emailError) {
                console.error("Email sending setup exception:", emailError);
                // Rollback User Creation on critical failure
                await prisma.users.delete({ where: { id: newUser.id } });
                return res.status(500).json({ error: "Failed to send verification email. Please try again later." });
            }
        }

        res.json({
            success: true,
            requiresVerification: true,
            email: targetEmail,
            message: "OTP sent to email"
        });

    } catch (error: any) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});


import { EmailService } from '../services/email';

// 2. Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user
        const user = await prisma.users.findUnique({
            where: { email },
            select: { id: true, otp_code: true, otp_expires_at: true, is_verified: true, full_name: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        // Check if already verified
        if (user.is_verified) {
            const token = generateToken(user.id);
            setTokenCookie(res, token);
            return res.json({ success: true, token, userId: user.id, user: { id: user.id, name: user.full_name } });
        }

        // Validate OTP
        if (user.otp_code !== otp) return res.status(400).json({ error: "Invalid OTP" });
        if (user.otp_expires_at && new Date().getTime() > new Date(user.otp_expires_at).getTime()) {
            return res.status(400).json({ error: "OTP Expired" });
        }

        // Update User
        await prisma.users.update({
            where: { id: user.id },
            data: { is_verified: true, otp_code: null, otp_expires_at: null }
        });

        // Send Welcome Email
        EmailService.sendWelcomeEmail(email, user.full_name || 'User').catch(console.error);

        // Return Token
        const token = generateToken(user.id);
        setTokenCookie(res, token);
        res.json({ success: true, token, userId: user.id, user: { id: user.id, name: user.full_name } });

    } catch (e) {
        console.error("Verify Error", e);
        res.status(500).json({ error: "Verification validation failed" });
    }
});

// 3. Login (Updated to check verification)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Enhanced validation
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Log login attempt (without password)
        console.log(`🔐 Login attempt for: ${email}`);

        const user = await prisma.users.findFirst({
            where: {
                OR: [
                    { email: email },
                    { phone: email }
                ]
            }
        });

        if (!user) {
            console.log(`❌ Login failed: User not found - ${email}`);
            return res.status(404).json({ error: "User not found" });
        }

        console.log(`👤 User found: ${user.full_name} (Admin: ${user.is_admin})`);

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.log(`❌ Login failed: Invalid password for ${email}`);
            return res.status(400).json({ error: "Invalid email or password" });
        }

        // Enforce Email Verification
        if (!user.is_verified) {
            console.log(`❌ Login prevented: Unverified email for ${email}`);
            return res.status(403).json({
                error: "Please verify your email address first.",
                requiresVerification: true,
                email: email
            });
        }

        console.log(`✅ Login successful: ${email} (Admin: ${user.is_admin})`);
        const token = generateToken(user.id);
        setTokenCookie(res, token);

        // Track last_seen_at in profile metadata for re-engagement campaign accuracy
        prisma.profiles.findUnique({ where: { user_id: user.id }, select: { metadata: true } })
            .then(profile => {
                if (profile) {
                    const meta = (profile.metadata as any) || {};
                    return prisma.profiles.update({
                        where: { user_id: user.id },
                        data: { metadata: { ...meta, last_seen_at: new Date().toISOString() } }
                    });
                }
            })
            .catch(e => console.error('last_seen_at update failed (non-blocking):', e));
        
        const requiresOnboarding = !user.gender || !user.age;
        
        res.json({ 
            token, 
            userId: user.id, 
            user: { id: user.id, name: user.full_name, is_admin: user.is_admin },
            requiresOnboarding 
        });

    } catch (error: any) {
        console.error("Login Error:", error);
        // SECURITY: Never expose stack traces to clients — they reveal internal paths and logic
        res.status(500).json({ error: "Login failed. Please try again." });
    }
});

// 4. Resend OTP Route
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        // 1. Check User
        const user = await prisma.users.findUnique({
            where: { email },
            select: { id: true, full_name: true, is_verified: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });
        if (user.is_verified) return res.json({ message: "User already verified" });

        // 2. Generate New OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // 3. Update DB
        await prisma.users.update({
            where: { id: user.id },
            data: { otp_code: otp, otp_expires_at: otpExpiresAt }
        });

        // 4. Send Email
        console.log(`🔐 RESENT OTP for ${email}: ${otp}`);

        if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('mock')) {
            await resend.emails.send({
                from: process.env.EMAIL_FROM || 'LifePartner AI <auth@lifepartnerai.in>',
                to: email,
                subject: 'Verify your LifePartner AI Account (Resend)',
                html: `
                    <h1>Verification Code</h1>
                    <p>Hello ${user.full_name},</p>
                    <p>Here is your new verification code:</p>
                    <h2>${otp}</h2>
                    <p>Expires in 10 minutes.</p>
                `
            });
        }

        res.json({ success: true, message: "OTP resent successfully" });

    } catch (e) {
        console.error("Resend OTP Error", e);
        res.status(500).json({ error: "Failed to resend OTP" });
    }
});

// 5. Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        // 1. Check User exists
        const user = await prisma.users.findUnique({
            where: { email },
            select: { id: true, full_name: true }
        });

        if (!user) {
            // Security: Don't reveal user existence, but log internally
            console.warn(`⚠️ Forgot Password: User not found for email '${email}'`);
            return res.json({ success: true, message: "If account exists, OTP sent." });
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // 3. Save OTP (Re-using otp_code fields)
        await prisma.users.update({
            where: { id: user.id },
            data: { otp_code: otp, otp_expires_at: otpExpiresAt }
        });

        // 4. Send Email
        console.log(`🔐 RESET OTP for ${email}: ${otp}`); // Dev log

        try {
            const apiKey = process.env.RESEND_API_KEY;

            if (apiKey && !apiKey.toLowerCase().includes('mock')) {
                // Non-blocking: Send in background
                resend.emails.send({
                    from: process.env.EMAIL_FROM || 'LifePartner AI Safety <security@lifepartnerai.in>',
                    to: email,
                    subject: 'Reset your LifePartner AI Password',
                    text: `Hello,\n\nWe received a request to reset your password. Use the code below to proceed.\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.`,
                    html: `
                        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #E11D48 0%, #4F46E5 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">LifePartner AI</h1>
                                <p style="color: rgba(255,255,255,0.9); margin-top: 5px; font-size: 14px;">Security Alert</p>
                            </div>
                            <div style="padding: 40px 30px; text-align: center;">
                                <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 20px;">Reset Your Password</h2>
                                <p style="color: #64748b; margin-bottom: 30px; line-height: 1.6;">
                                    We received a request to reset your password. Use the code below to proceed.
                                </p>
                                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #E11D48; letter-spacing: 5px; margin-bottom: 30px; display: inline-block;">
                                    ${otp}
                                </div>
                                <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
                                    If you didn't request a password reset, please ignore this email or contact support if you're concerned.
                                </p>
                            </div>
                            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} LifePartner AI. All rights reserved.</p>
                            </div>
                        </div>
                    `
                }).then(({ data, error }) => {
                    if (error) console.error("❌ Forgot PW Email Error (Background):", error);
                    else console.log(`✅ Reset OTP sent (Background): ${data?.id}`);
                }).catch(err => console.error("❌ Email Exception:", err));

            } else {
                console.warn(`⚠️ Reset Email skipped: missing/mock key.`);
            }
        } catch (emailErr) {
            console.error("Email Setup Exception:", emailErr);
        }

        res.json({ success: true, message: "OTP sent" });

    } catch (e: any) {
        console.error("Forgot PW Error", e);
        res.status(500).json({ error: `Request failed: ${e.message || e}` });
    }
});

// 6. Reset Password - Verify OTP & Change PW
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ error: "Missing fields" });

        // 1. Validate User & OTP
        const user = await prisma.users.findUnique({
            where: { email },
            select: { id: true, otp_code: true, otp_expires_at: true }
        });

        if (!user) return res.status(400).json({ error: "Invalid request" });

        if (user.otp_code !== otp) return res.status(400).json({ error: "Invalid OTP" });
        // @ts-ignore
        if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) return res.status(400).json({ error: "OTP Expired" });

        // 2. Hash New Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // 3. Update DB
        // Security Fix: Entering a valid reset password OTP implicitly verifies their email ownership
        await prisma.users.update({
            where: { id: user.id },
            data: {
                password_hash: passwordHash,
                otp_code: null,
                otp_expires_at: null,
                is_verified: true
            }
        });

        res.json({ success: true, message: "Password updated successfully" });

    } catch (e) {
        console.error("Reset PW Error", e);
        res.status(500).json({ error: "Reset failed" });
    }
});

router.post('/send-otp', async (req, res) => {
    // Keeping old route for compatibility if needed, but it's mostly replaced by register flow
    res.json({ success: true, message: "Use /register for new accounts" });
});

// 7. Google Auth Code Exchange
router.post('/google', async (req, res) => {
    try {
        const { code } = req.body;

        // 1. Exchange Code for Tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: req.body.redirect_uri || process.env.GOOGLE_REDIRECT_URI || 'https://lifepartnerai.in/auth/callback/google',
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenRes.json();
        if (tokens.error) throw new Error(tokens.error_description || tokens.error);

        // 2. Get User Profile
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const profile = await profileRes.json();

        // 3. Upsert User
        const email = profile.email;
        const googleId = profile.id;
        const name = profile.name;
        const picture = profile.picture;

        // Check if user exists by google_id OR email
        let user = await prisma.users.findFirst({
            where: {
                OR: [
                    { google_id: googleId },
                    { email: email }
                ]
            }
        });

        if (user) {
            // Update existing
            user = await prisma.users.update({
                where: { id: user.id },
                data: { google_id: googleId, is_verified: true }
            });
        } else {
            // Create new
            user = await prisma.$transaction(async (tx: any) => {
                const newUser = await tx.users.create({
                    data: {
                        full_name: name,
                        email,
                        google_id: googleId,
                        is_verified: true,
                        password_hash: 'google_auth_placeholder',
                        avatar_url: picture
                    }
                });
                // Init Profile
                await tx.profiles.create({
                    data: { user_id: newUser.id, raw_prompt: '', metadata: {} }
                });
                return newUser;
            });
        }

        // 4. Generate Token
        const token = generateToken(user!.id);

        // Check if onboarding is needed (missing gender or age)
        const requiresOnboarding = !(user as any).gender || !(user as any).age;

        setTokenCookie(res, token);
        res.json({ success: true, token, userId: user!.id, requiresOnboarding });

    } catch (e: any) {
        console.error("Google Auth Error", e);
        res.status(500).json({ error: e.message || "Google Login Failed" });
    }
});

export default router;

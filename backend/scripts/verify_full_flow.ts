
import axios from 'axios';
import { prisma } from '../src/prisma';
require('dotenv').config();

const API_URL = 'http://localhost:4000';

async function runFlow() {
    console.log("🚀 Starting Full Auth Flow Verification...\n");

    const suffix = Math.floor(Math.random() * 10000);
    const email = `flow_professional_${suffix}@test.com`;
    const password = "password123";
    const newPassword = "newpassword456";
    let token = '';
    let userId = '';

    // 1. Register
    console.log(`1. Registering user: ${email}`);
    try {
        await axios.post(`${API_URL}/auth/register`, {
            email,
            password,
            full_name: "Flow Pro",
            phone: `99990${suffix}`
        });
        console.log("   ✅ Registration API called.");
    } catch (e: any) {
        console.error("   ❌ Registration Failed:");
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Data:", JSON.stringify(e.response.data, null, 2));
        } else {
            console.error("Message:", e.message);
        }
        process.exit(1);
    }

    // 2. Get OTP from DB
    console.log(`2. Fetching OTP from DB...`);
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.otp_code) {
        console.error("   ❌ User or OTP not found in DB.");
        process.exit(1);
    }
    const otp = user.otp_code;
    userId = user.id;
    console.log(`   ✅ OTP Found: ${otp}`);

    // 3. Verify OTP
    console.log(`3. Verifying OTP...`);
    try {
        const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
        token = res.data.token;
        console.log("   ✅ OTP Verified. Token received.");
    } catch (e: any) {
        console.error("   ❌ Verification Failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 4. Onboarding (Update Profile)
    console.log(`4. Running Onboarding (PUT /profile/me)...`);
    try {
        await axios.put(`${API_URL}/profile/me`, {
            name: "Flow Professional",
            age: 28,
            gender: "Male",
            location: { city: "Hyderabad" },
            religion: { religion: "Hindu" },
            aboutMe: "I am a professional test user.",
            career: { profession: "Engineer" }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("   ✅ Profile Updated (Onboarding Complete).");
    } catch (e: any) {
        console.error("   ❌ Onboarding Failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 5. Forgot Password
    console.log(`5. Testing Forgot Password...`);
    try {
        await axios.post(`${API_URL}/auth/forgot-password`, { email });
        console.log("   ✅ Forgot Password Request sent.");
    } catch (e: any) {
        console.error("   ❌ Forgot Password Failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 6. Get Reset OTP
    console.log(`6. Fetching Reset OTP...`);
    const userForReset = await prisma.users.findUnique({ where: { email } });
    const resetOtp = userForReset?.otp_code;
    if (!resetOtp) {
        console.error("   ❌ Reset OTP not found.");
        process.exit(1);
    }
    console.log(`   ✅ Reset OTP: ${resetOtp}`);

    // 7. Reset Password
    console.log(`7. Resetting Password...`);
    try {
        await axios.post(`${API_URL}/auth/reset-password`, {
            email,
            otp: resetOtp,
            newPassword
        });
        console.log("   ✅ Password Reset Successful.");
    } catch (e: any) {
        console.error("   ❌ Reset Failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 8. Login with New Password
    console.log(`8. Logging in with NEW Password...`);
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email,
            password: newPassword
        });
        if (res.data.token) {
            console.log("   ✅ Login Successful with New Password.");
        } else {
            throw new Error("No token returned");
        }
    } catch (e: any) {
        console.error("   ❌ Login Failed:", e.response?.data || e.message);
        process.exit(1);
    }

    console.log("\n✨ SUCCESS: Entire Auth Flow is PERFECT. ✨");
}

runFlow()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

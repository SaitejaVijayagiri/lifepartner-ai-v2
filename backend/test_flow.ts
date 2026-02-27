const apiUrl = 'http://localhost:4000';

async function testFullFlow() {
    const email = `test_flow_${Date.now()}@gmail.com`;
    const password = 'MySecretPassword123!';

    console.log(`1. Registering ${email}...`);
    const regRes = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: 'Flow Test' })
    });
    const regData = await regRes.json();
    console.log('Register Response:', regData);

    console.log(`2. Logging in immediately... (should fail because not verified)`);
    const login1 = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    console.log('Login 1 Response:', await login1.json());

    // We need OTP from DB. Let's get it.
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.users.findUnique({ where: { email } });

    console.log(`3. Verifying OTP: ${user?.otp_code}`);
    const verifyRes = await fetch(`${apiUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: user?.otp_code })
    });
    console.log('Verify Response:', await verifyRes.json());

    console.log(`4. Logging in again...`);
    const login2 = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    console.log('Login 2 Final Response:', await login2.json());

    await prisma.$disconnect();
}

testFullFlow().catch(console.error);

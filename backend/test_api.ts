import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { app } from './src/server';
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function run() {
    try {
        const user = await prisma.users.findFirst({ where: { email: { not: '' } } });
        if (!user) throw new Error("No user found");
        console.log("Testing as user:", user.email);

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1d' });

        const payload = {
            name: "John Doe Test",
            age: 25,
            gender: "Male",
            height: "5'10",
            location: { city: "Mumbai" },
            religion: "Hindu",
            photos: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="],
            photoUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        };

        const res = await request(app).put('/profile/me').set('Authorization', `Bearer ${token}`).send(payload);
        console.log("STATUS:", res.status);
        console.log("SUCCESS:", res.body);

        const res2 = await request(app).get('/profile/me').set('Authorization', `Bearer ${token}`);
        console.log("GET /me RESPONSE:", res2.body);
    } catch (e) {
        console.error("Test execution failed:", e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}
run();

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from './prisma';

async function main() {
    console.log("Adding cleared_by column to messages table...");
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."messages" ADD COLUMN IF NOT EXISTS "cleared_by" JSONB DEFAULT '[]'::jsonb;`);
        console.log("✅ Column added successfully via raw SQL.");
    } catch (e) {
        console.error("Failed to add column:", e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

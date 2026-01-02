
import { prisma } from '../src/prisma';
require('dotenv').config();

async function checkNewUsers() {
    console.log("🔍 Fetching latest users...\n");

    const users = await prisma.users.findMany({
        take: 10,
        orderBy: {
            created_at: 'desc'
        },
        include: {
            profiles: true
        }
    });

    if (users.length === 0) {
        console.log("No users found.");
        return;
    }

    let output = "------------------------------------------------------------------------------------------------\n";
    output += "| Name                 | Email                          | Verified | Gender | Age | Created At          |\n";
    output += "|----------------------|--------------------------------|----------|--------|-----|---------------------|\n";

    users.forEach(u => {
        const created = u.created_at ? new Date(u.created_at).toLocaleString('en-IN') : 'N/A';
        output += `| ${u.full_name?.padEnd(20).slice(0, 20)} | ${u.email.padEnd(30).slice(0, 30)} | ${u.is_verified ? '✅' : '❌'}       | ${u.gender?.padEnd(6) || ' -  '} | ${u.age || '-'} | ${created} |\n`;
    });
    output += "------------------------------------------------------------------------------------------------\n";

    const fs = require('fs');
    const path = require('path');
    fs.writeFileSync(path.join(__dirname, '../recent_users.txt'), output);
    console.log("Written to recent_users.txt");
}

checkNewUsers()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());

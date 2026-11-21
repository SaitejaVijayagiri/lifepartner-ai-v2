#!/usr/bin/env node

/**
 * LifePartner AI - Google Play Closed Testing Email Collector
 * Run with: npm run list:testers or node scripts/list-testers.js
 */

const fs = require('fs');
const path = require('path');

function readJsonFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data || '[]');
        }
    } catch (_) {}
    return [];
}

function main() {
    console.log('\n=============================================================');
    console.log('  🎯 LifePartner AI — Google Play Closed Beta Tester List');
    console.log('=============================================================\n');

    const webPath = path.join(__dirname, '..', 'apps', 'web', 'data', 'beta_testers.json');
    const backendPath = path.join(__dirname, '..', 'backend', 'data', 'beta_testers.json');

    const webTesters = readJsonFile(webPath);
    const backendTesters = readJsonFile(backendPath);

    // Merge and deduplicate by lowercased email
    const map = new Map();

    [...webTesters, ...backendTesters].forEach(t => {
        if (t && t.email && t.email.includes('@')) {
            const email = t.email.trim().toLowerCase();
            if (!map.has(email)) {
                map.set(email, t);
            }
        }
    });

    const testers = Array.from(map.values());
    const total = testers.length;
    const added = testers.filter(t => t.status === 'added_to_console').length;
    const pending = total - added;

    console.log(`📊 Total Registered Testers:   ${total}`);
    console.log(`✅ Added to Play Console:      ${added}`);
    console.log(`⏳ Pending Console Addition:   ${pending}`);
    console.log(`🎯 Google Play Requirement:    20 Testers (${Math.min(100, Math.round((total / 20) * 100))}% reached)`);
    console.log('-------------------------------------------------------------');

    if (total === 0) {
        console.log('\nℹ️  No tester emails found yet.');
        console.log('Testers who register on the landing page or /download page will be listed here.\n');
    } else {
        console.log('\n📋 ALL EMAILS (Comma-separated for Google Play Console):');
        console.log('-------------------------------------------------------------');
        const commaSeparated = testers.map(t => t.email).join(', ');
        console.log(commaSeparated);
        console.log('-------------------------------------------------------------');

        if (pending > 0) {
            console.log('\n⏳ PENDING EMAILS ONLY (Not yet marked as added in Console):');
            console.log('-------------------------------------------------------------');
            const pendingSeparated = testers.filter(t => t.status !== 'added_to_console').map(t => t.email).join(', ');
            console.log(pendingSeparated);
            console.log('-------------------------------------------------------------');
        }

        console.log('\n📝 DETAILED TESTERS LIST:');
        testers.forEach((t, i) => {
            const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A';
            const statusStr = t.status === 'added_to_console' ? '[ADDED ✅]' : '[PENDING ⏳]';
            console.log(`  ${(i + 1).toString().padStart(2, ' ')}. ${t.email.padEnd(35, ' ')} ${statusStr.padEnd(12, ' ')} Registered: ${dateStr}`);
        });
    }

    console.log('\n=============================================================');
    console.log('  📌 Google Play Console Closed Testing Instructions:');
    console.log('  1. Go to Google Play Console: https://play.google.com/console');
    console.log('  2. Select LifePartner AI > Testing > Closed testing');
    console.log('  3. In your closed track > Testers tab > Email lists');
    console.log('  4. Paste the comma-separated emails above and click "Save changes"');
    console.log('  5. Direct testers to Opt-In via Web:');
    console.log('     👉 https://play.google.com/apps/testing/com.lifepartner.ai');
    console.log('  6. Testers download from Google Play Store:');
    console.log('     👉 https://play.google.com/store/apps/details?id=com.lifepartner.ai');
    console.log('=============================================================\n');
}

main();

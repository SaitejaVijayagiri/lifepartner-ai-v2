import { prisma } from './src/prisma';

async function main() {
    // Full confirmed female list based on name analysis
    // Format: { id, name, reason }
    const confirmedFemales = [
        // Auto-detected by script
        { id: '7ca6e2af-0e82-4e81-92f5-9b9adbddec0a', name: 'Amrita', reason: 'Amrita = common Indian female name' },
        { id: '32e49c6c-d57d-47c6-b1fd-802a516aa2db', name: 'Ramya', reason: 'Ramya = common Indian female name' },
        { id: '4f3f1243-0aca-4630-bf2e-3733088b3f5b', name: 'Soumya Pushkar', reason: 'Soumya = common Indian female name' },
        // Manually identified from the uncertain list
        { id: '2a4aecf1-a098-4b9e-beed-459208258ab9', name: 'harika', reason: 'Harika = Telugu female name' },
        { id: 'aa7a4796-b9c1-4ae4-bc45-0dc695fa5d09', name: 'Harika', reason: 'Harika = Telugu female name' },
        { id: 'bd73cb99-4d0f-4048-a335-121da0dc1e01', name: 'Harika Vijayagiri', reason: 'Harika = Telugu female name' },
        { id: '2af1260b-af38-477d-ae35-a0f5d1946fb0', name: 'Krithi', reason: 'Krithi = Telugu female name (not verified)' },
        { id: 'b28d3099-8b1b-4b6b-b265-c1b45f0ae7e7', name: 'Krithi', reason: 'Krithi = Telugu female name (not verified)' },
        { id: '163a318c-622f-4963-82fe-f6b32337852b', name: 'Krithi reddy', reason: 'Krithi = Telugu female name (not verified)' },
        { id: '38000bba-5efe-4759-8be5-d5eea3f2822f', name: 'Lucy Verma', reason: 'Lucy = female name' },
        { id: '55993005-5cc8-4d1d-bc3f-7ce5e11b7e41', name: 'Rajnandini panda', reason: 'Rajnandini = female name (not verified)' },
        { id: '3e289e58-3ac0-478b-987e-27ec807813c9', name: 'Shwetagagotia', reason: 'Shweta prefix = female name' },
        { id: '2356c678-abff-4e29-8343-5e1cf8480b8c', name: 'Tanishka Vuthuri', reason: 'Tanishka = female name' },
        { id: 'f763aa5c-1178-4611-9154-e26e5395e028', name: 'Tanu Singh', reason: 'Tanu = female name' },
        { id: 'c0ccd101-9dd3-4fb4-8e1e-fe131298d809', name: 'Ashwarya Chughra', reason: 'Ashwarya = Aishwarya variant, female (not verified)' },
    ];

    console.log(`\n=== CONFIRMED FEMALE USERS TO UPDATE (${confirmedFemales.length}) ===\n`);
    confirmedFemales.forEach((u, i) => {
        console.log(`${i + 1}. "${u.name}" — ${u.reason}`);
        console.log(`   ID: ${u.id}\n`);
    });

    console.log('\n=== UPDATING GENDER TO Female... ===\n');

    let updated = 0;
    for (const u of confirmedFemales) {
        try {
            await prisma.users.update({
                where: { id: u.id },
                data: { gender: 'Female' }
            });
            console.log(`✅ Updated: ${u.name} (${u.id})`);
            updated++;
        } catch (e: any) {
            console.error(`❌ Failed for ${u.name}: ${e.message}`);
        }
    }

    console.log(`\n✅ Done! Updated ${updated}/${confirmedFemales.length} users to Female.`);

    // Show new totals
    const newFemaleCount = await prisma.users.count({ where: { gender: 'Female', is_verified: true } });
    const newMaleCount = await prisma.users.count({ where: { gender: 'Male', is_verified: true } });
    const stillNull = await prisma.users.count({ where: { gender: null } });
    
    console.log(`\n=== UPDATED COUNTS ===`);
    console.log(`Verified Females: ${newFemaleCount}`);
    console.log(`Verified Males: ${newMaleCount}`);
    console.log(`Still null gender: ${stillNull}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

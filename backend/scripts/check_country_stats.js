const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- DETAILED COUNTRY & LOCATION ANALYTICS ---");

    const allUsers = await prisma.users.findMany({
        select: {
            id: true,
            email: true,
            full_name: true,
            location_name: true,
            city: true,
            state: true,
            created_at: true
        }
    });

    const countryCount = {};
    const cityCount = {};

    allUsers.forEach(u => {
        const loc = u.location_name || '';
        let country = 'India 🇮🇳';

        if (loc.toLowerCase().includes('malaysia')) country = 'Malaysia 🇲🇾';
        else if (loc.toLowerCase().includes('usa') || loc.toLowerCase().includes('united states') || loc.toLowerCase().includes('america')) country = 'United States 🇺🇸';
        else if (loc.toLowerCase().includes('uk') || loc.toLowerCase().includes('london') || loc.toLowerCase().includes('united kingdom')) country = 'United Kingdom 🇬🇧';
        else if (loc.toLowerCase().includes('uae') || loc.toLowerCase().includes('dubai') || loc.toLowerCase().includes('emirates')) country = 'United Arab Emirates 🇦🇪';
        else if (loc.toLowerCase().includes('canada')) country = 'Canada 🇨🇦';
        else if (loc.toLowerCase().includes('singapore')) country = 'Singapore 🇸🇬';
        else if (loc.toLowerCase().includes('australia')) country = 'Australia 🇦🇺';
        else if (loc.toLowerCase().includes('qatar')) country = 'Qatar 🇶🇦';
        else if (loc.toLowerCase().includes('saudi')) country = 'Saudi Arabia 🇸🇦';
        else if (loc.toLowerCase().includes('germany')) country = 'Germany 🇩🇪';
        else if (loc) {
            const parts = loc.split(',');
            country = parts[parts.length - 1].trim();
        }

        countryCount[country] = (countryCount[country] || 0) + 1;
        
        if (loc) {
            cityCount[loc] = (cityCount[loc] || 0) + 1;
        }
    });

    console.log("\n📊 Breakdown by Country:");
    console.table(countryCount);

    console.log("\n📍 Top Cities / Locations:");
    console.table(Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 20));

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    prisma.$disconnect();
});

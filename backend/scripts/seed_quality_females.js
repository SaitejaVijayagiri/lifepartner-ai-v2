const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const FEMALE_PHOTOS = [
    'https://images.unsplash.com/photo-1621784563330-caee1b23f8c8?w=800&fit=crop',
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&fit=crop',
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&fit=crop',
    'https://images.unsplash.com/photo-1554522438-84222e831137?w=800&fit=crop',
    'https://images.unsplash.com/photo-1623091411315-69250a6a246f?w=800&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&fit=crop',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&fit=crop',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&fit=crop',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&fit=crop',
    'https://images.unsplash.com/photo-1464863979621-258859e62245?w=800&fit=crop',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&fit=crop',
    'https://images.unsplash.com/photo-1517070208541-6ddc4d3efbcb?w=800&fit=crop',
    'https://images.unsplash.com/photo-1481214110143-ed630356e1bb?w=800&fit=crop',
    'https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?w=800&fit=crop',
    'https://images.unsplash.com/photo-1485230205346-71acb9518d9c?w=800&fit=crop',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&fit=crop',
    'https://images.unsplash.com/photo-1521310192545-4ac7951413f0?w=800&fit=crop',
    'https://images.unsplash.com/photo-1509839862600-309617c3201e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&fit=crop',
    'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=800&fit=crop',
    'https://images.unsplash.com/photo-1511485977113-f34c92461ad9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?w=800&fit=crop',
    'https://images.unsplash.com/photo-1506956191951-7a88da4435e5?w=800&fit=crop',
    'https://images.unsplash.com/photo-1492106087820-71f171ce85d9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=800&fit=crop',
    'https://images.unsplash.com/photo-1487573884658-a5d3c667584e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1512413314640-531265af1aa6?w=800&fit=crop',
    'https://images.unsplash.com/photo-1456885284447-7dd4bb8720bf?w=800&fit=crop',
    'https://images.unsplash.com/photo-1485290334039-a3c69043e541?w=800&fit=crop',
    'https://images.unsplash.com/photo-1508243529287-e21914733111?w=800&fit=crop',
    'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&fit=crop',
    'https://images.unsplash.com/photo-1481824429379-07aa5e5b0739?w=800&fit=crop',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&fit=crop',
    'https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=800&fit=crop'
];

const FIRST_NAMES = [
    'Ananya', 'Diya', 'Ishaanvi', 'Kavya', 'Meera', 'Navya', 'Pooja', 'Rhea',
    'Sanya', 'Tanvi', 'Vanshika', 'Aarohi', 'Bhavna', 'Charu', 'Deepika',
    'Esha', 'Gauri', 'Hiral', 'Isha', 'Jhanvi', 'Kritika', 'Lavanya', 'Maitreyi',
    'Nandini', 'Prisha', 'Radhika', 'Sakshi', 'Tara', 'Urvi', 'Vidya',
    'Aishwarya', 'Bhumika', 'Chhavi', 'Divya', 'Garima', 'Harini', 'Juhi',
    'Kashish', 'Leela', 'Madhuri', 'Niharika', 'Palak', 'Rashi', 'Snehal',
    'Trisha', 'Vaishnavi', 'Yamini', 'Zoya', 'Aditi', 'Mallika', 'Simran'
];

const SURNAMES = [
    'Sharma', 'Verma', 'Patel', 'Reddy', 'Iyer', 'Menon', 'Nair', 'Deshmukh',
    'Kulkarni', 'Joshi', 'Chatterjee', 'Banerjee', 'Bose', 'Gupta', 'Agrawal',
    'Singhania', 'Kapoor', 'Malhotra', 'Bhatia', 'Chopra', 'Rao', 'Shetty',
    'Hegde', 'Gowda', 'Mehta', 'Shah', 'Trivedi', 'Pandey', 'Mishra', 'Tripathi'
];

const CITIES = [
    { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
    { city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
    { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
    { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
    { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
    { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
    { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
    { city: 'Chandigarh', state: 'Punjab', lat: 30.7333, lng: 76.7794 },
    { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
    { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 }
];

const PROFESSIONS = [
    { title: 'Software Engineer', income: '18-25 LPA', edu: 'B.Tech / M.Tech' },
    { title: 'Product Manager', income: '22-30 LPA', edu: 'MBA / B.Tech' },
    { title: 'Data Scientist', income: '16-24 LPA', edu: 'M.S. in Computer Science' },
    { title: 'Doctor (MD)', income: '20-28 LPA', edu: 'MBBS, MD' },
    { title: 'Architect', income: '12-18 LPA', edu: 'B.Arch' },
    { title: 'Chartered Accountant', income: '15-22 LPA', edu: 'CA, B.Com' },
    { title: 'UI/UX Designer', income: '14-20 LPA', edu: 'Design Graduate' },
    { title: 'Digital Marketing Lead', income: '12-18 LPA', edu: 'MBA Marketing' },
    { title: 'Financial Analyst', income: '14-20 LPA', edu: 'CFA, MBA Finance' },
    { title: 'Clinical Psychologist', income: '10-15 LPA', edu: 'M.Phil Clinical Psychology' },
    { title: 'HR Business Partner', income: '12-16 LPA', edu: 'MBA HR' }
];

const HOBBIES = [
    'Classical Dance, Travel, Reading',
    'Yoga, Baking, Photography',
    'Music, Trekking, Culinary Arts',
    'Swimming, Painting, Literature',
    'Fitness, Coffee Connoisseur, Hiking',
    'Sitar, Badminton, Gardening',
    'Volunteering, Scuba Diving, Writing'
];

async function seed() {
    console.log("🌱 Seeding 50 diverse verified Indian female profiles...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("LifePartner@2026", salt);

    let createdCount = 0;
    for (let i = 0; i < 50; i++) {
        const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
        const lastName = SURNAMES[i % SURNAMES.length];
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now() % 100000}_${i}@lifepartnerai.in`;
        const photo = FEMALE_PHOTOS[i % FEMALE_PHOTOS.length];
        const loc = CITIES[i % CITIES.length];
        const prof = PROFESSIONS[i % PROFESSIONS.length];
        const age = 23 + (i % 11); // Ages 23 to 33
        const height = `${5}'${Math.floor(2 + (i % 6))}"`;
        const hobbies = HOBBIES[i % HOBBIES.length];

        const referralCode = `${firstName.slice(0, 4).toUpperCase()}${1000 + i}`;

        const metadata = {
            onboarding_completed: true,
            career: {
                profession: prof.title,
                educationLevel: prof.edu,
                education: prof.edu,
                income: prof.income,
                company: 'Top Tier MNC'
            },
            location: {
                city: loc.city,
                state: loc.state,
                country: 'India',
                lat: loc.lat,
                lng: loc.lng
            },
            religion: {
                faith: i % 10 === 0 ? 'Sikh' : (i % 8 === 0 ? 'Christian' : (i % 6 === 0 ? 'Jain' : 'Hindu')),
                caste: 'Open to All',
                interCasteOpen: 'Yes, open to inter-caste'
            },
            lifestyle: {
                diet: i % 2 === 0 ? 'Vegetarian' : 'Non-Vegetarian',
                smoking: 'No',
                smoke: 'No',
                drinking: i % 3 === 0 ? 'Occasionally' : 'No',
                drink: i % 3 === 0 ? 'Occasionally' : 'No',
                hobbies: hobbies
            },
            family: {
                values: 'Moderate / Modern Traditional',
                type: i % 2 === 0 ? 'Nuclear' : 'Joint'
            },
            aboutMe: `Hi, I am ${firstName}! I work as a ${prof.title} in ${loc.city}. I enjoy ${hobbies}. Looking for an ambitious, understanding, and kind partner to build a beautiful life together.`,
            expectations: 'Someone genuine, respectful, with shared values and a good sense of humor.',
            partnerPreferences: {
                ageRange: `${Math.max(24, age - 2)} - ${age + 6}`,
                location: 'Metro Cities / Flexible'
            },
            photos: [photo, photo],
            height: height,
            maritalStatus: 'Never Married',
            reels: []
        };

        try {
            const user = await prisma.users.create({
                data: {
                    email,
                    password_hash: passwordHash,
                    full_name: fullName,
                    gender: 'Female',
                    age: age,
                    city: loc.city,
                    state: loc.state,
                    location_name: `${loc.city}, India`,
                    avatar_url: photo,
                    is_verified: true,
                    referral_code: referralCode,
                    coins: 100
                }
            });

            await prisma.profiles.create({
                data: {
                    user_id: user.id,
                    raw_prompt: metadata.aboutMe,
                    metadata: metadata,
                    photos: [photo]
                }
            });

            createdCount++;
        } catch (e) {
            console.error(`Failed to create ${fullName}:`, e.message);
        }
    }

    console.log(`🎉 Successfully seeded ${createdCount} high-quality verified female profiles!`);
    await prisma.$disconnect();
}

seed().catch(console.error);

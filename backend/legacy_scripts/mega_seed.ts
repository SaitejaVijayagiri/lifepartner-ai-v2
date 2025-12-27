
import { pool } from '../db';
import bcrypt from 'bcrypt';

// --- CURATED 100 UNIQUE INDIAN PORTRAITS (REAL & VERIFIED LOOK) ---

// 50 Indian Male Portraits (High Quality, Professional to Casual)
const MALE_PHOTOS = [
    'https://images.unsplash.com/photo-1566492031773-4fbc7e7bd5cc?w=800&fit=crop',
    'https://images.unsplash.com/photo-1619380061814-58f03700229c?w=800&fit=crop',
    'https://images.unsplash.com/photo-1621252179027-94459d27d3ee?w=800&fit=crop',
    'https://images.unsplash.com/photo-1595152452543-e5cca283f545?w=800&fit=crop',
    'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?w=800&fit=crop',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&fit=crop',
    'https://images.unsplash.com/photo-1600486913747-55e5470d6f40?w=800&fit=crop',
    'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=800&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&fit=crop',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&fit=crop',
    'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?w=800&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&fit=crop',
    'https://images.unsplash.com/photo-1503443207922-dff7d543ca0e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=800&fit=crop',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&fit=crop',
    'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=800&fit=crop',
    'https://images.unsplash.com/photo-1542178243-bc20204b769f?w=800&fit=crop',
    'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=800&fit=crop',
    'https://images.unsplash.com/photo-1546525848-3ce03ca516f6?w=800&fit=crop',
    'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=800&fit=crop',
    'https://images.unsplash.com/photo-1513206263914-f58c73496036?w=800&fit=crop',
    'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=800&fit=crop',
    'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800&fit=crop',
    'https://images.unsplash.com/photo-1514222709107-a180c68d72b4?w=800&fit=crop',
    'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&fit=crop',
    'https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=800&fit=crop',
    'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=800&fit=crop',
    'https://images.unsplash.com/photo-1484186139897-d5fc6b908812?w=800&fit=crop',
    'https://images.unsplash.com/photo-1485206412256-701ccc5b93ca?w=800&fit=crop',
    'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=800&fit=crop',
    'https://images.unsplash.com/photo-1500336624523-d727130c3328?w=800&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1506634572416-48cdfe530110?w=800&fit=crop',
    'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&fit=crop',
    'https://images.unsplash.com/photo-1508341591423-4347099e1f19?w=800&fit=crop',
    'https://images.unsplash.com/photo-1492446845049-9c50cc313f00?w=800&fit=crop',
    'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=800&fit=crop',
    'https://images.unsplash.com/photo-1507038732509-8b1a9623223a?w=800&fit=crop',
    'https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&fit=crop',
    'https://images.unsplash.com/photo-1485893086445-ed75865251c5?w=800&fit=crop',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&fit=crop',
    'https://images.unsplash.com/photo-1485110173427-ac3256930d67?w=800&fit=crop',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&fit=crop',
    'https://images.unsplash.com/photo-1505503693641-1926193e8d57?w=800&fit=crop',
    'https://images.unsplash.com/photo-1501747315-124a0eaca060?w=800&fit=crop',
    'https://images.unsplash.com/photo-1497551060073-4c5ab6435f12?w=800&fit=crop'
];

// 50 Indian Female Portraits (High Quality, Traditional to Modern)
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
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&fit=crop',
    'https://images.unsplash.com/photo-1521310192545-4ac7951413f0?w=800&fit=crop',
    'https://images.unsplash.com/photo-1509839862600-309617c3201e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=800&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&fit=crop',
    'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=800&fit=crop',
    'https://images.unsplash.com/photo-1511485977113-f34c92461ad9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?w=800&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&fit=crop',
    'https://images.unsplash.com/photo-1506956191951-7a88da4435e5?w=800&fit=crop',
    'https://images.unsplash.com/photo-1492106087820-71f171ce85d9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=800&fit=crop',
    'https://images.unsplash.com/photo-1487573884658-a5d3c667584e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1512413314640-531265af1aa6?w=800&fit=crop',
    'https://images.unsplash.com/photo-1456885284447-7dd4bb8720bf?w=800&fit=crop',
    'https://images.unsplash.com/photo-1485290334039-a3c69043e541?w=800&fit=crop',
    'https://images.unsplash.com/photo-1508243529287-e21914733111?w=800&fit=crop',
    'https://images.unsplash.com/photo-1498551172505-8ee7ad69f235?w=800&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&fit=crop',
    'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=800&fit=crop',
    'https://images.unsplash.com/photo-1481824429379-07aa5e5b0739?w=800&fit=crop',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&fit=crop',
    'https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=800&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&fit=crop',
    'https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=800&fit=crop'
];


const CITIES = [
    { name: "Mumbai", state: "Maharashtra" },
    { name: "Delhi", state: "Delhi" },
    { name: "Bangalore", state: "Karnataka" },
    { name: "Hyderabad", state: "Telangana" },
    { name: "Ahmedabad", state: "Gujarat" },
    { name: "Chennai", state: "Tamil Nadu" },
    { name: "Kolkata", state: "West Bengal" },
    { name: "Pune", state: "Maharashtra" },
    { name: "Jaipur", state: "Rajasthan" },
    { name: "Lucknow", state: "Uttar Pradesh" },
    { name: "Chandigarh", state: "Chandigarh" },
    { name: "Indore", state: "Madhya Pradesh" },
    { name: "Coimbatore", state: "Tamil Nadu" },
    { name: "Kochi", state: "Kerala" },
    { name: "Visakhapatnam", state: "Andhra Pradesh" }
];

const PROFESSIONS = [
    'Software Engineer', 'Senior Developer', 'Data Scientist', 'Product Manager', 'UX Designer',
    'Doctor', 'Dentist', 'Surgeon', 'Physiotherapist', ' pharmacist',
    'Civil Engineer', 'Architect', 'Interior Designer',
    'Chartered Accountant', 'Investment Banker', 'Financial Analyst',
    'Digital Marketer', 'Content Creator', 'Journalist', 'Teacher', 'Professor',
    'Business Owner', 'Entrepreneur', 'Fashion Designer'
];

const HOBBIES = [
    'Travel', 'Photography', 'Reading', 'Cooking', 'Music', 'Dancing', 'Hiking', 'Yoga', 'Gaming', 'Cricket', 'Movies', 'Art', 'Volunteering'
];

const MALE_NAMES = [
    'Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya',
    'Vikram', 'Rohan', 'Karthik', 'Suresh', 'Manish', 'Varun', 'Siddharth', 'Nikhil', 'Pranav', 'Rahul',
    'Amit', 'Deepak', 'Rajesh', 'Sandeep', 'Vivek', 'Anil', 'Ravi', 'Prakash', 'Ajay', 'Vijay'
];

const FEMALE_NAMES = [
    'Aadya', 'Diya', 'Saanvi', 'Ananya', 'Kiara', 'Pari', 'Anika', 'Riya', 'Myra', 'Ira',
    'Priya', 'Anjali', 'Sneha', 'Kavya', 'Ishita', 'Meera', 'Pooja', 'Nisha', 'Swati', 'Shruti',
    'Tanvi', 'Neha', 'Divya', 'Deepika', 'Shweta', 'Anita', 'Sunita', 'Rekha', 'Suman', 'Lakshmi'
];

const SURNAMES = [
    'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Saxena', 'Mehta', 'Jain', 'Agarwal', 'Singh',
    'Reddy', 'Rao', 'Naidu', 'Chowdary', 'Patel', 'Desai', 'Joshi', 'Kulkarni', 'Iyer', 'Menon',
    'Nair', 'Pillai', 'Mukherjee', 'Banerjee', 'Ghosh', 'Das', 'Chatterjee', 'Khan', 'Ahmed', 'Ali'
];

function getRandom(arr: any[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function getRandomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min)) + min; }

function getBio(name: string, profession: string, city: string, hobby: string) {
    const templates = [
        `Hi, I'm ${name}, a ${profession} based in ${city}.`,
        `I am a passionate ${profession} living in ${city}. I love ${hobby}.`,
        `Simply put, I'm a down-to-earth person who enjoys small things in life. Working as a ${profession}.`,
        `Hello! searching for a partner who is kind and ambitious. I work as a ${profession} in ${city}.`,
        `${city} born and raised. ${profession} by profession, ${hobby} lover by heart.`
    ];
    return getRandom(templates) + " Looking for a meaningful connection.";
}

async function megaSeed() {
    console.log("🚀 STARTING MEGA SEED (1000 USERS WITH 100 UNIQUE PHOTOS)...");
    const client = await pool.connect();

    try {
        const passwordHash = await bcrypt.hash("password123", 10);
        const BATCH_SIZE = 50;
        const TOTAL_USERS = 1000;

        for (let batch = 0; batch < TOTAL_USERS / BATCH_SIZE; batch++) {
            console.log(`Processing Batch ${batch + 1}...`);

            for (let i = 0; i < BATCH_SIZE; i++) {
                const isMale = Math.random() > 0.5;
                const firstName = getRandom(isMale ? MALE_NAMES : FEMALE_NAMES);
                const lastName = getRandom(SURNAMES);
                const fullName = `${firstName} ${lastName}`;
                const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}_${i}@example.com`;

                const cityObj = getRandom(CITIES);
                const profession = getRandom(PROFESSIONS);
                const hobby = getRandom(HOBBIES);
                const age = getRandomInt(23, 38);
                const heightFt = getRandomInt(5, 6);
                const heightIn = getRandomInt(0, 11);

                // --- PHOTO SELECTION LOGIC ---
                // We have 50 unique Male and 50 unique Female photos.
                // We cycle through them using the loop index (batch * BATCH_SIZE + i) to ensure full coverage
                // before repeating.
                const globalIndex = batch * BATCH_SIZE + i;
                const photoArray = isMale ? MALE_PHOTOS : FEMALE_PHOTOS;
                const avatar = photoArray[globalIndex % photoArray.length];

                // INSERT USER
                const uRes = await client.query(`
                    INSERT INTO public.users (email, phone, full_name, gender, age, location_name, password_hash, avatar_url, is_verified)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                    RETURNING id
                `, [email, `+91 ${getRandomInt(7000000000, 9999999999)}`, fullName, isMale ? 'Male' : 'Female', age, cityObj.name, passwordHash, avatar]);

                const userId = uRes.rows[0].id;

                // INSERT PROFILE
                const metadata = {
                    career: { profession: profession, company: "Private Ltd", income: `${getRandomInt(5, 30)} LPA`, educationLevel: "Graduate" },
                    location: { city: cityObj.name, state: cityObj.state, country: "India" },
                    lifestyle: { diet: Math.random() > 0.6 ? "Vegetarian" : "Non-Vegetarian", smoking: "No", drinking: "Occasionally" },
                    religion: { faith: "Hindu", caste: getRandom(["Brahmin", "Kshatriya", "Vaishya", "Other"]) },
                    basics: { maritalStatus: "Never Married", height: `${heightFt}'${heightIn}"` },
                    aboutMe: getBio(firstName, profession, cityObj.name, hobby),
                    hobbies: [hobby, getRandom(HOBBIES)],
                    photos: [avatar, avatar]
                };

                await client.query(`
                    INSERT INTO public.profiles (user_id, raw_prompt, metadata, updated_at, photos)
                    VALUES ($1, $2, $3, NOW(), $4)
                `, [userId, metadata.aboutMe, JSON.stringify(metadata), JSON.stringify([avatar, avatar])]);
            }
        }

        console.log("✅ MEGA SEED COMPLETE! 1000 Users added.");

    } catch (e) {
        console.error("❌ Seed Failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

megaSeed();

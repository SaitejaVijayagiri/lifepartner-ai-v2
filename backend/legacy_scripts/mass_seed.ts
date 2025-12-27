
import { pool } from '../db';
import bcrypt from 'bcrypt';

const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Chennai', 'Delhi', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur'];
const PROFESSIONS = ['Software Engineer', 'Civil Engineer', 'Doctor', 'Dentist', 'MBA Student', 'Business Owner', 'Architect', 'Teacher', 'Content Creator', 'Data Scientist'];
const MALE_NAMES = ['Rahul', 'Aditya', 'Vikram', 'Rohan', 'Karthik', 'Suresh', 'Manish', 'Varun', 'Arjun', 'Siddharth', 'Nikhil', 'Pranav'];
const FEMALE_NAMES = ['Priya', 'Anjali', 'Sneha', 'Kavya', 'Riya', 'Ishita', 'Meera', 'Pooja', 'Nisha', 'Swati', 'Shruti', 'Tanvi'];

// High Quality Indian Portraits from Unsplash
const MALE_PHOTOS = [
    'https://images.unsplash.com/photo-1566492031773-4fbc7e7bd5cc?w=800&auto=format&fit=crop', // Indian Male 1
    'https://images.unsplash.com/photo-1619380061814-58f03700229c?w=800&auto=format&fit=crop', // Indian Male 2 (Beard)
    'https://images.unsplash.com/photo-1621252179027-94459d27d3ee?w=800&auto=format&fit=crop', // Indian Professional
    'https://images.unsplash.com/photo-1595152452543-e5cca283f545?w=800&auto=format&fit=crop', // Indian Guy
    'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?w=800&auto=format&fit=crop'  // Traditional
];
const FEMALE_PHOTOS = [
    'https://images.unsplash.com/photo-1621784563330-caee1b23f8c8?w=800&auto=format&fit=crop', // Indian Female 1
    'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&auto=format&fit=crop', // Saree/Traditional
    'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&auto=format&fit=crop', // Modern Indian
    'https://images.unsplash.com/photo-1554522438-84222e831137?w=800&auto=format&fit=crop', // Smile
    'https://images.unsplash.com/photo-1623091411315-69250a6a246f?w=800&auto=format&fit=crop'  // Ethnic Wear
];

function getRandom(arr: any[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function getRandomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min)) + min; }

async function seedMassUsers() {
    console.log("🚀 STARTING MASS SEEDING (50 USERS)...");
    const client = await pool.connect();

    try {
        const passwordHash = await bcrypt.hash("password123", 10);

        // Generate 50 Users
        for (let i = 0; i < 50; i++) {
            const isMale = Math.random() > 0.5;
            const firstName = getRandom(isMale ? MALE_NAMES : FEMALE_NAMES);
            const lastName = ['Sharma', 'Reddy', 'Verma', 'Patel', 'Singh', 'Rao', 'Kumar', 'Iyer'][getRandomInt(0, 8)];
            const fullName = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`; // Unique Email

            const city = getRandom(CITIES);
            const profession = getRandom(PROFESSIONS);
            const age = getRandomInt(22, 35);
            const heightFt = getRandomInt(5, 7);
            const heightIn = getRandomInt(0, 11);
            const heightStr = `${heightFt}'${heightIn}`;

            const avatar = getRandom(isMale ? MALE_PHOTOS : FEMALE_PHOTOS);
            const bio = `I am a ${profession} living in ${city}. Looking for someone who shares my values. I enjoy music, travel, and good food.`;

            console.log(`Creating ${fullName} (${profession} in ${city})...`);

            // 1. Insert User
            const uRes = await client.query(`
                INSERT INTO public.users (email, phone, full_name, gender, age, location_name, password_hash, avatar_url, is_verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            `, [email, `+91 ${getRandomInt(9000000000, 9999999999)}`, fullName, isMale ? 'Male' : 'Female', age, city, passwordHash, avatar]);

            if (uRes.rows.length === 0) continue; // Skip duplicates
            const userId = uRes.rows[0].id;

            // 2. Insert Profile (Metadata)
            const metadata = {
                career: { profession: profession, company: "Tech Corp", income: `${getRandomInt(10, 50)} LPA`, educationLevel: "B.Tech" },
                location: { city: city, country: "India", state: "Telangana" }, // Simplified state
                lifestyle: { diet: Math.random() > 0.7 ? "Veg" : "Non-Veg", smoking: "No", drinking: Math.random() > 0.5 ? "Socially" : "No" },
                religion: { faith: "Hindu", caste: "General" },
                basics: { maritalStatus: "Never Married", height: heightStr },
                height: heightStr,
                aboutMe: bio,
                hobbies: ["Travel", "Music", "Reading"],
                photos: [avatar] // Add main photo to gallery too
            };

            await client.query(`
                INSERT INTO public.profiles (user_id, raw_prompt, metadata, updated_at, photos)
                VALUES ($1, $2, $3, NOW(), $4)
                ON CONFLICT (user_id) DO UPDATE 
                SET metadata = $3, raw_prompt = $2
            `, [userId, bio, JSON.stringify(metadata), JSON.stringify([avatar])]);
        }

        console.log("✅ MASS SEEDING COMPLETE! 50 Users added.");

    } catch (e) {
        console.error("❌ Seed Failed:", e);
    } finally {
        client.release();
        process.exit();
    }
}

seedMassUsers();

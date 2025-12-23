
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const MALE_PROFILES = [
    {
        name: "Arjun Sharma",
        age: 28,
        location: "Bangalore, India",
        city: "Bangalore",
        state: "Karnataka",
        photo: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=500&auto=format&fit=crop&q=60",
        bio: "Senior Software Engineer. Love coding, hiking, and exploring new cafes in Indiranagar. Looking for a partner who values simplicity.",
        profession: "Software Engineer",
        income: "25 LPA"
    },
    {
        name: "Vikram Singh",
        age: 30,
        location: "New Delhi, India",
        city: "New Delhi",
        state: "Delhi",
        photo: "https://images.unsplash.com/photo-1619380061814-58f03700243a?w=500&auto=format&fit=crop&q=60",
        bio: "Cardiologist at Apollo. Passionate about health and fitness. In my free time, I play guitar and read.",
        profession: "Doctor",
        income: "30 LPA"
    },
    {
        name: "Rahul Verma",
        age: 29,
        location: "Mumbai, India",
        city: "Mumbai",
        state: "Maharashtra",
        photo: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=500&auto=format&fit=crop&q=60",
        bio: "Architect designing sustainable homes. Love jazz music and sunsets at Marine Drive.",
        profession: "Architect",
        income: "18 LPA"
    },
    {
        name: "Karthik Reddy",
        age: 31,
        location: "Hyderabad, India",
        city: "Hyderabad",
        state: "Telangana",
        photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60",
        bio: "Entrepreneur in the tech space. Foodie by heart, especially Hyderabadi Biryani. Looking for an ambitious partner.",
        profession: "Businessman",
        income: "50 LPA"
    },
    {
        name: "Aditya Iyer",
        age: 27,
        location: "Chennai, India",
        city: "Chennai",
        state: "Tamil Nadu",
        photo: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=500&auto=format&fit=crop&q=60",
        bio: "Investment Banker. Classical music enthusiast. Family oriented and looking for serious commitment.",
        profession: "Investment Banker",
        income: "22 LPA"
    }
];

const FEMALE_PROFILES = [
    {
        name: "Priya Patel",
        age: 26,
        location: "Ahmedabad, India",
        city: "Ahmedabad",
        state: "Gujarat",
        photo: "https://images.unsplash.com/photo-1621252179027-94459d27d3ee?w=500&auto=format&fit=crop&q=60",
        bio: "Dentist with a sweet tooth. Love travelling and traditional Gujarati culture. Looking for a kind-hearted partner.",
        profession: "Dentist",
        income: "15 LPA"
    },
    {
        name: "Ananya Gupta",
        age: 28,
        location: "Pune, India",
        city: "Pune",
        state: "Maharashtra",
        photo: "https://images.unsplash.com/photo-1558227108-83a15dd5f6a1?w=500&auto=format&fit=crop&q=60",
        bio: "UI/UX Designer. Creative soul. Yoga practitioner. Looking for someone who can make me laugh.",
        profession: "Designer",
        income: "14 LPA"
    },
    {
        name: "Sneha Rao",
        age: 29,
        location: "Bangalore, India",
        city: "Bangalore",
        state: "Karnataka",
        photo: "https://images.unsplash.com/photo-1594751543129-6701ad444259?w=500&auto=format&fit=crop&q=60",
        bio: "Assistant Professor. Avid reader and coffee lover. Value intellect and kindness above all.",
        profession: "Professor",
        income: "12 LPA"
    },
    {
        name: "Riya Das",
        age: 27,
        location: "Kolkata, India",
        city: "Kolkata",
        state: "West Bengal",
        photo: "https://images.unsplash.com/photo-1601288496920-b6154fe3626a?w=500&auto=format&fit=crop&q=60",
        bio: "Marketing Manager. Art lover and amateur photographer. Looking for a partner to explore the world with.",
        profession: "Marketing Manager",
        income: "16 LPA"
    },
    {
        name: "Meara Kapoor",
        age: 25,
        location: "Jaipur, India",
        city: "Jaipur",
        state: "Rajasthan",
        photo: "https://images.unsplash.com/photo-1623091411315-bd4dc960d571?w=500&auto=format&fit=crop&q=60",
        bio: "Artist and Illustrator. Free spirit. Love pottery and painting. Looking for a creative connection.",
        profession: "Artist",
        income: "10 LPA"
    }
];

async function seed() {
    const client = await pool.connect();

    try {
        console.log("🌱 Seeding Verification Profiles...");

        // 1. Seed Males
        for (const p of MALE_PROFILES) {
            const id = uuidv4();
            const email = `verify.male.${p.name.split(' ')[0].toLowerCase()}@test.com`;
            const phone = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

            // Create User
            await client.query(`
                INSERT INTO users (id, phone, email, password_hash, full_name, gender, age, location_name, city, state, avatar_url, is_verified, is_premium)
                VALUES ($1, $2, $3, $4, $5, 'Male', $6, $7, $8, $9, $10, TRUE, TRUE)
            `, [id, phone, email, 'HASHED_DUMMY', p.name, p.age, p.location, p.city, p.state, p.photo]);

            // Create Profile Metadata
            const metadata = {
                aboutMe: p.bio,
                photos: [p.photo],
                career: { profession: p.profession, income: p.income, educationLevel: "Master's" },
                location: { city: p.city, state: p.state, country: "India" },
                religion: { faith: "Hindu", caste: "General" },
                lifestyle: { diet: "Non-Veg", smoking: "No", drinking: "Occasionally" },
                family: { type: "Nuclear", status: "Middle Class" }
            };

            await client.query(`
                INSERT INTO profiles (user_id, metadata, raw_prompt)
                VALUES ($1, $2, $3)
            `, [id, metadata, `${p.bio} I am a ${p.profession} living in ${p.city}.`]);
        }

        // 2. Seed Females
        for (const p of FEMALE_PROFILES) {
            const id = uuidv4();
            const email = `verify.female.${p.name.split(' ')[0].toLowerCase()}@test.com`;
            const phone = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

            await client.query(`
                INSERT INTO users (id, phone, email, password_hash, full_name, gender, age, location_name, city, state, avatar_url, is_verified, is_premium)
                VALUES ($1, $2, $3, $4, $5, 'Female', $6, $7, $8, $9, $10, TRUE, TRUE)
            `, [id, phone, email, 'HASHED_DUMMY', p.name, p.age, p.location, p.city, p.state, p.photo]);

            const metadata = {
                aboutMe: p.bio,
                photos: [p.photo],
                career: { profession: p.profession, income: p.income, educationLevel: "Master's" },
                location: { city: p.city, state: p.state, country: "India" },
                religion: { faith: "Hindu", caste: "General" },
                lifestyle: { diet: "Veg", smoking: "No", drinking: "No" },
                family: { type: "Joint", status: "Upper Middle Class" }
            };

            await client.query(`
                INSERT INTO profiles (user_id, metadata, raw_prompt)
                VALUES ($1, $2, $3)
            `, [id, metadata, `${p.bio} I am a ${p.profession} living in ${p.city}.`]);
        }

        console.log("✅ Successfully seeded 10 verification profiles!");

    } catch (e) {
        console.error("Seeding Failed", e);
    } finally {
        client.release();
    }
}

seed();

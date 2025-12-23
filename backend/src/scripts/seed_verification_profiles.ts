
import { pool } from '../db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const MALE_PROFILES = [
    {
        name: "Karthik Subramaniam",
        age: 29,
        location: "Chennai, India",
        city: "Chennai",
        state: "Tamil Nadu",
        photo: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=500&auto=format&fit=crop&q=60",
        bio: "Carnatic flutist and Software Architect. Deeply rooted in tradition but modern in outlook. Looking for someone who appreciates art.",
        profession: "Software Architect",
        income: "35 LPA"
    },
    {
        name: "Sai Teja",
        age: 27,
        location: "Hyderabad, India",
        city: "Hyderabad",
        state: "Telangana",
        photo: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=500&auto=format&fit=crop&q=60",
        bio: "Tech entrepreneur working on AI. Foodie who loves spicy Gongura pickles. Seeking an ambitious partner.",
        profession: "Entrepreneur",
        income: "50 LPA"
    },
    {
        name: "Pradeep Reddy",
        age: 31,
        location: "Visakhapatnam, India",
        city: "Visakhapatnam",
        state: "Andhra Pradesh",
        photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60",
        bio: "Civil Engineer involved in smart city projects. Love long drives along the Vizag coast.",
        profession: "Civil Engineer",
        income: "20 LPA"
    },
    {
        name: "Arjun Nair",
        age: 30,
        location: "Kochi, India",
        city: "Kochi",
        state: "Kerala",
        photo: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&auto=format&fit=crop&q=60",
        bio: "Marine Biologist. Nature lover. Spend my weekends exploring the backwaters. Looking for a simple, earthy connection.",
        profession: "Marine Biologist",
        income: "15 LPA"
    },
    {
        name: "Venkatesh Rao",
        age: 28,
        location: "Bangalore, India",
        city: "Bangalore",
        state: "Karnataka",
        photo: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=500&auto=format&fit=crop&q=60",
        bio: "Product Manager at a Fintech unicorn. Avid trekker (Western Ghats are my second home).",
        profession: "Product Manager",
        income: "40 LPA"
    }
];

const FEMALE_PROFILES = [
    {
        name: "Lakshmi Narayanan",
        age: 26,
        location: "Chennai, India",
        city: "Chennai",
        state: "Tamil Nadu",
        photo: "https://images.unsplash.com/photo-1558227108-83a15dd5f6a1?w=500&auto=format&fit=crop&q=60",
        bio: "Bharatnatyam dancer and Pediatrician. Balancing career and passion. Looking for a supportive partner.",
        profession: "Pediatrician",
        income: "18 LPA"
    },
    {
        name: "Kavya Gowda",
        age: 25,
        location: "Mysore, India",
        city: "Mysore",
        state: "Karnataka",
        photo: "https://images.unsplash.com/photo-1594751543129-6701ad444259?w=500&auto=format&fit=crop&q=60",
        bio: "Literature Professor. Love Kannada poetry and Mysore Pak. Looking for an intellectual connection.",
        profession: "Professor",
        income: "12 LPA"
    },
    {
        name: "Divya Menon",
        age: 28,
        location: "Trivandrum, India",
        city: "Trivandrum",
        state: "Kerala",
        photo: "https://images.unsplash.com/photo-1621252179027-94459d27d3ee?w=500&auto=format&fit=crop&q=60",
        bio: "Ayurvedic Doctor. Believer in holistic living. Yoga enthusiast.",
        profession: "Doctor",
        income: "15 LPA"
    },
    {
        name: "Sowmya Rao",
        age: 27,
        location: "Hyderabad, India",
        city: "Hyderabad",
        state: "Telangana",
        photo: "https://images.unsplash.com/photo-1601288496920-b6154fe3626a?w=500&auto=format&fit=crop&q=60",
        bio: "Data Scientist at Microsoft. Classical singer on weekends. Looking for a mix of modern and traditional values.",
        profession: "Data Scientist",
        income: "30 LPA"
    },
    {
        name: "Anjali Reddy",
        age: 29,
        location: "Vijayawada, India",
        city: "Vijayawada",
        state: "Andhra Pradesh",
        photo: "https://images.unsplash.com/photo-1623091411315-bd4dc960d571?w=500&auto=format&fit=crop&q=60",
        bio: "Fashion Designer running my own boutique. Love experimenting with fabrics. Independent and ambitious.",
        profession: "Fashion Designer",
        income: "25 LPA"
    }
];

async function seed() {
    const client = await pool.connect();

    try {
        console.log("🧹 Cleaning up old verification profiles...");
        // Delete profiles from 'profiles' table first due to FK constraint
        await client.query(`
            DELETE FROM profiles 
            WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'verify.%')
        `);
        // Then delete from 'users' table
        await client.query("DELETE FROM users WHERE email LIKE 'verify.%'");
        console.log("Deleted old verification users.");

        console.log("🌱 Seeding South Indian Verification Profiles...");

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

        console.log("✅ Successfully seeded 10 UNIQUE South Indian verification profiles!");

    } catch (e) {
        console.error("Seeding Failed", e);
    } finally {
        client.release();
    }
}

seed();

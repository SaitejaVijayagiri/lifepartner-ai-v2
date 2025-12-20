
import dotenv from 'dotenv';
dotenv.config();

import { AIService } from '../services/ai';

const ai = new AIService();

const TEST_PROMPTS = [
    "24-28 year old doctor from Mumbai",
    "Software Engineer earning > 20 LPA",
    "Tall Hindu Brahmin girl",
    "Short guy under 30 who likes hiking",
    "Rich businessman from Delhi",
    "Caste no bar but must be vegetarian"
];

async function runVerification() {
    console.log("🔍 Starting AI Search Verification...\n");

    for (const prompt of TEST_PROMPTS) {
        console.log(`----------------------------------------`);
        console.log(`📝 Prompt: "${prompt}"`);
        try {
            const result = await ai.parseSearchQuery(prompt);
            console.log("✅ Parsed Result:", JSON.stringify(result, null, 2));
        } catch (error) {
            console.error("❌ Failed to parse:", error);
        }
    }
}

runVerification();

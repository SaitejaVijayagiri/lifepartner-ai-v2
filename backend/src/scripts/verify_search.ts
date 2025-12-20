
import dotenv from 'dotenv';
dotenv.config();

import { AIService } from '../services/ai';

// FORCE MOCK MODE for Local Logic testing
process.env.MOCK_AI = 'true';

const ai = new AIService();

const TEST_PROMPTS = [
    // Previous Baselines
    "24-28 year old doctor from Mumbai",

    // New Advanced Cases
    "Divorced man from USA",
    "5'10 height non smoker",
    "Teetotaller girl who likes reading",
    "Rich guy 6ft tall",
    "Vegetarian from Hyderabad under 30",
    "Short widow from Delhi"
];

async function runVerification() {
    console.log("🚀 Starting LOCAL NLP SEARCH Verification (Speed Test)...\n");
    const start = Date.now();

    for (const prompt of TEST_PROMPTS) {
        console.log(`----------------------------------------`);
        console.log(`📝 Prompt: "${prompt}"`);
        try {
            const pStart = Date.now();
            const result = await ai.parseSearchQuery(prompt);
            const pEnd = Date.now();
            console.log(`✅ Result (${pEnd - pStart}ms):`, JSON.stringify(result, null, 0)); // Compact JSON
        } catch (error) {
            console.error("❌ Failed:", error);
        }
    }

    console.log(`\n⚡ Total Time: ${Date.now() - start}ms`);
}

runVerification();

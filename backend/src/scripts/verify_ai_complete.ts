
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.MOCK_AI = 'true';

import { AIService } from '../services/ai';

async function verifyAI() {
    const ai = new AIService();
    console.log("🤖 Initializing AI Service Verification...");

    // Test Prompt: Complex Mix of Synonyms, Sentiment, and Semantics
    // "Creative CHEF" -> Foodie/Cooking related (Synonym)
    // "Painting" -> Artist related (Synonym)
    // "Optimistic" -> Positive Sentiment
    const prompt = "Looking for a Creative Chef in Mumbai who loves painting. Should be kind and optimistic.";

    console.log(`\n📝 Test Prompt: "${prompt}"`);

    // 1. Test Regex Parser
    console.log("\n--- 1. Testing Regex Parser (Offline Filters) ---");
    try {
        const filters = await ai.parseSearchQuery(prompt);
        console.log("✅ Parsed Filters:", JSON.stringify(filters, null, 2));

        // Assertions
        // Chef -> Foodie/Cooking? Or did we define "Foodie" = ["chef"] in Synonyms?
        // Let's check what it parses. Ideally "Chef" matches "Foodie" category logic or just extract "Chef" as keyword?
        // In my synonym map: "Foodie": ["chef"...]
        // So checking if 'Foodie' is in keywords (if logic adds standard key) OR if profession catches it.
        // Actually, "Chef" is in synonym list for "Foodie", but "Foodie" is in SYNONYMS as a Key.
        // My logic checks if variations exist -> adds Standard Key to Keywords.
        if (filters.keywords && filters.keywords.includes('Foodie')) console.log("   -> Synonym (Chef -> Foodie): OK");
        else console.log("   -> Synonym (Chef -> Foodie): FAIL (Might be expected if logic only checks specific professions)");

        if (filters.keywords && filters.keywords.includes('Artist')) console.log("   -> Synonym (Painting -> Artist): OK");
        else console.log("   -> Synonym (Painting -> Artist): FAIL");

        if (filters.location === 'Mumbai') console.log("   -> Location: OK");

    } catch (e) {
        console.error("❌ Regex Parser Failed:", e);
    }

    // 2. Test Sentiment Analysis
    console.log("\n--- 2. Testing Sentiment Analysis (Vibe Check) ---");
    try {
        const sentiment = await ai.analyzeSentiment(prompt);
        console.log(`   -> Input: "${prompt}"`);
        console.log(`   -> Sentiment: ${sentiment}`);
        if (sentiment === 'POSITIVE') console.log("   -> Vibe Check: OK");
        else console.log("   -> Vibe Check: FAIL");
    } catch (e) {
        console.error("❌ Sentiment Analysis Failed:", e);
    }
}

verifyAI();

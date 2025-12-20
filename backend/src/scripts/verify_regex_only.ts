
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.MOCK_AI = 'true';

import { AIService } from '../services/ai';

async function verifyRegex() {
    const ai = new AIService();
    // No model loading needed for Regex Parser
    console.log("⚡ Testing Regex Parser with Synonyms...");

    const prompt = "Looking for a 26 year old Brahmin Coder in Mumbai who likes Trekking.";
    const filters = await ai.parseSearchQuery(prompt);

    console.log("Parsed:", JSON.stringify(filters, null, 2));

    if (filters.profession === 'Software Engineer') console.log("✅ Coder -> Software Engineer");
    else console.log("❌ Coder Failed:", filters.profession);

    if (filters.keywords && filters.keywords.includes('Travel')) console.log("✅ Trekking -> Travel");
    else console.log("❌ Trekking Failed:", filters.keywords);
}

verifyRegex();

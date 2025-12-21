
// Script to test AI Search logic logic without running full server
const { AIService } = require('../services/ai');

// Mock PG Client for simulation
const mockQuery = (sql: string, params: any[]) => {
    console.log("SQL EXEC:", sql);
    console.log("PARAMS:", params);
    // Return empty to simulate "No results" or mock data
    return { rows: [] };
};

async function testSearch(prompt: string) {
    console.log(`\n\n--- Testing Prompt: "${prompt}" ---`);
    const ai = new AIService();
    const filters = await ai.parseSearchQuery(prompt);
    console.log("Extracted Filters:", filters);

    // Simulate Build Logic
    // ... (Simplified logic verification)
    if (filters.profession) {
        console.log(`[Strict Mode] Profession Filter: '${filters.profession}' OR Synonyms: ${AIService.SYNONYMS[filters.profession] || 'None'}`);
    } else {
        console.log("[Strict Mode] No Profession Filter.");
    }
}

async function run() {
    await testSearch("I want a Software Engineer in Hyderabad");
    await testSearch("Looking for a Doctor who likes hiking");
    await testSearch("Someone tall and kind");
    await testSearch("Unicorn Trainer in Mars"); // Should result in Broad Search
}

run();

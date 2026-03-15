import { aiService } from './src/services/ai';

async function testLocalAI() {
    try {
        console.log("Starting Local AI test...");
        
        // Test parsing
        const promptParams = await aiService.parseUserPrompt("I am a software engineer looking for a kind partner who loves to travel and doesn't smoke.");
        console.log("Parsed Prompt Params:", JSON.stringify(promptParams, null, 2));

        // Test Embedding
        const text = "Software Developer who loves hiking";
        console.log(`Generating embedding for: "${text}"`);
        const embedding = await aiService.generateEmbedding(text);
        
        console.log(`Embedding Generated! Length: ${embedding.length}`);
        if (embedding.length === 384 && embedding[0] !== 0) {
            console.log("✅ Vector Embeddings are functionally active!");
        } else {
            console.log("❌ Embeddings array is empty or wrong size.", embedding.slice(0, 5));
        }

    } catch (e) {
        console.error("Test failed with exception:", e);
    }
    process.exit(0);
}

testLocalAI();

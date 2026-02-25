import { aiService } from './src/services/ai';

async function test() {
    try {
        console.log("Analzying mock text through Local AI Engine...");
        const result = await aiService.parseUserPrompt("I am a software engineer looking for a smart partner who loves family and traveling. Dealbreaker: smoking.");
        console.log("Local Heuristics Parse Result:", JSON.stringify(result, null, 2));

        console.log("\nGenerating AI embedding via Xenova Transformers...");
        const embed = await aiService.generateEmbedding("Software engineer looking for traveling partner.");
        console.log("Embedding Length:", embed.length, "(Must be 384)");
        console.log("First 3 values:", embed.slice(0, 3));
    } catch (e) {
        console.error("Test failed", e);
    } finally {
        process.exit(0);
    }
}
test();

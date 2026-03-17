/**
 * LifePartner AI Guru — Self-Hosted Local Model Service
 * ─────────────────────────────────────────────────────
 * Uses @xenova/transformers (already installed) to run a
 * local Flan-T5 instruction-tuned model for text generation.
 * Zero external API calls. Runs entirely on your server.
 *
 * Architecture:
 *   1. guruEngine → instant answers for all known matrimony topics (< 5ms)
 *   2. localGenerate → flan-t5-base for any other open-ended question (1-4s)
 */

import { pipeline, env } from '@xenova/transformers';

// Use local cache if model is already downloaded
env.allowLocalModels = true;
env.allowRemoteModels = true;  // Downloads once, cached forever

let generator: any = null;
let modelReady = false;
let modelLoading = false;

/**
 * Lazily initialize the local Flan-T5 text generation model.
 * Downloaded once and cached in /tmp/xenova-cache or similar.
 */
async function initModel() {
    if (modelReady || modelLoading) return;
    modelLoading = true;
    try {
        console.log('[LocalAI] Loading Flan-T5-base model (first time downloads ~250MB, cached after)...');
        generator = await pipeline(
            'text2text-generation',
            'Xenova/flan-t5-base',
            { quantized: true }  // Uses 8-bit compressed model for faster CPU inference
        );
        modelReady = true;
        modelLoading = false;
        console.log('[LocalAI] ✅ Flan-T5 model loaded and ready!');
    } catch (e) {
        modelLoading = false;
        console.error('[LocalAI] ❌ Failed to load local model:', e);
    }
}

// Begin warming up the model immediately on server start
initModel();

/**
 * Build a prompt for the local model.
 * Flan-T5 works best with instruction-style prompts.
 */
function buildPrompt(
    userMessage: string,
    userName: string,
    userAge: number | null,
    userGender: string | null,
    conversationContext: string
): string {
    const identity = `You are LifePartner AI Guru, a warm and expert Indian matrimony coach and relationship advisor.`;
    const userContext = `You are speaking with ${userName}${userAge ? `, who is ${userAge} years old` : ''}${userGender ? ` and identifies as ${userGender}` : ''}.`;
    const style = `Give specific, practical, warm, and culturally aware advice. Use emojis. Keep it under 100 words. Be encouraging.`;

    let prompt = `${identity} ${userContext} ${style}`;

    if (conversationContext) {
        prompt += `\n\nConversation so far:\n${conversationContext}`;
    }

    prompt += `\n\nUser asks: "${userMessage}"\n\nYour advice:`;
    return prompt;
}

/**
 * Format the last few messages from history into a context string.
 */
function buildContext(history: { role: string; content: string }[]): string {
    const recent = history.slice(-4); // Last 4 messages for context
    return recent
        .map(m => `${m.role === 'user' ? 'User' : 'Guru'}: ${m.content}`)
        .join('\n');
}

/**
 * Generate a response using the local Flan-T5 model.
 * Returns null if the model is not yet ready.
 */
export async function localGenerate(
    message: string,
    userName: string,
    userAge: number | null,
    userGender: string | null,
    history: { role: string; content: string }[]
): Promise<string | null> {
    if (!modelReady || !generator) {
        // Model still loading — caller should fall back to guruEngine
        return null;
    }

    try {
        const context = buildContext(history);
        const prompt = buildPrompt(message, userName, userAge, userGender, context);

        const output = await generator(prompt, {
            max_new_tokens: 150,
            temperature: 0.7,
            repetition_penalty: 1.3,
            do_sample: true,
        });

        const reply: string = output?.[0]?.generated_text?.trim() || '';

        if (!reply || reply.length < 10) return null;

        return reply;
    } catch (e) {
        console.error('[LocalAI] Generation error:', e);
        return null;
    }
}

export { modelReady };

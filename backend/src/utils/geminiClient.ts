export interface GeminiPart {
    text?: string;
    inlineData?: {
        mimeType: string;
        data: string;
    };
}

export interface GeminiContent {
    role: 'user' | 'model';
    parts: GeminiPart[];
}

export interface GeminiGenerateOptions {
    systemInstruction?: string;
    prompt?: string;
    contents?: GeminiContent[];
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: Record<string, any>;
    timeoutMs?: number;
    models?: string[];
}

export function isGeminiConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && !key.includes('your_') && key.length > 10);
}

/**
 * Shared Gemini API caller with automatic model fallback (`gemini-4-hydrogen` -> `gemini-2.5-flash`).
 * Pure HTTP with zero local RAM overhead.
 */
export async function callGeminiGenerate(options: GeminiGenerateOptions): Promise<{
    text: string | null;
    modelUsed?: string;
    blockedBySafety?: boolean;
    errorStatus?: number;
}> {
    if (!isGeminiConfigured()) {
        return { text: null };
    }

    const apiKey = process.env.GEMINI_API_KEY!;
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-4-hydrogen';
    const candidateModels = Array.from(
        new Set(options.models && options.models.length > 0 ? options.models : [primaryModel, 'gemini-2.5-flash'])
    );

    const contents: GeminiContent[] =
        options.contents && options.contents.length > 0
            ? options.contents
            : [{ role: 'user', parts: [{ text: options.prompt || '' }] }];

    const generationConfig: Record<string, any> = {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens ?? 1024,
    };
    if (options.responseMimeType) {
        generationConfig.responseMimeType = options.responseMimeType;
    }
    if (options.responseSchema) {
        generationConfig.responseSchema = options.responseSchema;
    }

    let lastStatus: number | undefined;

    for (const model of candidateModels) {
        try {
            const body: Record<string, any> = {
                contents,
                generationConfig,
            };
            if (options.systemInstruction) {
                body.system_instruction = { parts: [{ text: options.systemInstruction }] };
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(options.timeoutMs ?? 12000),
                }
            );

            if (!response.ok) {
                lastStatus = response.status;
                const errText = await response.text().catch(() => '');
                if (errText.includes('SAFETY') || errText.includes('HARM_CATEGORY')) {
                    return { text: null, modelUsed: model, blockedBySafety: true, errorStatus: response.status };
                }
                console.warn(`[Gemini:${model}] HTTP ${response.status}: ${errText.substring(0, 140)}`);
                continue;
            }

            const data: any = await response.json();
            const blockReason = data?.promptFeedback?.blockReason;
            const finishReason = data?.candidates?.[0]?.finishReason;
            if (blockReason === 'SAFETY' || finishReason === 'SAFETY') {
                return { text: null, modelUsed: model, blockedBySafety: true };
            }

            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && typeof text === 'string') {
                return { text: text.trim(), modelUsed: model };
            }
        } catch (err: any) {
            console.warn(`[Gemini:${model}] Request failed: ${err?.message || err}`);
        }
    }

    return { text: null, errorStatus: lastStatus };
}

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testNvidia() {
    console.log('\n🔑 NVIDIA_API_KEY present:', !!process.env.NVIDIA_API_KEY);
    console.log('   Key prefix:', process.env.NVIDIA_API_KEY?.substring(0, 12) + '...');
    console.log('\n📡 Calling NVIDIA Gemma-4-31B...\n');

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
            model: 'google/gemma-4-31b-it',
            messages: [
                { role: 'system', content: 'You are a helpful assistant. Return JSON only.' },
                { role: 'user', content: '{"name":"Test","age":25}. Give me a profile roast in JSON: {"roast":"...","score":5,"tips":["...","...","..."]}' }
            ],
            max_tokens: 300,
            temperature: 0.7,
            stream: false
        }),
        signal: AbortSignal.timeout(30000)
    });

    console.log('HTTP Status:', res.status, res.statusText);
    const body = await res.text();
    console.log('Response Body:\n', body.substring(0, 1000));
}

testNvidia().catch(console.error);

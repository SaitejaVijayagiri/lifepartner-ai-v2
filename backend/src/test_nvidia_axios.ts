import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";

const headers = {
  "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
  "Accept": "application/json",
  "Content-Type": "application/json"
};

const payload = {
  "model": "google/gemma-4-31b-it",
  "messages": [
      { role: 'system', content: 'You are a helpful assistant. Return JSON only.' },
      { role: 'user', content: '{"name":"Test","age":25}. Give me a profile roast in JSON: {"roast":"...","score":5,"tips":["...","...","..."]}' }
  ],
  "max_tokens": 300,
  "temperature": 0.7,
  "stream": false
};

async function testNvidiaAxios() {
    console.log('📡 Calling NVIDIA Gemma-4-31B via Axios...\n');
    try {
        const response = await axios.post(invokeUrl, payload, { headers: headers, timeout: 20000 });
        console.log('HTTP Status:', response.status);
        console.log('Response Body:\n', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Network Error:', error.message);
        }
    }
}

testNvidiaAxios().catch(console.error);

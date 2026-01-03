
import axios from 'axios';

async function checkHealth() {
    try {
        const res = await axios.get('http://localhost:4000/');
        console.log("✅ Server Health Check Passed:", res.data);
    } catch (e: any) {
        console.error("❌ Server Health Check Failed:", e.message);
        if (e.code === 'ECONNREFUSED') {
            console.error("   ⚠️ The backend server is NOT running. Please start it with 'npm run dev' or 'npx ts-node src/server.ts'");
        }
    }
}

checkHealth();

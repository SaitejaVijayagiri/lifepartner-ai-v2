import axios from 'axios';

async function checkModels() {
    try {
        const res = await axios.get('https://integrate.api.nvidia.com/v1/models', {
            headers: {
                'Authorization': 'Bearer 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'
            },
            timeout: 10000
        });
        console.log("Models found:", res.data.data.map((m: any) => m.id).join(', '));
    } catch (e: any) {
        console.error("Models fetch failed:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
        }
    }
}

checkModels();

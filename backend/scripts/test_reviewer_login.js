const fetch = require('node-fetch');

async function testLogin() {
    console.log("Testing Reviewer Login on Live Production Backend...");
    
    // Test 1: Production API
    try {
        const res = await fetch('https://lifepartnerai.in/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'reviewer@lifepartnerai.in',
                password: 'TestPassword123!'
            })
        });

        const data = await res.json();
        console.log("Production API Login Status:", res.status);
        console.log("Production API Response:", data);
    } catch (e) {
        console.error("Production API Error:", e.message);
    }
}

testLogin();

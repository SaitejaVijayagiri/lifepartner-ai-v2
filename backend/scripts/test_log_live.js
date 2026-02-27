const https = require('https');

const data = JSON.stringify({
    email: 'saitejavijayagiri123@gmail.com',
    password: 'Saitejauday@0102'
});

const options = {
    hostname: 'lifepartner-ai.onrender.com', // Found from the console logs provided by user
    port: 443,
    path: '/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Body:', responseData);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();

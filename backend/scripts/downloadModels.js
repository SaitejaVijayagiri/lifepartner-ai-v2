const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, '../public/models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

// Redirects can be tricky with unpkg, so we'll just use raw github from the original author
const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const files = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1'
];

async function downloadFile(filename) {
    const dest = path.join(modelsDir, filename);
    const url = baseUrl + filename;

    console.log(`Downloading ${filename}...`);
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // handle redirect
                https.get(response.headers.location, (res2) => {
                    res2.pipe(file);
                    res2.on('end', () => resolve());
                });
            } else if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Saved ${filename}`);
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function main() {
    console.log('Downloading Face-API models...');
    for (const file of files) {
        try {
            await downloadFile(file);
        } catch (e) {
            console.error(e);
        }
    }
    console.log('Model download complete.');
}

main();

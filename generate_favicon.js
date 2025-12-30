
const fs = require('fs');
const path = require('path');

// Basic script: Copy icon.png to public/favicon.ico
// Ideally we should resize/convert, but modern browsers support PNG favicons
// and Google accepts them too if linked correctly.
// For compatibility, we just copy it.

const src = 'apps/web/app/icon.png';
const dest = 'apps/web/public/favicon.ico';

if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} to ${dest}`);
} else {
    console.error("Source icon.png not found!");
}

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

async function testUpload() {
    console.log("Cloud:", process.env.CLOUDINARY_CLOUD_NAME);
    // 1px transparent gif
    const base64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    try {
        const res = await cloudinary.uploader.upload(base64, { timeout: 60000 });
        console.log("Success:", res.secure_url);
    } catch (e) {
        console.error("Error:", e);
    }
}
testUpload();

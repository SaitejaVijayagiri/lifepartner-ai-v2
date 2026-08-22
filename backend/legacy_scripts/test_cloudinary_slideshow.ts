import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

async function test() {
    console.log("Generating URL...");
    // Suppose we have two uploaded images: sample1 and sample2
    // We want a 3s duration for the base image, then splice sample2 for 3s with a 1s fade.
    
    // Using cloudinary SDK URL helper:
    const url = cloudinary.url('sample', {
        resource_type: 'video', // force video output
        format: 'mp4',
        transformation: [
            { width: 720, height: 1280, crop: 'fill' },
            { duration: 3 },
            { overlay: 'cld-sample-2' }, // second image
            { flags: 'splice', effect: 'transition:name_fade;du_1' },
            { flags: 'layer_apply' }
        ]
    });
    
    console.log(url);
}

test();

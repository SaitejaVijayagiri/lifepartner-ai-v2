const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apkPath = path.join(__dirname, '../public/LifePartner.apk');
const gradleApkPath = path.join(__dirname, '../android/app/build/outputs/apk/release/app-release.apk');

// Always copy the clean, zipaligned, v1+v2 signed APK from Gradle release build
if (fs.existsSync(gradleApkPath)) {
    fs.copyFileSync(gradleApkPath, apkPath);
    console.log("✅ Successfully copied clean Gradle v1+v2 signed Release APK to public/LifePartner.apk!");
} else {
    console.log("Gradle release APK not found at", gradleApkPath);
}

// Locate apksigner if available for verification
try {
    const apksignerPath = process.env.LOCALAPPDATA 
        ? path.join(process.env.LOCALAPPDATA, 'Android/Sdk/build-tools/36.0.0/apksigner.bat') 
        : 'apksigner';

    if (fs.existsSync(apksignerPath)) {
        console.log("Verifying APK signature with apksigner...");
        const output = execSync(`& "${apksignerPath}" verify --verbose public\\LifePartner.apk`, {
            cwd: path.join(__dirname, '..'),
            shell: 'powershell.exe',
            encoding: 'utf-8'
        });
        console.log(output);
    }
} catch (e) {
    console.log("APKSigner verification status:", e.message || String(e));
}

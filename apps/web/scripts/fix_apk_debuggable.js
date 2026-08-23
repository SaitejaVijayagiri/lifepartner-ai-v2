const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const unzipper = require('zlib');

// Read APK zip file
const apkPath = path.join(__dirname, '../public/LifePartner.apk');
const backupPath = path.join(__dirname, '../public/LifePartner_backup.apk');

console.log("Reading APK for debuggable byte patch...");
const apkBuffer = fs.readFileSync(apkPath);

// Search for the binary manifest debuggable pattern
// In Android binary XML:
// Resource ID 0x0101000f (debuggable) -> Type 0x12000008 (Boolean) -> Value 0xFFFFFFFF (true)
// We patch 0xFFFFFFFF (true) -> 0x00000000 (false)

let patchCount = 0;
const debuggableAttrBytes = Buffer.from([0x0f, 0x00, 0x01, 0x01]);

for (let i = 0; i < apkBuffer.length - 20; i++) {
    if (apkBuffer[i] === 0x0f && apkBuffer[i+1] === 0x00 && apkBuffer[i+2] === 0x01 && apkBuffer[i+3] === 0x01) {
        console.log(`Found debuggable attribute marker at byte offset 0x${i.toString(16)}`);
        
        // Look 8-12 bytes ahead for 0xFFFFFFFF (true)
        for (let j = i + 4; j <= i + 16; j++) {
            if (apkBuffer[j] === 0xff && apkBuffer[j+1] === 0xff && apkBuffer[j+2] === 0xff && apkBuffer[j+3] === 0xff) {
                console.log(`Patching debuggable true (0xFFFFFFFF) -> false (0x00000000) at 0x${j.toString(16)}`);
                apkBuffer[j] = 0x00;
                apkBuffer[j+1] = 0x00;
                apkBuffer[j+2] = 0x00;
                apkBuffer[j+3] = 0x00;
                patchCount++;
            }
        }
    }
}

if (patchCount > 0) {
    fs.writeFileSync(apkPath, apkBuffer);
    console.log(`Successfully patched ${patchCount} debuggable flag(s) in APK!`);
    
    // Resign APK
    console.log("Resigning APK with release key...");
    const cmd = `& "C:\\Program Files\\Java\\jdk-21\\bin\\jarsigner.exe" -sigalg SHA256withRSA -digestalg SHA-256 -keystore android\\release.keystore -storepass LifePartner123! -keypass LifePartner123! public\\LifePartner.apk releasekey`;
    execSync(cmd, { cwd: path.join(__dirname, '..'), shell: 'powershell.exe', stdio: 'inherit' });
    console.log("✅ Signed Release APK ready at public/LifePartner.apk!");
} else {
    console.log("No debuggable true flags found in raw APK search buffer. Resigning anyway...");
    const cmd = `& "C:\\Program Files\\Java\\jdk-21\\bin\\jarsigner.exe" -sigalg SHA256withRSA -digestalg SHA-256 -keystore android\\release.keystore -storepass LifePartner123! -keypass LifePartner123! public\\LifePartner.apk releasekey`;
    execSync(cmd, { cwd: path.join(__dirname, '..'), shell: 'powershell.exe', stdio: 'inherit' });
}

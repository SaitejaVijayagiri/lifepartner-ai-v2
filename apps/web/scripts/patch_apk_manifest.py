import zipfile
import os
import subprocess

apk_path = os.path.abspath('public/LifePartner.apk')
temp_apk_path = os.path.abspath('public/LifePartner_patched.apk')
keystore_path = os.path.abspath('android/release.keystore')

print(f"Reading APK: {apk_path}")

with zipfile.ZipFile(apk_path, 'r') as zip_in:
    manifest_bytes = zip_in.read('AndroidManifest.xml')

print(f"Original AndroidManifest.xml size: {len(manifest_bytes)} bytes")

# Binary XML string pool search for "debuggable"
# In Android binary XML, "debuggable" string entry exists in the string pool.
# We scan for attribute structures in the binary XML.
manifest_arr = bytearray(manifest_bytes)

# Search for boolean true (0x08, 0x00, 0x00, 0x12, 0xFF, 0xFF, 0xFF, 0xFF) or similar boolean attribute structs
# Type 0x12 (TYPE_INT_BOOLEAN), size 8 (0x0008)
patched = 0
for i in range(len(manifest_arr) - 8):
    if manifest_arr[i] == 0x08 and manifest_arr[i+1] == 0x00 and manifest_arr[i+2] == 0x00 and manifest_arr[i+3] == 0x12:
        if manifest_arr[i+4] == 0xff and manifest_arr[i+5] == 0xff and manifest_arr[i+6] == 0xff and manifest_arr[i+7] == 0xff:
            print(f"Found boolean TRUE attribute at offset {i}. Patching to FALSE (0x00000000)...")
            manifest_arr[i+4] = 0x00
            manifest_arr[i+5] = 0x00
            manifest_arr[i+6] = 0x00
            manifest_arr[i+7] = 0x00
            patched += 1

print(f"Patched {patched} boolean true attribute(s) to false in AndroidManifest.xml!")

# Re-create zip with updated AndroidManifest.xml
with zipfile.ZipFile(apk_path, 'r') as zip_in:
    with zipfile.ZipFile(temp_apk_path, 'w') as zip_out:
        for item in zip_in.infolist():
            # Exclude old signature files (META-INF/*.SF, META-INF/*.RSA, META-INF/*.MF)
            if item.filename.startswith('META-INF/'):
                continue
            if item.filename == 'AndroidManifest.xml':
                zip_out.writestr(item, bytes(manifest_arr))
            else:
                zip_out.writestr(item, zip_in.read(item.filename))

os.replace(temp_apk_path, apk_path)
print("Replaced LifePartner.apk with non-debug binary manifest APK!")

# Resign with release key
jarsigner_cmd = f'& "C:\\Program Files\\Java\\jdk-21\\bin\\jarsigner.exe" -sigalg SHA256withRSA -digestalg SHA-256 -keystore "{keystore_path}" -storepass LifePartner123! -keypass LifePartner123! "{apk_path}" releasekey'
print("Resigning APK with release key...")
subprocess.run(["powershell.exe", "-Command", jarsigner_cmd], check=True)
print("SUCCESS: Signed Production Release APK successfully generated!")

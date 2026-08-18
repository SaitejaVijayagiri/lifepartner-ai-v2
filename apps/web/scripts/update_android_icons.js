const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceIcon = path.join(__dirname, '../public/icon-512x512.png');
const resDir = path.join(__dirname, '../android/app/src/main/res');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateIcons() {
  console.log('Generating Android launcher icons from:', sourceIcon);
  
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon does not exist:', sourceIcon);
    process.exit(1);
  }

  for (const [folder, size] of Object.entries(sizes)) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const filesToGenerate = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];

    for (const filename of filesToGenerate) {
      const targetPath = path.join(targetFolder, filename);
      // Delete if existing before writing
      if (fs.existsSync(targetPath)) {
        try { fs.unlinkSync(targetPath); } catch(e) {}
      }
      await sharp(sourceIcon)
        .resize(size, size)
        .toFile(targetPath);
      console.log(`Generated ${folder}/${filename} (${size}x${size})`);
    }
  }

  console.log('✅ Android launcher icons updated successfully!');
}

generateIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});

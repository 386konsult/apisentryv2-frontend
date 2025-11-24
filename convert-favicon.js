/**
 * Simple script to convert SVG favicon to ICO format
 * Requires: npm install sharp
 * Usage: node convert-favicon.js
 */

const fs = require('fs');
const path = require('path');

async function convertFavicon() {
  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.log('Installing sharp...');
      const { execSync } = require('child_process');
      execSync('npm install sharp --save-dev', { stdio: 'inherit' });
      sharp = require('sharp');
    }

    const svgPath = path.join(__dirname, 'public', 'favicon.svg');
    const icoPath = path.join(__dirname, 'public', 'favicon.ico');

    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);

    // Convert to ICO (multiple sizes: 16x16, 32x32, 48x48)
    await sharp(svgBuffer)
      .resize(16, 16)
      .toFile(icoPath.replace('.ico', '_16.png'));

    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(icoPath.replace('.ico', '_32.png'));

    await sharp(svgBuffer)
      .resize(48, 48)
      .toFile(icoPath.replace('.ico', '_48.png'));

    console.log('✅ Favicon converted successfully!');
    console.log('Note: Sharp creates PNG files. For true ICO format, use an online converter:');
    console.log('   https://convertio.co/svg-ico/');
    console.log('   https://cloudconvert.com/svg-to-ico');
    console.log('\nOr use ImageMagick: convert favicon.svg -resize 16x16 -resize 32x32 -resize 48x48 favicon.ico');
  } catch (error) {
    console.error('Error converting favicon:', error.message);
    console.log('\nAlternative: Use an online converter:');
    console.log('1. Go to https://convertio.co/svg-ico/');
    console.log('2. Upload public/favicon.svg');
    console.log('3. Download and replace public/favicon.ico');
  }
}

convertFavicon();


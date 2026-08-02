const sharp = require('sharp');
const fs = require('fs');

const svgStr = fs.readFileSync('branding/master.svg', 'utf8');
const svgBuffer = Buffer.from(svgStr);

sharp(svgBuffer)
  .resize(512, 512, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
  .png()
  .toFile('assets/icon.png')
  .then(() => console.log('Icon done'))
  .catch(console.error);

sharp(svgBuffer)
  .resize(512, 512, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
  .png()
  .toFile('assets/splash.png')
  .then(() => console.log('Splash done'))
  .catch(console.error);

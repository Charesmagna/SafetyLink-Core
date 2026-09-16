const sharp = require('sharp');
sharp('public/official_safetylink_logo.svg')
  .resize(1024, 1024)
  .png()
  .toFile('assets/icon.png')
  .then(() => console.log('Icon generated!'))
  .catch(err => console.error(err));

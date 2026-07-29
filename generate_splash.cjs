const sharp = require('sharp');
sharp('public/official_safetylink_logo.svg')
  .resize(2732, 2732)
  .png()
  .toFile('assets/splash.png')
  .then(() => console.log('Splash generated!'))
  .catch(err => console.error(err));

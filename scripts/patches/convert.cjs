const sharp = require('sharp');
sharp('icon.svg').png().toFile('assets/icon.png').then(() => {
  console.log('Icon generated');
});
sharp('icon.svg').png().toFile('assets/splash.png').then(() => {
  console.log('Splash generated');
});

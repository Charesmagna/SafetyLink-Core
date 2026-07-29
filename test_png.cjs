const Jimp = require('jimp');
async function test() {
  try {
    const img = await Jimp.read('android/app/src/main/res/mipmap-ldpi/ic_launcher_background.png');
    console.log("Success! size:", img.bitmap.width, img.bitmap.height);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
test();

import sharp from 'sharp';

async function preview(f) {
  try {
    console.log(`\n--- ${f} ---`);
    const img = sharp(f);
    const metadata = await img.metadata();
    console.log(`Dimensions: ${metadata.width}x${metadata.height}`);
    const resized = await img.resize(40, 20, { fit: 'fill' }).raw().toBuffer();
    let ascii = '';
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 40; x++) {
        const idx = (y * 40 + x) * 3;
        const r = resized[idx], g = resized[idx+1], b = resized[idx+2];
        const brightness = (r+g+b)/3;
        if (brightness > 240) ascii += ' ';
        else if (brightness > 180) ascii += '.';
        else if (brightness > 100) ascii += '+';
        else if (brightness > 40) ascii += '*';
        else ascii += '#';
      }
      ascii += '\n';
    }
    console.log(ascii);
  } catch (e) {
    console.error(e);
  }
}
preview('IMG_20260721_115013.jpg');
preview('Polish_20260620_014530309.jpg');

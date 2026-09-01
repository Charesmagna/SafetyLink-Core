import sharp from 'sharp';

async function makeTransparent(inputBuffer, width, height, outfile) {
  const raw = await sharp(inputBuffer).raw().toBuffer();
  const rgba = Buffer.alloc(width * height * 4);
  
  for (let i = 0; i < width * height; i++) {
    const r = raw[i * 3];
    const g = raw[i * 3 + 1];
    const b = raw[i * 3 + 2];
    
    // Calculate distance to white
    const dist = Math.sqrt(Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2));
    
    if (dist < 40) {
      rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = 0;
    } else if (dist < 100) {
      const alpha = Math.floor(((dist - 40) / 60) * 255);
      rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = alpha;
    } else {
      rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = 255;
    }
  }
  
  await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toFile(outfile);
}

async function run() {
  const file = 'public/panic-button.jpg'; // 1344x2208
  const handBuf = await sharp(file).toBuffer();
  await makeTransparent(handBuf, 1344, 2208, 'public/panic-button-smooth.png');
  console.log("Original single button made transparent and saved.");
}
run();

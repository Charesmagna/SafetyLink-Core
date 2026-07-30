const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const dirPath = "android/app/src/main/res/mipmap-ldpi";

if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
} else {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        if (file === "ic_launcher_round.png") {
            try {
                const buf = fs.readFileSync(filePath);
                PNG.sync.read(buf);
                continue;
            } catch (e) {
                // Invalid
            }
        }
        fs.unlinkSync(filePath);
    }
}

const targets = ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_background.png", "ic_launcher_foreground.png"];

for (const target of targets) {
    const p = path.join(dirPath, target);
    if (!fs.existsSync(p)) {
        const png = new PNG({ width: 36, height: 36, colorType: 6 });
        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idx = (png.width * y + x) << 2;
                png.data[idx] = 10;
                png.data[idx + 1] = 15;
                png.data[idx + 2] = 30;
                png.data[idx + 3] = 255;
            }
        }
        const buffer = PNG.sync.write(png);
        fs.writeFileSync(p, buffer);
    }
}
console.log("Done generating PNGs");

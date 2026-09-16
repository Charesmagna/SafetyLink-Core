const fs = require('fs');
const path = require('path');

const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(b64, 'base64');

const resDir = path.join('android', 'app', 'src', 'main', 'res');

if (fs.existsSync(resDir)) {
  const dirs = fs.readdirSync(resDir);
  for (const d of dirs) {
    if (d.startsWith('mipmap')) {
      const fullDir = path.join(resDir, d);
      const files = fs.readdirSync(fullDir);
      for (const f of files) {
        if (f.endsWith('.png')) {
          const fp = path.join(fullDir, f);
          fs.writeFileSync(fp, buffer);
          console.log(`Replaced ${fp}`);
        }
      }
    }
  }
}

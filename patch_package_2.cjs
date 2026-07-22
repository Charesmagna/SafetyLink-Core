const fs = require('fs');
let data = JSON.parse(fs.readFileSync('package.json', 'utf8'));
data.scripts.postinstall = "node patch_audio_recorder.cjs";
fs.writeFileSync('package.json', JSON.stringify(data, null, 2));

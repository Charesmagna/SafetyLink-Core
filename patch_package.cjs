const fs = require('fs');
let data = JSON.parse(fs.readFileSync('package.json', 'utf8'));
data.overrides = {
  "@capgo/capacitor-audio-recorder": {
    "@capacitor/core": "$@capacitor/core"
  }
};
fs.writeFileSync('package.json', JSON.stringify(data, null, 2));

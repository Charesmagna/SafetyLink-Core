const fs = require('fs');
const file = 'node_modules/@capgo/capacitor-audio-recorder/android/build.gradle';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/classpath 'com.android.tools.build:gradle:[\d.]+'/g, "classpath 'com.android.tools.build:gradle:8.2.1'");
  fs.writeFileSync(file, content);
  console.log('Patched @capgo/capacitor-audio-recorder gradle version');
}

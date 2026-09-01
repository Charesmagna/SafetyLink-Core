import fs from 'fs';
const path = 'android/app/build.gradle';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');
content = content.replace(/jvmTarget = '21'/g, "jvmTarget = '17'");

fs.writeFileSync(path, content);

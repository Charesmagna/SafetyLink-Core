const fs = require('fs');
let content = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

const target = /    - name: Grant execute permission for gradlew\s+run: chmod \+x android\/gradlew/m;
const injection = `    - name: Grant execute permission for gradlew
      run: chmod +x android/gradlew
    - name: Clean Gradle Cache
      run: rm -rf ~/.gradle/caches`;

content = content.replace(target, injection);
fs.writeFileSync('.github/workflows/build-apk.yml', content);

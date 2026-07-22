const fs = require('fs');
let content = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

const target = /    - name: Clean Gradle Cache\n      run: rm -rf ~\/.gradle\/caches/;
const injection = `    - name: Clean Gradle Cache
      run: rm -rf ~/.gradle/caches && rm -rf \${{ github.workspace }}/.gradle/caches`;

content = content.replace(target, injection);
fs.writeFileSync('.github/workflows/build-apk.yml', content);

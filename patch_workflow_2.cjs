const fs = require('fs');
let content = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

const target = /jobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:/;
const injection = `jobs:
  build:
    runs-on: ubuntu-latest
    env:
      GRADLE_USER_HOME: \${{ github.workspace }}/.gradle
    steps:`;

content = content.replace(target, injection);
fs.writeFileSync('.github/workflows/build-apk.yml', content);

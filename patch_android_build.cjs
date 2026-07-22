const fs = require('fs');

// 1. Update kotlin version
let buildGradle = fs.readFileSync('android/build.gradle', 'utf8');
buildGradle = buildGradle.replace(/ext\.kotlin_version\s*=\s*['"]1\.9\.[0-9]+['"]/, "ext.kotlin_version = '1.9.24'");
fs.writeFileSync('android/build.gradle', buildGradle);

// 2. Add gradle properties
let gradleProps = fs.readFileSync('android/gradle.properties', 'utf8');
if (!gradleProps.includes('org.gradle.daemon=false')) {
  gradleProps += '\norg.gradle.daemon=false\norg.gradle.parallel=false\norg.gradle.caching=false\n';
  fs.writeFileSync('android/gradle.properties', gradleProps);
}

// 3. Update GH workflow
let workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
if (!workflow.includes('Stop Daemons')) {
  workflow = workflow.replace(/- name: Clean Gradle Cache/g, "- name: Stop Daemons\n      run: cd android && ./gradlew --stop || true\n    - name: Clean Gradle Cache");
  fs.writeFileSync('.github/workflows/build-apk.yml', workflow);
}
console.log('Patch complete.');

const fs = require('fs');
let code = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');

code = code.replace(
    /    - name: Build with Gradle \(Release\)\n      working-directory: \.\/android\n      run: \.\/gradlew assembleRelease --init-script \.\.\/init\.gradle --no-daemon --no-parallel --no-build-cache\n/,
    ''
);

code = code.replace(
    /    - name: Upload Signed Release APK\n      uses: actions\/upload-artifact@v4\n      with:\n        name: app-release\n        path: android\/app\/build\/outputs\/apk\/release\/\*\.apk\n/,
    ''
);

fs.writeFileSync('.github/workflows/build-apk.yml', code);

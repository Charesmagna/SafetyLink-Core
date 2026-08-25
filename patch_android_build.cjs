const fs = require('fs');
let code = fs.readFileSync('android/build.gradle', 'utf8');

code = code.replace(/subprojects \{\s*afterEvaluate \{[\s\S]*?\}\s*\}/, `subprojects {
    plugins.withId('com.android.library') {
        if (project.name == 'capacitor-voice-recorder') {
            project.android {
                namespace = 'com.tchvu3.capacitorvoicerecorder'
            }
        }
    }
}`);

fs.writeFileSync('android/build.gradle', code);

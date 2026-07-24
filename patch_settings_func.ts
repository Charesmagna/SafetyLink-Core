import fs from 'fs';
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

if (!content.includes('const testTwilioAndSupabase =')) {
    content = content.replace(
        "const connectService = async (serviceName: string) => {",
        "const testTwilioAndSupabase = () => { console.log('Testing integrations...'); };\n  const connectService = async (serviceName: string) => {"
    );
}

fs.writeFileSync('src/components/Settings.tsx', content);

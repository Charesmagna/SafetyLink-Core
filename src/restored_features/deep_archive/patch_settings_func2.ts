import fs from 'fs';
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

if (!content.includes('const connectService =')) {
    content = content.replace(
        "const [moyaEnabled, setMoyaEnabled] = useState(false);",
        "const [moyaEnabled, setMoyaEnabled] = useState(false);\n  const connectService = (s: string) => console.log('Connect:', s);\n  const testTwilioAndSupabase = () => console.log('Test');"
    );
}

fs.writeFileSync('src/components/Settings.tsx', content);

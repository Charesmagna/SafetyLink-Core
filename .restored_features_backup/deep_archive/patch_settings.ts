import fs from 'fs';
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

if (!content.includes('const [moyaEnabled, setMoyaEnabled] = useState')) {
    content = content.replace(
        "const [selectedJoinRole, setSelectedJoinRole] = useState('Community Member');",
        "const [selectedJoinRole, setSelectedJoinRole] = useState('Community Member');\n  const [moyaEnabled, setMoyaEnabled] = useState(false);\n  const [turnApiToken, setTurnApiToken] = useState('');"
    );
}

fs.writeFileSync('src/components/Settings.tsx', content);

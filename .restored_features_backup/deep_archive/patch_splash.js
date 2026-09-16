import fs from 'fs';
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    'onEnded={() => setShowSplash(false)}',
    'onEnded={() => setShowSplash(false)} onError={() => setShowSplash(false)}'
);

if (!content.includes('setTimeout(() => setShowSplash(false)')) {
    content = content.replace(
        'const [showSplash, setShowSplash] = useState(true);',
        'const [showSplash, setShowSplash] = useState(true);\n  useEffect(() => { const timer = setTimeout(() => setShowSplash(false), 3000); return () => clearTimeout(timer); }, []);'
    );
}

fs.writeFileSync(path, content);

const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// Remove the wrongly inserted image
code = code.replace(/<motion\.img[\s\S]*?pointerEvents:\s*'none'[\s\S]*?\}\}*[\s\S]*?\/>/g, '');

// Insert it properly outside the phone mock
const newElement = `
      <motion.img 
        src="/panic-button.jpg" 
        alt="Panic Button" 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{
          position: 'absolute',
          left: '-80%', 
          top: '10%',
          width: '120%',
          zIndex: 10,
          mixBlendMode: 'screen',
          pointerEvents: 'none'
        }}
      />
`;

// we find <div className="hero-visual"> and insert it after
code = code.replace(/(<div className="hero-visual">)/, `$1${newElement}`);

fs.writeFileSync('src/components/LandingPage.tsx', code);

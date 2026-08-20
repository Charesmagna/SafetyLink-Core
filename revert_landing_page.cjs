const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /\{\/\* Hand holding keyfob \*\/\}[\s\S]*?pointerEvents:\s*'none'\s*\}\}\s*\/>/g;

const newElement = `
      {/* Original Single Panic Button */}
      <motion.img
        src="/panic-button-smooth.png"
        alt="Panic Button Keyfob"
        initial={{ opacity: 0, scale: 0.9, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        style={{
          position: 'absolute',
          left: '-25%',
          bottom: '5%',
          width: '55%',
          maxWidth: '220px',
          zIndex: 20,
          filter: 'drop-shadow(20px 30px 40px rgba(0,0,0,0.9))',
          pointerEvents: 'none'
        }}
      />
`;

code = code.replace(regex, newElement.trim());
fs.writeFileSync('src/components/LandingPage.tsx', code);

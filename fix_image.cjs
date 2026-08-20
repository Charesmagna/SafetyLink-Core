const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /<motion\.img\s+src="\/panic-button\.jpg"[\s\S]*?pointerEvents:\s*'none'\s*\}\}\s*\/>/g;

const newElement = `
      <motion.img
        src="/panic-button.png"
        alt="Panic Button Keyfob"
        initial={{ opacity: 0, scale: 0.9, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        style={{
          position: 'absolute',
          left: '-25%',
          bottom: '5%',
          width: '50%',
          maxWidth: '160px',
          zIndex: 20,
          filter: 'drop-shadow(15px 25px 35px rgba(0,0,0,0.8))',
          pointerEvents: 'none'
        }}
      />
`;

code = code.replace(regex, newElement.trim());
fs.writeFileSync('src/components/LandingPage.tsx', code);

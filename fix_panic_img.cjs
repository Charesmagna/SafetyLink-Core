const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const regex = /<motion\.div[\s\S]*?SafetyLink Hardware\s*<\/div>\s*<\/motion\.div>/g;

const newElement = `
      <motion.img
        src="/panic-button.jpg"
        alt="Panic Button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{
          position: 'absolute',
          left: '-40%',
          bottom: '-5%',
          width: '50%',
          maxWidth: '220px',
          zIndex: 20,
          mixBlendMode: 'screen', // This will make the black background of the image transparent
          filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))',
          pointerEvents: 'none'
        }}
      />
`;

code = code.replace(regex, newElement.trim());
fs.writeFileSync('src/components/LandingPage.tsx', code);

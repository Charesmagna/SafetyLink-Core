const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// The user wants the panic button next to the panel/dash
// I'll add an img element right after <div className="phone-mock">...</div>

const phoneMockRegex = /(<div className="phone-mock">[\s\S]*?<\/div>\s*<\/div>)/;

const newElement = `
      <motion.img 
        src="/panic-button.jpg" 
        alt="Panic Button" 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{
          position: 'absolute',
          left: '-60%', // Place to the left of the phone mockup
          top: '20%',
          width: '80%',
          maxWidth: '300px',
          zIndex: 10,
          mixBlendMode: 'screen', // Cuts out black background if it's black
          filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))',
          pointerEvents: 'none'
        }}
      />
`;

code = code.replace(phoneMockRegex, `$1\n${newElement}`);

fs.writeFileSync('src/components/LandingPage.tsx', code);

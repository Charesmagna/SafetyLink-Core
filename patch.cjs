const fs = require('fs');
const path = './src/components/PanicButton.tsx';
let code = fs.readFileSync(path, 'utf8');

const injection = `
      {showDistressVideo && (
        <DistressVideoStream 
          callerId={1000} 
          calleeId={2000} 
          onCallEnd={() => setShowDistressVideo(false)}
        />
      )}
`;

// Insert right before the last </motion.div>
const lastIndex = code.lastIndexOf('</motion.div>');
if (lastIndex !== -1) {
    code = code.slice(0, lastIndex) + injection + code.slice(lastIndex);
    fs.writeFileSync(path, code);
    console.log('Patched successfully');
} else {
    console.log('Could not find closing motion.div');
}

const fs = require('fs');
let code = fs.readFileSync('src/components/KlevaBot.tsx', 'utf8');

code = code.replace(
`  // Auto scroll to bottom
  useEffect(() => {`,
`  // Speak greeting when opened
  useEffect(() => {
    if (isOpen && voiceEnabled) {
      getLizzyProvider().speak(messages[0].text).catch(console.error);
    } else if (!isOpen) {
      getLizzyProvider().cancel();
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {`
);

fs.writeFileSync('src/components/KlevaBot.tsx', code);

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace globally "} catch" where it's a syntax error.
// The easiest is to revert `} catch` back to `});` where it doesn't match `} catch (e) {`
content = content.replace(/\} catch(?! \()/g, "});");
fs.writeFileSync(file, content);

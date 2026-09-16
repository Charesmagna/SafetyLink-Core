const fs = require('fs');
const path = 'safetylink-web/worker/index.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /const apiKey = c.env.GEMINI_API_KEY;/;
const replacement = `const apiKey = c.env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
    console.log("Patched successfully!");
} else {
    console.log("Regex not found");
}

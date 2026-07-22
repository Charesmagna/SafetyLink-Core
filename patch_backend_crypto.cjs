const fs = require('fs');
const file = 'standalone-backend/server.js';
let content = fs.readFileSync(file, 'utf8');

const cryptoImports = `
import crypto from 'crypto';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // Must be 256 bits (32 chars hex)
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
`;

content = content.replace('import axios from \'axios\';', 'import axios from \'axios\';\n' + cryptoImports);
content = content.replace(/ocPassword \} = await createOCUser/g, 'ocPassword: rawOcPassword } = await createOCUser');
content = content.replace(/ocPassword \} \}\)/g, 'ocPassword: encrypt(rawOcPassword) } })');
fs.writeFileSync(file, content);

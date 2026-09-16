const fs = require('fs');

const targetFile = 'src/components/landing/Platform.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

if (!content.includes('import dispatchImage')) {
    // Add imports after the last import statement
    content = content.replace(
        /import \{ ASSETS \} from '\.\.\/\.\.\/utils\/cloudinary';/,
        \`import { ASSETS } from '../../utils/cloudinary';
import dispatchImage from '../../assets/images/regenerated_image_1789423374103.jpg';
import blandAiImage from '../../assets/images/regenerated_image_1789423376023.jpg';\`
    );
}

// Replace references
content = content.replace(
    /<img src=\{ASSETS\.dispatchUi\}/g,
    \`<img src={dispatchImage}\`
);

content = content.replace(
    /<img src=\{ASSETS\.blandAi\}/g,
    \`<img src={blandAiImage}\`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Patched Platform.tsx');

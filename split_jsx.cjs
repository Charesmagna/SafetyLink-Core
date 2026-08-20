const fs = require('fs');
const jsx = fs.readFileSync('jsx.txt', 'utf8');

function extractSection(id) {
    const start = jsx.indexOf(`<section id="${id}">`);
    if (start === -1) return '';
    let openCount = 0;
    let end = -1;
    for (let i = start; i < jsx.length; i++) {
        if (jsx.startsWith('<section', i) || jsx.startsWith('<div', i)) openCount++;
        else if (jsx.startsWith('</section>', i) || jsx.startsWith('</div>', i)) openCount--;
        
        if (openCount === 0 && jsx.startsWith('</section>', i)) {
            end = i + '</section>'.length;
            break;
        }
    }
    return jsx.substring(start, end);
}

const hero = extractSection('hero');
const why = extractSection('why');
const platform = extractSection('platform');
const klev = extractSection('klev');
const pricing = extractSection('pricing');
const hardware = extractSection('hardware');
const download = extractSection('download');

const contactStart = jsx.indexOf('<div id="cta-banner" id="contact">');
const contactPart = contactStart !== -1 ? jsx.substring(contactStart) : '';

fs.writeFileSync('parts.json', JSON.stringify({ hero, why, platform, klev, pricing, hardware, download, contactPart }, null, 2));
console.log('Done extracting parts');

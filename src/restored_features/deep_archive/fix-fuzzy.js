import fs from 'fs';
const dump = JSON.parse(fs.readFileSync('cloudinary_dump.json', 'utf8'));
let content = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

function getFilename(url) {
    const parts = url.split('/');
    return parts[parts.length - 1].replace(/\.[^/.]+$/, "");
}

const allUrls = [...dump.images, ...dump.videos];

function findClosest(target) {
    const tLower = target.toLowerCase();
    
    // First try a substring match ignoring case
    for (const url of allUrls) {
        const fname = getFilename(url).toLowerCase();
        if (fname === tLower) return url;
        // If the target is a substring of the filename, or vice versa
        if (fname.includes(tLower) && tLower.length > 5) return url;
        if (tLower.includes(fname) && fname.length > 5) return url;
    }
    
    // Fallback: simple character matching score
    let bestUrl = null;
    let bestScore = -1;
    for (const url of allUrls) {
        const fname = getFilename(url).toLowerCase();
        let score = 0;
        for (let i = 0; i < Math.min(fname.length, tLower.length); i++) {
            if (fname[i] === tLower[i]) score++;
        }
        if (score > bestScore) {
            bestScore = score;
            bestUrl = url;
        }
    }
    return bestUrl;
}

// Find all Cloudinary URLs in Home.tsx
const regex = /https:\/\/res\.cloudinary\.com\/qcp4fx2v\/(image|video)\/upload\/[^"'\s>]+/g;
const matches = content.match(regex) || [];

const uniqueMatches = [...new Set(matches)];

uniqueMatches.forEach(match => {
    // extract the base name from the match
    const parts = match.split('/');
    const fname = parts[parts.length - 1].replace(/\.[^/.]+$/, "");
    const closest = findClosest(fname);
    if (closest) {
        // preserve the f_auto,q_auto if we want, but let's just use the exact secure URL for now to ensure it works.
        // wait, we can inject f_auto,q_auto before the v1234 part
        const fixedUrl = closest.replace('/upload/', '/upload/f_auto,q_auto/');
        console.log(`Replacing:\n  ${match}\nWith:\n  ${fixedUrl}\n`);
        
        // global replace
        content = content.split(match).join(fixedUrl);
    }
});

fs.writeFileSync('src/components/landing/Home.tsx', content, 'utf8');
console.log("Replaced fuzzy matches!");

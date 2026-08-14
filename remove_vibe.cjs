const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace gradient classes with flat backgrounds
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-[a-z]+-[0-9]+(?:\/[0-9]+)?\s+(?:via-[a-z]+-[0-9]+(?:\/[0-9]+)?\s+)?to-[a-z]+-[0-9]+(?:\/[0-9]+)?/g, function(match) {
    if (match.includes('red') || match.includes('orange')) return 'bg-red-600';
    if (match.includes('emerald') || match.includes('teal')) return 'bg-emerald-600';
    if (match.includes('blue') || match.includes('indigo') || match.includes('purple')) return 'bg-slate-800 border border-slate-700';
    if (match.includes('slate')) return 'bg-slate-900 border border-slate-800';
    if (match.includes('transparent')) return 'bg-transparent';
    return 'bg-slate-800';
  });

  // Remove other offensive classes
  content = content.replace(/neon-glow-[a-z]+/g, '');
  content = content.replace(/glass-panel(?:-header)?/g, 'bg-slate-900 border border-slate-800');
  content = content.replace(/glossy-btn/g, 'bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:-translate-y-0.5 transition-all duration-200');
  content = content.replace(/glossy-sos-btn/g, 'bg-red-600 hover:bg-red-500 hover:-translate-y-1 transition-all duration-300 shadow-lg');
  content = content.replace(/scanlines/g, '');
  content = content.replace(/map-scanner-overlay/g, '');
  content = content.replace(/hud-panel/g, 'bg-slate-900 border border-slate-700 shadow-sm');
  content = content.replace(/hud-bracket/g, '');
  content = content.replace(/map-frame/g, 'rounded-xl overflow-hidden border border-slate-700');
  
  // Replace arbitrary glows
  content = content.replace(/shadow-\[0_0_[^\]]+\]/g, 'shadow-sm');
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log("Vibe-coded aesthetics removed.");

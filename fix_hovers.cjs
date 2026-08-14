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
  
  content = content.replace(/hover:scale-105\s+transition-transform/g, 'btn-lift');
  content = content.replace(/hover:scale-105\s+active:scale-95\s+transition-all\s+duration-300/g, 'btn-lift');
  content = content.replace(/hover:scale-105/g, 'btn-lift');
  content = content.replace(/active:scale-95/g, '');
  content = content.replace(/shadow-xl\s+shadow-[a-z]+-[0-9]+/g, 'shadow-sm');
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log("Hover scales fixed.");

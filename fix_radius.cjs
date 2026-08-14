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
  
  // Enforce 3 radius values: rounded-md (small controls), rounded-lg (buttons), rounded-xl (panels)
  content = content.replace(/rounded-2xl/g, 'rounded-xl');
  content = content.replace(/rounded-3xl/g, 'rounded-xl');
  content = content.replace(/rounded-4xl/g, 'rounded-xl');
  // keep rounded-full and rounded-full for pills and avatars
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log("Radius values normalized.");

const fs = require('fs');

let brand = fs.readFileSync('src/config/brand.ts', 'utf8');
brand = brand.replace(/https:\/\/res.cloudinary.com\/qcp4fx2v\/image\/upload\/f_auto,q_auto\/v[0-9]+\/Safety_Link_Logo_Black_1\.png/g, "https://res.cloudinary.com/qcp4fx2v/image/upload/q_auto,f_auto/Polish_20260818_074430308");
brand = brand.replace(/https:\/\/res.cloudinary.com\/qcp4fx2v\/image\/upload\/f_auto,q_auto\/Safety_Link_Logo_Black\.png/g, "https://res.cloudinary.com/qcp4fx2v/image/upload/q_auto,f_auto/Polish_20260818_074430308");
brand = brand.replace(/https:\/\/res.cloudinary.com\/qcp4fx2v\/image\/upload\/f_auto,q_auto\/v[0-9]+\/K_leva\.png/g, "https://res.cloudinary.com/qcp4fx2v/image/upload/q_auto,f_auto/K_leva");
// Write it back
fs.writeFileSync('src/config/brand.ts', brand, 'utf8');
console.log("Patched brand.ts");

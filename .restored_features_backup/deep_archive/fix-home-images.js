import fs from 'fs';
let content = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

content = content.replace(/<img([^>]*)src="https:\/\/res\.cloudinary\.com\/qcp4fx2v\/video\/upload\/f_auto,q_auto\/v1787310206\/Government_use_case_senario\.mp4"/g, '<img$1src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Code_Generated_Image_1.png"');

fs.writeFileSync('src/components/landing/Home.tsx', content, 'utf8');
console.log("Fixed mp4s in imgs");

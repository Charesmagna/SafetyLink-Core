const fs = require('fs');
const glob = require('glob'); // Note: glob might not be installed, we can just walk the directory
const path = require('path');

const replacements = {
  '/official_safetylink_logo.svg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313195/Safety_Link_Logo_Black.png',
  '/safetylink-metallic.svg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/SafetyLink_3D_Render.png',
  '/media/new_logos/logo_hq.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313195/Safety_Link_Logo_Black.png',
  '/sl-shield.svg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313194/Safety_Link_Logo_Black_1.png',
  '/Screenshot_20260820_201927_com.aistudio.safetylink.vqnztp.jpg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310050/Polish_20260809_035827088.png', // Fallback to a known image
  '/panic-button-smooth.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310009/Polish_20260819_020134421.jpg',
  '/Polish_20260620_014530309.jpg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310049/Polish_20260620_014530309.jpg',
  '/Polish_20260727_023640262.jpg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg',
  '/Polish_20260727_010938698.jpg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309940/Gemini_Generated_Image_ohoz6sohoz6sohoz.jpg',
  '/media/videos/How_SafetyLink_Automates_Emergency_Responses.mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310204/Now_let_s_show_how_kids_would.mp4',
  '/media/videos/How_Emergency_Escalation_Pipelines_Work.mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310206/Government_use_case_senario.mp4',
  '/media/videos/SafetyLink 3D Animation Logo.mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310213/Now_I_need_the_d_animation_lo.mp4'
};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

const files = walkDir('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const [key, value] of Object.entries(replacements)) {
    if (content.includes(key)) {
      content = content.split(key).join(value);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});


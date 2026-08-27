const fs = require('fs');
const path = require('path');

const replacements = {
  '/media/images/Polish_20260819_020219883.jpg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310009/Polish_20260819_020219883.jpg',
  '/media/images/Polish_20260819_020007723.jpg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787310010/Polish_20260819_020007723.jpg',
  '/media/Scene_Setup_vertical_.mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310110/petal_20260727_180314.mp4',
  '/media/safetylink_startup.mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787696129/Make_this_come_to_life.mp4',
  '/media/Neon Power Logo Reveal_0p.mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310214/Okay_now_for_the_next_scene_.mp4',
  '/media/Now_I_need_the_d_animation_lo.mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310213/Now_I_need_the_d_animation_lo.mp4',
  '/media/kleva_logo/Kleva.svg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309978/K_leva.png',
  '/media/images/Emergency_Response_Platform_Architecture_Overview.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_59psss59psss59ps.jpg',
  '/media/images/Platform_Screenshot.jpeg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309945/Gemini_Generated_Image_48euet48euet48eu.png',
  '/media/images/Gemini_Generated_Image_bes7lhbes7lhbes7.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309977/Gemini_Generated_Image_6iikvx6iikvx6iik.png',
  '/media/images/Gemini_Generated_Image_cj8x5rcj8x5rcj8x.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309975/Gemini_Generated_Image_td9rg6td9rg6td9r.png',
  '/media/videos/Inside_the_SafetyLink_Emergency_Ecosystem.mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310206/Government_use_case_senario.mp4',
  '/media/videos/video (1).mp4': 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310194/drone_dispatch_tracking_crimin.mp4',
  '/media/images/Emergency_System_Architecture_Anatomy.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309940/Gemini_Generated_Image_ohoz6sohoz6sohoz.jpg',
  '/media/images/Safety_Response_System_Architecture.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309942/Gemini_Generated_Image_283s3m283s3m283s.jpg',
  '/media/images/Gemini_Generated_Image_ghu57oghu57oghu5.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309937/Gemini_Generated_Image_waguavwaguavwagu.jpg',
  '/media/images/Gemini_Generated_Image_umhnuvumhnuvumhn.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309937/Gemini_Generated_Image_s8bl6ps8bl6ps8bl.jpg',
  '/media/images/image_1783702731867.jpeg': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309971/image_1786374730511.jpg',
  '/media/images/eka67lqzxa.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309819/1785107409613.png',
  '/media/images/iumb4dkepg.png': 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787309110/main-sample.png'
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

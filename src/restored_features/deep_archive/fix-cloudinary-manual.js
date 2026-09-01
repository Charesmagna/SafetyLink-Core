import fs from 'fs';

let content = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');

// Fix videos
content = content.replace(
    'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Okay_now_for_the_next_scene.mp4',
    'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310214/Okay_now_for_the_next_scene_.mp4'
);
content = content.replace(
    'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/Government_use_case_scenario.mp4',
    'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v1787310206/Government_use_case_senario.mp4'
);

// Fix remaining images
const imageMap = {
    'copilot_image_178691666S098.jpg': 'v1787312148/copilot_image_178691666S098.jpg',
    'Gemini_Generated_Image_virgVirg99.jpg': 'v1787312150/Gemini_Generated_Image_virgVirg99.jpg',
    'Gemini_Generated_Image_59pss65p.jpg': 'v1787312148/Gemini_Generated_Image_59pss65p.jpg',
    'Gemini_Generated_Image_waguavwagu.jpg': 'v1787312151/Gemini_Generated_Image_waguavwagu.jpg',
    'Screenshot_20260820_201927_com_aistudio_safetylink_vqnztp.jpg': 'v1787312148/Screenshot_20260820_201927_com_aistudio_safetylink_vqnztp.jpg',
    'Screenshot_20260820_202202_com_aistudio_safetylink_vqnztp.jpg': 'v1787312150/Screenshot_20260820_202202_com_aistudio_safetylink_vqnztp.jpg',
    'Gemini_Generated_Image_4keue49e.jpg': 'v1787312148/Gemini_Generated_Image_4keue49e.jpg',
    'Polish_20260818_020279883.jpg': 'v1787312147/Polish_20260818_020279883.jpg',
    'Polish_20260818_020134421.jpg': 'v1787312146/Polish_20260818_020134421.jpg',
    'Polish_20260818_020007723.jpg': 'v1787312146/Polish_20260818_020007723.jpg',
    'Gemini_Generated_Image_8ikrgy9t0r.jpg': 'v1787312146/Gemini_Generated_Image_8ikrgy9t0r.jpg',
    'Gemini_Generated_Image_swlp4kswl.jpg': 'v1787312145/Gemini_Generated_Image_swlp4kswl.jpg',
    'Gemini_Generated_Image_chze56oh0.jpg': 'v1787312145/Gemini_Generated_Image_chze56oh0.jpg',
    'Gemini_Generated_Image_s8bRy8s8b.jpg': 'v1787312145/Gemini_Generated_Image_s8bRy8s8b.jpg',
    'copilot_image_178370354D283.jpg': 'v1787312144/copilot_image_178370354D283.jpg',
    'Gemini_Generated_Image_283x3m28.jpg': 'v1787312144/Gemini_Generated_Image_283x3m28.jpg',
    'K_leva.jpg': 'v1787312143/K_leva.jpg',
    'SafetyLink_Global_Protection_Network.jpg': 'v1787312143/SafetyLink_Global_Protection_Network.jpg',
    'Polish_20260818_074430308.jpg': 'v1787312151/Polish_20260818_074430308.jpg'
};

for (const [key, val] of Object.entries(imageMap)) {
    const broken = `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/${key}`;
    const fixed = `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/${val}`;
    content = content.replace(new RegExp(broken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixed);
}

fs.writeFileSync('src/components/landing/Home.tsx', content, 'utf8');
console.log("Replaced broken links!");

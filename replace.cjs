const fs = require('fs');

const path = 'src/components/landing/Home.tsx';
let content = fs.readFileSync(path, 'utf8');

const imgBase = 'https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/';
const vidBase = 'https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/';

// Cleanly replacing using normal concatenation
content = content.replace(/src="[^"]*Code_Generated_Image_1\.png" alt="SafetyLink SOS Screen"/g, 'src="' + imgBase + 'image_178637479351.png" alt="SafetyLink SOS Screen"');
content = content.replace(/src="[^"]*ChatGPT_Image_Jul_3_2026_11_33_15_PM\.png" alt="SafetyLink Command Login"/g, 'src="' + imgBase + 'copilot_image_178320115b536.png" alt="SafetyLink Command Login"');
content = content.replace(/poster="[^"]*Gemini_Generated_Image_\.png"/g, 'poster="' + imgBase + 'Polish_20260808_035827088.png"');

// Videos - let's add all videos they listed to the video slider source list
const videoSources = `
                <source src="${vidBase}Okay_now_for_the_next_scene_.mp4" type="video/mp4"/>
                <source src="${vidBase}Video_that_shows_demonstrate_h.mp4" type="video/mp4"/>
                <source src="${vidBase}Now_I_need_the_d_animation_lo.mp4" type="video/mp4"/>
                <source src="${vidBase}Now_I_need_the_d_animation_is_1.mp4" type="video/mp4"/>
                <source src="${vidBase}It_doesnt_make_sense_because.mp4" type="video/mp4"/>
                <source src="${vidBase}It_almost_made_sense_just_a_li.mp4" type="video/mp4"/>
                <source src="${vidBase}Next.mp4" type="video/mp4"/>
                <source src="${vidBase}Last_one.mp4" type="video/mp4"/>
                <source src="${vidBase}Go_ahead_1.mp4" type="video/mp4"/>
                <source src="${vidBase}Government_use_case_senario.mp4" type="video/mp4"/>
                <source src="${vidBase}It_got_cut_while_saying_organi.mp4" type="video/mp4"/>
                <source src="${vidBase}SafetyLink_vision_when_ble_is.mp4" type="video/mp4"/>
                <source src="${vidBase}Show_the_uses_in_school_and_wo.mp4" type="video/mp4"/>
                <source src="${vidBase}Now_let_s_show_how_kids_would.mp4" type="video/mp4"/>
                <source src="${vidBase}Next_ones_but_in_a_South_Afric.mp4" type="video/mp4"/>
                <source src="${vidBase}Neighbourhood_watch_security_c.mp4" type="video/mp4"/>
                <source src="${vidBase}Old_people_scenario_alone_at_h.mp4" type="video/mp4"/>
                <source src="${vidBase}K_s_south_Africa_so_multirac.mp4" type="video/mp4"/>
                <source src="${vidBase}Let_s_focus_in_city_broadcasts.mp4" type="video/mp4"/>
                <source src="${vidBase}drone_dispatch_tracking_crimin.mp4" type="video/mp4"/>
                <source src="${vidBase}Pitch_deck.mp4" type="video/mp4"/>
                <source src="${vidBase}Why.mp4" type="video/mp4"/>
                <source src="${vidBase}Our_Three_Pillars.mp4" type="video/mp4"/>
                <source src="${vidBase}petal_series.mp4" type="video/mp4"/>
`;

// Replace the existing video sources block
content = content.replace(/<source src="[^"]*Okay_now_for_the_next_scene_\.mp4" type="video\/mp4"\/>[\s\S]*?<source src="[^"]*Old_people_scenario_alone_at_h\.mp4" type="video\/mp4"\/>/, videoSources.trim());

// Info images
content = content.replace(/src="[^"]*copilot_image_1786916665016\.png" alt="Security Command Room"/g, 'src="' + imgBase + 'copilot_image_178691666S098.png" alt="Security Command Room"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="Family Safety"/g, 'src="' + imgBase + 'Gemini_Generated_Image_virgVirg99.png" alt="Family Safety"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="Estate Security"/g, 'src="' + imgBase + 'copilot_image_178696579200.png" alt="Estate Security"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="SafetyLink Offline-First Intelligent Dispatch System"/g, 'src="' + imgBase + 'Gemini_Generated_Image_4keue49e.png" alt="SafetyLink Offline-First Intelligent Dispatch System"');

// Project thumbnails
content = content.replace(/<div className="pthumb"><img src="[^"]*Code_Generated_Image_1\.png" alt="SOS App"\/><\/div>/g, '<div className="pthumb"><img src="' + imgBase + 'image_178637479351.png" alt="SOS App"/></div>');
content = content.replace(/<div className="pthumb"><img src="[^"]*ChatGPT_Image_Jul_3_2026_11_33_15_PM\.png" alt="Command Login"\/><\/div>/g, '<div className="pthumb"><img src="' + imgBase + 'copilot_image_178320115b536.png" alt="Command Login"/></div>');

// Mockups
content = content.replace(/src="[^"]*Code_Generated_Image_1\.png" alt="SafetyLink Mobile App"/g, 'src="' + imgBase + 'image_178637479351.png" alt="SafetyLink Mobile App"');
content = content.replace(/src="[^"]*ChatGPT_Image_Jul_3_2026_11_33_15_PM\.png" alt="SafetyLink Command"/g, 'src="' + imgBase + 'copilot_image_178320115b536.png" alt="SafetyLink Command"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="SafetyLink Admin"/g, 'src="' + imgBase + 'Gemini_Generated_Image_59pss65p.png" alt="SafetyLink Admin"');

// iTAG devices
content = content.replace(/Polish_20260819_020219883\.jpg/g, 'Polish_20260818_020279883.png');
content = content.replace(/Polish_20260819_020134421\.jpg/g, 'Polish_20260818_020134421.png');
content = content.replace(/Polish_20260819_020007723\.jpg/g, 'Polish_20260818_020007723.png');

// Gallery items
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="SafetyLink tactical poster"/g, 'src="' + imgBase + 'Gemini_Generated_Image_8ikrgy9t0r.png" alt="SafetyLink tactical poster"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="System diagram"/g, 'src="' + imgBase + 'Gemini_Generated_Image_swlp4kswl.png" alt="System diagram"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="Drone minutes matter"/g, 'src="' + imgBase + 'Gemini_Generated_Image_chze56oh0.png" alt="Drone minutes matter"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="SafetyLink business card"/g, 'src="' + imgBase + 'Gemini_Generated_Image_s8bRy8s8b.png" alt="SafetyLink business card"');
content = content.replace(/src="[^"]*copilot_image_1783703540293\.png" alt="SafetyLink 3D logo"/g, 'src="' + imgBase + 'copilot_image_178370354D283.png" alt="SafetyLink 3D logo"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="UI screenshot"/g, 'src="' + imgBase + 'Gemini_Generated_Image_283x3m28.png" alt="UI screenshot"');

// Downloads section
content = content.replace(/src="[^"]*Code_Generated_Image_1\.png" alt="Android App Preview"/g, 'src="' + imgBase + 'image_178637479351.png" alt="Android App Preview"');
content = content.replace(/src="[^"]*Gemini_Generated_Image_\.png" alt="Windows Command Deck"/g, 'src="' + imgBase + 'copilot_image_178320115b536.png" alt="Windows Command Deck"');
content = content.replace(/src="[^"]*Polish_20260620_014530309\.jpg" alt="SafetyLink PWA"/g, 'src="' + imgBase + 'Polish_20260808_035827088.png" alt="SafetyLink PWA"');

// Network banner
content = content.replace(/src="[^"]*SafetyLink_3D_Render\.pdf" alt="SafetyLink Global Protection Network"/g, 'src="' + imgBase + 'SafetyLink_Global_Protection_Network.png" alt="SafetyLink Global Protection Network"');

fs.writeFileSync(path, content, 'utf8');
console.log('Replacements complete');

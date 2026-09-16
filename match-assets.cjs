const fs = require('fs');

const assets = JSON.parse(fs.readFileSync('cloudinary-assets.json', 'utf8'));

const targets = [
    'Okay_now_for_the_next_scene',
    'Video_that_shows_demonstrate_h',
    'Now_I_need_the_d_animation_lo',
    'Now_I_need_the_d_animation_is_1',
    'It_doesnt_make_sense_because',
    'It_almost_made_sense_just_a_li',
    'Next',
    'Last_one',
    'Go_ahead_1',
    'Government_use_case_senario',
    'It_got_cut_while_saying_organi',
    'SafetyLink_vision_when_ble_is',
    'Show_the_uses_in_school_and_wo',
    'Now_let_s_show_how_kids_would',
    'Next_ones_but_in_a_South_Afric',
    'Neighbourhood_watch_security_c',
    'Old_people_scenario_alone_at_h',
    'K_s_south_Africa_so_multirac',
    'Let_s_focus_in_city_broadcasts',
    'drone_dispatch_tracking_crimin',
    'Pitch_deck',
    'Why',
    'Our_Three_Pillars',
    'petal_',
    'Gemini_Generated_Image_viirg9',
    'copilot_image_178320115b536',
    'copilot_image_178370298B829',
    'copilot_image_178696579200',
    'copilot_image_178370354D283',
    'copilot_image_178691666S098',
    'Polish_20260809_035827088',
    'Polish_20260818_074430308',
    'Polish_20260819_020007723',
    'Polish_20260819_020134421',
    'Polish_20260819_020219883',
    'Polish_20260818_020655457',
    'k-zoom_file_1',
    'Gemini_Generated_Image_KhvgsBkBv',
    'InsafetyZdx',
    'ChatGPT_Image_Jul_3_2026',
    'K_leva',
    'Gemini_Generated_Image_8ikevB8kv',
    'Gemini_Generated_Image_8ikrgy9t0r',
    'image_178637479351',
    'Gemini_Generated_Image_4keue49e',
    'Gemini_Generated_Image_59psss59',
    'Gemini_Generated_Image_swlp4k',
    'Gemini_Generated_Image_283s3m',
    'Gemini_Generated_Image_chze56oh0',
    'Gemini_Generated_Image_waguav',
    'Gemini_Generated_Image_s8bl6p',
    'SafetyLink_3D_Render'
];

let mapping = {};
for (let target of targets) {
    let match = assets.find(a => a.public_id.includes(target) || target.includes(a.public_id));
    if (match) {
        mapping[target] = match.url;
    } else {
        console.log("NOT FOUND:", target);
    }
}
console.log("\nFOUND URLS:");
for (let key in mapping) {
    console.log(`${key}: ${mapping[key]}`);
}

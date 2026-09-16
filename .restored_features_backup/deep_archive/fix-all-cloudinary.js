import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: 'qcp4fx2v', 
    api_key: '656436973999786', 
    api_secret: '9awzOE6f_j0c7zauImg1IOhATes' 
});

async function run() {
    try {
        console.log("Fetching images...");
        const imgResult = await cloudinary.api.resources({ max_results: 100, resource_type: 'image' });
        console.log("Fetching videos...");
        const vidResult = await cloudinary.api.resources({ max_results: 100, resource_type: 'video' });
        
        const assets = [...imgResult.resources, ...vidResult.resources];
        
        let content = fs.readFileSync('src/components/landing/Home.tsx', 'utf8');
        let original = content;

        // The current broken URLs look like:
        // https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/FILENAME.jpg
        // https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/FILENAME.mp4

        assets.forEach(asset => {
            // asset.public_id might be "Gemini_Generated_Image_virgVirg99" or "samples/shoes"
            // asset.version might be 1787312150
            // asset.format might be "jpg" or "mp4"
            
            const pId = asset.public_id.split('/').pop(); // grab just the filename part
            
            const regexStrImg = `https:\\/\\/res\\.cloudinary\\.com\\/qcp4fx2v\\/image\\/upload\\/(f_auto,q_auto\\/)?(v\\d+\\/)?${pId}\\.(jpg|png|jpeg)`;
            const regexImg = new RegExp(regexStrImg, 'g');
            
            const regexStrVid = `https:\\/\\/res\\.cloudinary\\.com\\/qcp4fx2v\\/video\\/upload\\/(f_auto,q_auto\\/)?(v\\d+\\/)?${pId}\\.(mp4|webm)`;
            const regexVid = new RegExp(regexStrVid, 'g');
            
            const replaceStrImg = `https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v${asset.version}/${asset.public_id}.${asset.format}`;
            const replaceStrVid = `https://res.cloudinary.com/qcp4fx2v/video/upload/f_auto,q_auto/v${asset.version}/${asset.public_id}.${asset.format}`;

            content = content.replace(regexImg, replaceStrImg);
            content = content.replace(regexVid, replaceStrVid);
        });

        // Also user explicitly requested this logo:
        // https://res.cloudinary.com/qcp4fx2v/image/upload/v1787313197/Gemini_Generated_Image_n4gy5ln4gy5ln4gy.jpg
        // Let's replace navLogo with this Cloudinary link
        content = content.replace(
            /<img src=\{navLogo\} alt="SafetyLink Logo" \/>/,
            '<img src="https://res.cloudinary.com/qcp4fx2v/image/upload/f_auto,q_auto/v1787313197/Gemini_Generated_Image_n4gy5ln4gy5ln4gy.jpg" alt="SafetyLink Logo" />'
        );

        if (content !== original) {
            fs.writeFileSync('src/components/landing/Home.tsx', content, 'utf8');
            console.log("Updated Home.tsx successfully!");
        } else {
            console.log("No changes made to Home.tsx. Check regexes.");
        }

    } catch(e) {
        console.error("Error:", e);
    }
}
run();

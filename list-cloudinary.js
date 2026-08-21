import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({ 
    cloud_name: 'qcp4fx2v', 
    api_key: '656436973999786', 
    api_secret: '9awzOE6f_j0c7zauImg1IOhATes' 
});
async function run() {
    try {
        const result = await cloudinary.api.resources({ max_results: 100, resource_type: 'image' });
        console.log("Images:", result.resources.map(r => r.secure_url));
        const vids = await cloudinary.api.resources({ max_results: 100, resource_type: 'video' });
        console.log("Videos:", vids.resources.map(r => r.secure_url));
    } catch(e) {
        console.error(e);
    }
}
run();

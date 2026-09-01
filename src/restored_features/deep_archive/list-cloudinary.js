import { v2 as cloudinary } from 'cloudinary';
cloudinary.config({ 
    cloud_name: 'qcp4fx2v', 
    api_key: '656436973999786', 
    api_secret: '9awzOE6f_j0c7zauImg1IOhATes' 
});
async function run() {
    try {
        let all = [];
        let next = null;
        do {
            const res = await cloudinary.api.resources({ max_results: 500, resource_type: 'image', next_cursor: next });
            all = all.concat(res.resources.map(r => r.secure_url));
            next = res.next_cursor;
        } while(next);
        
        let allvids = [];
        next = null;
        do {
            const res = await cloudinary.api.resources({ max_results: 500, resource_type: 'video', next_cursor: next });
            allvids = allvids.concat(res.resources.map(r => r.secure_url));
            next = res.next_cursor;
        } while(next);

        const fs = await import('fs');
        fs.writeFileSync('cloudinary_dump.json', JSON.stringify({images: all, videos: allvids}, null, 2));
        console.log("Dumped to cloudinary_dump.json");
    } catch(e) {
        console.error(e);
    }
}
run();

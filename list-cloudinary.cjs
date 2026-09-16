const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: 'qcp4fx2v', 
    api_key: '656436973999786', 
    api_secret: '9awzOE6f_j0c7zauImg1IOhATes' 
});

async function getAssets() {
    try {
        let allAssets = [];
        let nextCursor = null;
        
        do {
            const result = await cloudinary.search
                .expression('')
                .sort_by('public_id', 'desc')
                .max_results(500)
                .next_cursor(nextCursor)
                .execute();
                
            allAssets = allAssets.concat(result.resources);
            nextCursor = result.next_cursor;
        } while (nextCursor);
        
        console.log(JSON.stringify(allAssets.map(r => ({ public_id: r.public_id, url: r.secure_url, resource_type: r.resource_type, format: r.format })), null, 2));
    } catch (e) {
        console.error(e);
    }
}

getAssets();

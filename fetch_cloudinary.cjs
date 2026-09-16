const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({ 
    cloud_name: 'qcp4fx2v', 
    api_key: '656436973999786', 
    api_secret: '9awzOE6f_j0c7zauImg1IOhATes'
});

async function run() {
    try {
        let allResources = [];
        let next_cursor = null;
        
        do {
            const options = { max_results: 500 };
            if (next_cursor) options.next_cursor = next_cursor;
            
            const result = await cloudinary.api.resources(options);
            allResources = allResources.concat(result.resources);
            next_cursor = result.next_cursor;
        } while (next_cursor);
        
        // Also fetch videos
        next_cursor = null;
        do {
            const options = { max_results: 500, resource_type: 'video' };
            if (next_cursor) options.next_cursor = next_cursor;
            
            const result = await cloudinary.api.resources(options);
            allResources = allResources.concat(result.resources);
            next_cursor = result.next_cursor;
        } while (next_cursor);
        
        fs.writeFileSync('cloudinary_resources.json', JSON.stringify(allResources, null, 2));
        console.log('Fetched ' + allResources.length + ' resources.');
    } catch (err) {
        console.error(err);
    }
}

run();

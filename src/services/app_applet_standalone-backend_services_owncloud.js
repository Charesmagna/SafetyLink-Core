import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const OC_URL = process.env.OC_URL || 'http://localhost:8080';
const OC_ADMIN = process.env.OC_ADMIN || 'admin';
const OC_ADMIN_PASS = process.env.OC_ADMIN_PASS || 'admin';

export async function createOCUser(code, type) {
  try {
    // 1. Create folder: /safetylink/FAMILY/FAM-XXX
    // Or /safetylink/ORGANIZATION/ORG-XXX
    const typeFolder = type.toUpperCase();
    const folderPath = `/safetylink/${typeFolder}/${code}`;
    
    // Attempt to create parent folders first
    try {
      await axios.request({
        method: 'MKCOL',
        url: `${OC_URL}/remote.php/webdav/safetylink`,
        auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
      });
    } catch (e) { /* Ignore if exists */ }
    
    try {
      await axios.request({
        method: 'MKCOL',
        url: `${OC_URL}/remote.php/webdav/safetylink/${typeFolder}`,
        auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
      });
    } catch (e) { /* Ignore if exists */ }

    // Create the actual code folder
    try {
      await axios.request({
        method: 'MKCOL',
        url: `${OC_URL}/remote.php/webdav${folderPath}`,
        auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
      });
    } catch (e) {
      console.log(`Folder ${folderPath} already exists or error.`, e.response?.status);
    }

    // 2. Create user: username = code, password = random
    const ocPassword = Math.random().toString(36).slice(-8);
    await axios.post(`${OC_URL}/ocs/v1.php/cloud/users`, {
      userid: code,
      password: ocPassword
    }, {
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS },
      headers: { 'OCS-APIRequest': 'true' }
    });

    // 3. Give user access to ONLY their folder
    await axios.post(`${OC_URL}/ocs/v1.php/apps/files_sharing/api/v1/shares`, {
      path: folderPath,
      shareType: 0, // user
      shareWith: code,
      permissions: 1 // read
    }, {
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS },
      headers: { 'OCS-APIRequest': 'true' }
    });

    return { username: code, password: ocPassword };
  } catch (err) {
    console.error("Failed to create OC User:", err.response?.data || err.message);
    throw err;
  }
}

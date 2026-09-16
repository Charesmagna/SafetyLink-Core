import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const OC_URL = process.env.OC_URL || 'http://localhost:8080';
const OC_ADMIN = process.env.OC_ADMIN || 'admin';
const OC_ADMIN_PASS = process.env.OC_ADMIN_PASS || 'admin';

export async function createOCUser(code, type) {
  try {
    const typeFolder = type.toUpperCase();
    const folderPath = `/safetylink/${typeFolder}/${code}`;
    
    try {
      await axios.request({
        method: 'MKCOL',
        url: `${OC_URL}/remote.php/webdav/safetylink`,
        auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
      });
    } catch (e) { }
    
    try {
      await axios.request({
        method: 'MKCOL',
        url: `${OC_URL}/remote.php/webdav/safetylink/${typeFolder}`,
        auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
      });
    } catch (e) { }

    try {
      await axios.request({
        method: 'MKCOL',
        url: `${OC_URL}/remote.php/webdav${folderPath}`,
        auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
      });
    } catch (e) { }

    const ocPassword = Math.random().toString(36).slice(-8);
    await axios.post(`${OC_URL}/ocs/v1.php/cloud/users`, {
      userid: code,
      password: ocPassword
    }, {
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS },
      headers: { 'OCS-APIRequest': 'true' }
    });

    await axios.post(`${OC_URL}/ocs/v1.php/apps/files_sharing/api/v1/shares`, {
      path: folderPath,
      shareType: 0, 
      shareWith: code,
      permissions: 1
    }, {
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS },
      headers: { 'OCS-APIRequest': 'true' }
    });

    return { username: code, password: ocPassword };
  } catch (err) {
    throw err;
  }
}

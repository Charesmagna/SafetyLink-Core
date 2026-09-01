import axios from 'axios';

const OC_URL = process.env.OC_URL || 'http://localhost:8080';
const OC_ADMIN = 'admin';
const OC_ADMIN_PASS = process.env.OC_ADMIN_PASS || 'safelinkadmin123';

export async function createOCUser(code: string, type: 'ORGANIZATION' | 'FAMILY') {
  const folderPath = `/safetylink/${type}/${code}`;
  
  // 1. Create base directories if they don't exist
  try {
    await axios.request({
      method: 'MKCOL',
      url: `${OC_URL}/remote.php/webdav/safetylink`,
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
    }).catch(() => { /* Ignore if exists */ });
    
    await axios.request({
      method: 'MKCOL',
      url: `${OC_URL}/remote.php/webdav/safetylink/${type}`,
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
    }).catch(() => { /* Ignore if exists */ });

    await axios.request({
      method: 'MKCOL',
      url: `${OC_URL}/remote.php/webdav${folderPath}`,
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
    }).catch(() => { /* Ignore if exists */ });
  } catch (e: any) {
    console.warn("Folder creation error", e.message);
  }

  // 2. Create user: username = code, password = random
  const ocPassword = Math.random().toString(36).slice(-8);
  try {
    await axios.post(`${OC_URL}/ocs/v1.php/cloud/users`, {
      userid: code,
      password: ocPassword
    }, {
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS },
      headers: { 'OCS-APIRequest': 'true' }
    });
  } catch (e: any) {
    console.warn("OC User creation error", e.message);
  }

  // 3. Give user access to ONLY their folder
  try {
    await axios.post(`${OC_URL}/ocs/v1.php/apps/files_sharing/api/v1/shares`, {
      path: folderPath,
      shareType: 0, // user
      shareWith: code,
      permissions: 1 // read
    }, {
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS },
      headers: { 'OCS-APIRequest': 'true' }
    });
  } catch (e: any) {
    console.warn("OC Share error", e.message);
  }

  return { ocUsername: code, ocPassword: ocPassword };
}

export async function deleteOCFolder(folderPath: string) {
  try {
    await axios.request({
      method: 'DELETE',
      url: `${OC_URL}/remote.php/webdav${folderPath}`,
      auth: { username: OC_ADMIN, password: OC_ADMIN_PASS }
    });
    console.log(`[OwnCloud] Successfully deleted folder: ${folderPath}`);
  } catch (e: any) {
    console.warn(`[OwnCloud] Failed to delete folder ${folderPath}:`, e.message);
  }
}

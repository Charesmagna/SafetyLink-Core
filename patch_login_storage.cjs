const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');

const originalBlock = `            set({
              currentUser: { username, role: fbResult.role || 'User', orgCode: fbResult.orgCode } as any,
              token: fbResult.uid || null,
              currentOrg: isOrgAdmin && fbResult.orgCode ? { id: fbResult.orgCode, name: fbResult.orgName || fbResult.orgCode } as any : null,
              superAdminActive: false
            });
            setStoredJSON('sl_jwt_token', fbResult.uid || null);
            return { success: true, role: isOrgAdmin ? 'ORG' : 'USER' };`;

const newBlock = `            const currentUserObj = { username, role: fbResult.role || 'User', orgCode: fbResult.orgCode, email: fbResult.email, id: fbResult.uid };
            const currentOrgObj = isOrgAdmin && fbResult.orgCode ? { id: fbResult.orgCode, name: fbResult.orgName || fbResult.orgCode } : null;
            set({
              currentUser: currentUserObj as any,
              token: fbResult.uid || null,
              currentOrg: currentOrgObj as any,
              superAdminActive: false
            });
            setStoredJSON('sl_jwt_token', fbResult.uid || null);
            setStoredJSON('sl_current_user', currentUserObj);
            setStoredJSON('sl_current_org', currentOrgObj);
            setStoredJSON('sl_super_admin', false);
            return { success: true, role: isOrgAdmin ? 'ORG' : 'USER' };`;

code = code.replace(originalBlock, newBlock);
fs.writeFileSync('src/utils/store.ts', code);

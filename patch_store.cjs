const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');

// Replace registerUser catch block
code = code.replace(
  /\} catch \(e\) \{\s*console\.error\('registerUser failed', e\);\s*return \{ success: false, error: 'Failed to connect to full-stack secure gateway\.' \};\s*\}/,
  `} catch (e) {
      console.warn('Network unavailable. Falling back to local offline vault for User Registration.', e);
      const realUsers = getStoredJSON('sl_real_users', []);
      const exists = realUsers.some((u: any) => u.username.toLowerCase() === user.username.toLowerCase());
      if (exists) {
        return { success: false, error: 'Username is already taken (Offline Check).' };
      }
      const newUser = {
        ...user,
        id: \`usr-\${Math.random().toString(36).substring(2, 9)}\`,
        createdAt: Date.now()
      };
      set({
        currentUser: newUser as UserProfile,
        token: 'offline-jwt-token',
        superAdminActive: false,
        users: [...get().users, newUser as UserProfile]
      });
      setStoredJSON('sl_jwt_token', 'offline-jwt-token');
      setStoredJSON('sl_current_user', newUser);
      setStoredJSON('sl_super_admin', false);
      setStoredJSON('sl_real_users', [...realUsers, newUser]);
      get().addAuditLog('SECURITY', 'INFO', 'New User Registered (Offline Vault)', \`Username: \${newUser.username}\`);
      return { success: true };
    }`
);

// Replace registerOrganization catch block
code = code.replace(
  /\} catch \(e\) \{\s*console\.error\('registerOrganization failed', e\);\s*return null;\s*\}/,
  `} catch (e) {
      console.warn('Network unavailable. Falling back to local offline vault for Org Registration.', e);
      const randomHex = Math.floor(1000 + Math.random() * 9000);
      const abbrev = getOrgAbbreviation(org.name);
      const generatedId = org.id || \`SL-\${abbrev}-\${randomHex}\`;

      const newOrg = {
        name: org.name,
        contactName: org.contactName,
        contactEmail: org.contactEmail,
        id: generatedId,
        createdAt: Date.now(),
        approved: true
      };

      set({
        organizations: [...get().organizations, newOrg as Organization]
      });
      const realOrgs = getStoredJSON('sl_real_orgs', []);
      setStoredJSON('sl_real_orgs', [...realOrgs, newOrg]);
      
      get().addAuditLog('SECURITY', 'INFO', 'New Organization Provisioned (Offline Vault)', \`Name: \${newOrg.name}, Code: \${newOrg.id}\`);
      return newOrg as Organization;
    }`
);

// Replace login catch block
code = code.replace(
  /\} catch \(e\) \{\s*console\.error\('login failed', e\);\s*return \{ success: false, error: 'Connection failure to authentication server\.', role: 'USER' \};\s*\}/,
  `} catch (e) {
      console.warn('Network unavailable. Falling back to local offline vault for Login.', e);
      const realUsers = getStoredJSON<UserProfile[]>('sl_real_users', []);
      const matchedUser = realUsers.find(u => u.username.toLowerCase() === normUsername);
      if (matchedUser) {
        const userOrg = matchedUser.orgCode || '';
        if (orgCode.trim() && userOrg.toLowerCase() !== normOrgCode) {
          return { success: false, error: 'User does not belong to this organization code.', role: 'USER' };
        }

        set({ currentUser: matchedUser, currentOrg: null, superAdminActive: false, token: 'offline-jwt-token' });
        setStoredJSON('sl_current_user', matchedUser);
        setStoredJSON('sl_current_org', null);
        setStoredJSON('sl_super_admin', false);
        setStoredJSON('sl_jwt_token', 'offline-jwt-token');

        get().addAuditLog('SECURITY', 'INFO', 'User Authenticated (Offline Vault)', \`User: \${matchedUser.username}\`);
        return { success: true, role: 'USER' };
      }

      const realOrgs = getStoredJSON<Organization[]>('sl_real_orgs', []);
      if (normOrgCode) {
        const matchedOrg = realOrgs.find(o => o.id.toLowerCase() === normOrgCode);
        if (matchedOrg) {
          if (matchedOrg.contactName.toLowerCase() === normUsername) {
            set({ currentUser: null, currentOrg: matchedOrg, superAdminActive: false, token: 'offline-jwt-token' });
            setStoredJSON('sl_current_user', null);
            setStoredJSON('sl_current_org', matchedOrg);
            setStoredJSON('sl_super_admin', false);
            setStoredJSON('sl_jwt_token', 'offline-jwt-token');

            get().addAuditLog('SECURITY', 'INFO', 'Organization Logged In (Offline Vault)', \`Org Name: \${matchedOrg.name}\`);
            return { success: true, role: 'ORG' };
          }
        }
      }

      return { success: false, error: 'Connection failure to auth server, and no local offline account found.', role: 'USER' };
    }`
);

fs.writeFileSync('src/utils/store.ts', code);

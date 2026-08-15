const fs = require('fs');
let code = fs.readFileSync('src/utils/store.ts', 'utf8');
code = code.replace(
  "    } catch (e) {\n      console.warn('Network unavailable. Falling back to local offline vault for User Registration.', e);\n      const realUsers = getStoredJSON('sl_real_users', []);",
  `    } catch (e) {
      // Try Firebase Auth as fallback
      try {
        const emailToTry = user.email || user.username + '@safetylink.local';
        const fbResult = await firebaseRegisterUser(emailToTry.toLowerCase(), user.password || 'password123', user.username, user.role || 'User', user.orgCode);
        if (fbResult.success) {
          const newUser = {
            ...user,
            id: fbResult.uid || \`usr-\${Math.random().toString(36).substring(2, 9)}\`,
            createdAt: Date.now()
          };
          set({
            currentUser: newUser as any,
            token: fbResult.uid || null,
            superAdminActive: false,
            users: [...get().users, newUser as any]
          });
          setStoredJSON('sl_jwt_token', fbResult.uid || null);
          setStoredJSON('sl_current_user', newUser);
          setStoredJSON('sl_super_admin', false);
          return { success: true };
        }
      } catch (_fbErr) { /* fall through */ }
      
      console.warn('Network unavailable. Falling back to local offline vault for User Registration.', e);
      const realUsers = getStoredJSON('sl_real_users', []);`
);
fs.writeFileSync('src/utils/store.ts', code);

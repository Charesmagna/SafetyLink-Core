const fs = require('fs');
let fb = fs.readFileSync('src/lib/firebase.ts', 'utf8');

fb = fb.replace(
  "export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);",
  "export const db = initializeFirestore(app, {}, (firebaseConfig as any).firestoreDatabaseId);"
);

fs.writeFileSync('src/lib/firebase.ts', fb);

let fsync = fs.readFileSync('src/services/FirebaseSyncService.ts', 'utf8');
fsync = fsync.replace(/responderAssigned/g, 'assignedResponder');
fs.writeFileSync('src/services/FirebaseSyncService.ts', fsync);

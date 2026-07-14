const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add firebase imports
code = code.replace(
  "import jwt from 'jsonwebtoken';",
  "import jwt from 'jsonwebtoken';\nimport admin from 'firebase-admin';\nimport { initializeApp } from 'firebase-admin/app';\nimport { getFirestore } from 'firebase-admin/firestore';\n\nconst firebaseApp = initializeApp({\n  projectId: process.env.FIREBASE_PROJECT_ID || 'safetylink-99e56'\n});\nconst firestore = getFirestore(firebaseApp);\n"
);

// Push incident to firestore
code = code.replace(
  /await db\.insert\(incidents\)\.values\(newIncident\);/g,
  `await db.insert(incidents).values(newIncident);\n  try { await firestore.collection('incidents').doc(newIncident.id).set(newIncident); } catch(e) { console.error('Firestore sync error:', e); }`
);

fs.writeFileSync('server.ts', code);

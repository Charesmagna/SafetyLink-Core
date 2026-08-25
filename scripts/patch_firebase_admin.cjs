const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "import * as admin from 'firebase-admin';",
  "import { initializeApp } from 'firebase-admin/app';\nimport { getFirestore, FieldValue } from 'firebase-admin/firestore';"
);

code = code.replace(
  "admin.initializeApp({",
  "initializeApp({"
);

code = code.replace(
  "const firestoreDb = admin.firestore();",
  "const firestoreDb = getFirestore();"
);

code = code.replace(
  "admin.firestore.FieldValue.serverTimestamp()",
  "FieldValue.serverTimestamp()"
);

fs.writeFileSync('server.ts', code);

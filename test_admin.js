import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({projectId: 'test'});
const db = getFirestore();
console.log(db ? "db ok" : "db fail");

import * as fs from 'fs';
import * as firebase from '@firebase/rules-unit-testing';

const projectId = 'gen-lang-client-0219152839';

describe('Firestore Rules', () => {
  let testEnv: firebase.RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await firebase.initializeTestEnvironment({
      projectId,
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('allows user to read their own profile', async () => {
    const db = testEnv.authenticatedContext('user_123').firestore();
    const doc = db.collection('users').doc('user_123');
    await firebase.assertSucceeds(doc.get());
  });

  it('denies user reading another profile', async () => {
    const db = testEnv.authenticatedContext('user_123').firestore();
    const doc = db.collection('users').doc('user_456');
    await firebase.assertFails(doc.get());
  });
});

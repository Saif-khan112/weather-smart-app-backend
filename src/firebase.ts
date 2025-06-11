import admin from 'firebase-admin';
import path from 'path';

const serviceAccount = require(path.resolve(__dirname, '../firebaseServiceAccount.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
});

// Export the Realtime Database instance
const db = admin.database();

export { admin, db };

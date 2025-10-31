// IMPORTANT: This file is only for server-side use.
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// This function should only be called on the server.
export function getSdks() {
  let app: FirebaseApp;
  if (!getApps().length) {
    // When running on the server, we must initialize with the config object.
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  return {
    firestore: getFirestore(app),
  };
}

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_PROJECT_ID ?? "tagabia-a5f3f";
const storageBucket =
  process.env.FIREBASE_STORAGE_BUCKET ?? "tagabia-a5f3f.firebasestorage.app";

function initFirebaseAdmin(): App {
  const existingApp = getApps()[0];
  if (existingApp) {
    return existingApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  }

  return initializeApp({
    credential: cert(JSON.parse(serviceAccountKey)),
    projectId,
    storageBucket,
  });
}

export function getAdminFirestore() {
  return getFirestore(initFirebaseAdmin());
}

export function getAdminStorage() {
  return getStorage(initFirebaseAdmin());
}

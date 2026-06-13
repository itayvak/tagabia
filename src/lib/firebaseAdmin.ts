import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID ?? "tagabia-a5f3f";

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
  });
}

export function getAdminFirestore() {
  return getFirestore(initFirebaseAdmin());
}

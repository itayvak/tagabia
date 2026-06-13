import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwTVF05P-Jjqzu86BKuIK7MFbgBEFyoCQ",
  authDomain: "tagabia-a5f3f.firebaseapp.com",
  projectId: "tagabia-a5f3f",
  storageBucket: "tagabia-a5f3f.firebasestorage.app",
  messagingSenderId: "619055063857",
  appId: "1:619055063857:web:552705c1ec602fc63f8610",
  measurementId: "G-SL5RVPVP82"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// const analytics = getAnalytics(app);
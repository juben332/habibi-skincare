// ============================================================
//  Habibi Skincare — Firebase Configuration
//  Replace the placeholder values below with your actual
//  Firebase project credentials from the Firebase Console.
//  Console → Project Settings → Your Apps → SDK setup
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAMuah7QKl-S2mI4vbRwBxIryjaZZLAVWA",
  authDomain:        "habibi-skincare-ph.firebaseapp.com",
  projectId:         "habibi-skincare-ph",
  storageBucket:     "habibi-skincare-ph.firebasestorage.app",
  messagingSenderId: "912886683524",
  appId:             "1:912886683524:web:219785683a0a87bfe6afd1"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ── Admin whitelist ──────────────────────────────────────────
// Only these emails can access the admin panel.
const ADMIN_EMAILS = ['wardopon123@gmail.com'];

function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email?.toLowerCase());
}

export { app, db, auth, ADMIN_EMAILS, isAdmin };

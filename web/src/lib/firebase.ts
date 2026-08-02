import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBtdzASSqHz2oirxJGl6deGkfIUBMUnO_c",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "totalappgt-d15b9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "totalappgt-d15b9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "totalappgt-d15b9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "776610472252",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:776610472252:web:0044f387d94f1a8918be39",
}

export const app: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig)

export const auth: Auth = getAuth(app)

// 🔥 GÜNCEL Firebase.js - pc-fronted projeniz için
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// pc-fronted Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyAVXZLaHP82q6OfFGfFjZJcIPyVWDc-NT4",
  authDomain: "pc-fronted.firebaseapp.com",
  projectId: "pc-fronted",
  storageBucket: "pc-fronted.firebasestorage.app",
  messagingSenderId: "530921835618",
  appId: "1:530921835618:web:7ad1ca15fa89dca3af553b",
  measurementId: "G-XRPMF11BPM"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Yönetici giriş kontrolü
const firebaseConfigLooksInvalid = () => {
  return !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("PASTE_");
};

// Admin kontrolü
const checkAdminAccess = async (uid) => {
  try {
    const { getDoc, doc } = await import("firebase/firestore");
    const adminDoc = await getDoc(doc(db, "admins", uid));
    return adminDoc.exists();
  } catch (error) {
    console.error("Admin kontrol hatası:", error);
    return false;
  }
};

export { app, analytics, auth, db, googleProvider, firebaseConfigLooksInvalid, checkAdminAccess };

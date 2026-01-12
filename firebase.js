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
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Yönetici giriş kontrolü
export const firebaseConfigLooksInvalid = () => {
  return !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("PASTE_");
};

// Admin yöneticisi (isteğe bağlı)
export const checkAdminAccess = async (uid) => {
  try {
    // Firestore'dan admin kontrolü
    const adminDoc = await getDoc(doc(db, "admins", uid));
    return adminDoc.exists();
  } catch (error) {
    console.error("Admin kontrol hatası:", error);
    return false;
  }
};

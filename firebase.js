// Firebase.js - BASİT VE ÇALIŞAN VERSİYON

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyAVXZLaHP82q6OfFGfFjZJcIPyVWDc-NT4",
  authDomain: "pc-fronted.firebaseapp.com",
  projectId: "pc-fronted",
  storageBucket: "pc-fronted.firebasestorage.app",
  messagingSenderId: "530921835618",
  appId: "1:530921835618:web:7ad1ca15fa89dca3af553b",
  measurementId: "G-XRPMF11BPM"
};

// Firebase'i başlat (index.html'den önce yüklendiği için)
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase başlatıldı");
  } else {
    console.log("✅ Firebase zaten başlatılmış");
  }
} catch (error) {
  console.error("❌ Firebase başlatma hatası:", error);
}

// Firebase nesneleri
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Firebase fonksiyonları
const firebaseFunctions = {
  // Auth fonksiyonları
  onAuthStateChanged: (callback) => auth.onAuthStateChanged(callback),
  signInWithEmailAndPassword: (email, password) => 
    auth.signInWithEmailAndPassword(email, password),
  createUserWithEmailAndPassword: (email, password) => 
    auth.createUserWithEmailAndPassword(email, password),
  signInWithPopup: () => auth.signInWithPopup(googleProvider),
  signOut: () => auth.signOut(),
  
  // Firestore fonksiyonları
  collection: (path) => db.collection(path),
  doc: (path) => db.doc(path),
  getDocs: (query) => query.get(),
  setDoc: (docRef, data) => docRef.set(data),
  deleteDoc: (docRef) => docRef.delete(),
  getDoc: (docRef) => docRef.get()
};

// Global erişim için
window.firebaseApp = {
  auth,
  db,
  googleProvider,
  ...firebaseFunctions
};

console.log("✅ Firebase hazır");

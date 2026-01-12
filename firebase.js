// firebase.js - DÜZELTİLMİŞ VERSİYON
console.log("Firebase JS yüklendi");

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

// CDN'den Firebase yükle (Mobil uyumlu)
function loadFirebase() {
  return new Promise((resolve) => {
    if (window.firebase) {
      console.log("Firebase zaten yüklü");
      resolve();
      return;
    }
    
    // Firebase SDK'yı CDN'den yükle
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js';
    script.onload = () => {
      console.log("Firebase App yüklendi");
      
      // Auth modülü
      const authScript = document.createElement('script');
      authScript.src = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js';
      authScript.onload = () => {
        console.log("Firebase Auth yüklendi");
        
        // Firestore modülü
        const firestoreScript = document.createElement('script');
        firestoreScript.src = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js';
        firestoreScript.onload = () => {
          console.log("Firebase Firestore yüklendi");
          
          // Firebase'i başlat
          window.firebase.initializeApp(firebaseConfig);
          console.log("Firebase başlatıldı");
          resolve();
        };
        document.head.appendChild(firestoreScript);
      };
      document.head.appendChild(authScript);
    };
    document.head.appendChild(script);
  });
}

// Firebase nesneleri
let auth, db, googleProvider;

// Firebase'i başlat ve nesneleri al
async function initFirebase() {
  await loadFirebase();
  
  auth = window.firebase.auth();
  db = window.firebase.firestore();
  googleProvider = new window.firebase.auth.GoogleAuthProvider();
  
  console.log("Firebase nesneleri hazır");
  return { auth, db, googleProvider };
}

// Kullanım için dışa aktar
export { initFirebase };

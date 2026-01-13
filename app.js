// app.js - Fiyat Takip Uygulaması (TÜM EKSİKLER DÜZELTİLDİ)

// ========== GLOBAL DEĞİŞKENLER ==========
const $ = (id) => document.getElementById(id);

// API konfigürasyonu
const DEFAULT_API_URL = "https://pc-scraper-backend.onrender.com";
let API_URL = localStorage.getItem('fiyattakip_api_url') || DEFAULT_API_URL;

// Sayfalama
let currentPage = 1;
let currentSort = 'asc';
let currentSearch = '';
let totalPages = 1;
let allProducts = [];

// Favoriler
let favCache = [];

// Sepet sistemi
let cartItems = JSON.parse(localStorage.getItem('fiyattakip_cart') || '[]');
let cartTotal = 0;

// Current user
window.currentUser = null;

// ========== SİTE LİSTESİ (DOLAP DÜZELTMESİ) ==========
const SITES = [
  // YENİ E-TİCARET
  { 
    key: "trendyol", 
    name: "Trendyol", 
    build: q => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}&qt=${encodeURIComponent(q)}&st=${encodeURIComponent(q)}&os=1`
  },
  { 
    key: "hepsiburada", 
    name: "Hepsiburada", 
    build: q => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}`
  },
  { 
    key: "n11", 
    name: "N11", 
    build: q => `https://www.n11.com/arama?q=${encodeURIComponent(q)}`
  },
  { 
    key: "amazontr", 
    name: "Amazon TR", 
    build: q => `https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}`
  },
  { 
    key: "pazarama", 
    name: "Pazarama", 
    build: q => `https://www.pazarama.com/arama?q=${encodeURIComponent(q)}`
  },
  { 
    key: "ciceksepeti", 
    name: "ÇiçekSepeti", 
    build: q => `https://www.ciceksepeti.com/arama?query=${encodeURIComponent(q)}`
  },
  { 
    key: "idefix", 
    name: "idefix", 
    build: q => `https://www.idefix.com/arama/?q=${encodeURIComponent(q)}`
  },
  
  // TEKNOLOJİ MAĞAZALARI
  { 
    key: "teknosa", 
    name: "Teknosa", 
    build: q => {
      const encodedQ = encodeURIComponent(q);
      return `https://www.teknosa.com/arama/?s=${encodedQ}&sira=price_asc`;
    }
  },
  { 
    key: "mediamarkt", 
    name: "MediaMarkt", 
    build: q => {
      const encodedQ = encodeURIComponent(q);
      return `https://www.mediamarkt.com.tr/tr/search.html?query=${encodedQ}&sort=currentprice+asc`;
    }
  },
  { 
    key: "vatan", 
    name: "Vatan Bilgisayar", 
    build: q => {
      const encodedQ = encodeURIComponent(q);
      return `https://www.vatanbilgisayar.com/arama/${encodedQ}/?order=price_asc`;
    }
  },
  
  // DİĞER
  { 
    key: "pttavm", 
    name: "PTT AVm", 
    build: q => `https://www.pttavm.com/arama?q=${encodeURIComponent(q)}`
  }
];

// İKİNCİ EL SİTELER (DOLAP DÜZELTMESİ)
const SECOND_HAND_SITES = [
  { 
    key: "sahibinden", 
    name: "Sahibinden", 
    build: q => {
      const encodedQ = encodeURIComponent(q);
      return `https://www.sahibinden.com/bilgisayar?query_text_mf=${encodedQ}&query_text=${encodedQ}&sorting=price_asc`;
    }
  },
  { 
    key: "dolap", 
    name: "Dolap", 
    build: q => {
      const encodedQ = encodeURIComponent(q);
      return `https://www.dolap.com/ara?q=${encodedQ}&sort=price_asc&sira=artan-fiyat`;
    }
  },
  { 
    key: "letgo", 
    name: "Letgo", 
    build: q => {
      const encodedQ = encodeURIComponent(q);
      return `https://www.letgo.com/arama?query_text=${encodedQ}&isSearchCall=true&sorting=asc-price`;
    }
  }
];

// ========== TEMEL FONKSİYONLAR ==========
function toast(msg, type = 'info') {
  const t = $("toast");
  if (!t) { 
    console.log("[TOAST]", msg); 
    return; 
  }
  
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 2200);
}

function showPage(key) {
  console.log("Sayfa değiştiriliyor:", key);
  
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  const page = $(`page-${key}`);
  if (page) {
    page.classList.add("active");
    console.log("Sayfa aktif:", key);
  }

  const tab = document.querySelector(`.tab[data-page="${key}"]`);
  if (tab) {
    tab.classList.add("active");
    console.log("Tab aktif:", key);
  }

  if (key === 'favs') {
    renderFavoritesPage(window.currentUser?.uid);
  } else if (key === 'home') {
    renderRecentSearches();
  } else if (key === 'cart') {
    renderCartPage();
  } else if (key === 'search') {
    const query = $("qNormal")?.value;
    if (query && query.trim()) {
      renderSiteList($("normalList"), query);
    } else {
      $("normalList").innerHTML = `
        <div class="emptySearchState">
          <div class="emptyIcon">🔍</div>
          <h3>Arama Yapın</h3>
          <p>Ürün adını yazıp arama yaparak başlayın</p>
        </div>
      `;
    }
  }
}

// ========== LOGIN SİSTEMİ ==========
function openLogin() {
  console.log("Login modal açılıyor");
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    
    // Formları sıfırla
    $("loginEmail").value = "";
    $("loginPass").value = "";
    $("regEmail").value = "";
    $("regPass").value = "";
    $("regPass2").value = "";
    
    // Giriş sekmesini aktif yap
    $("tabLogin").click();
  }
}

function closeLogin() {
  console.log("Login modal kapatılıyor");
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }
}

async function doEmailLogin(isRegister = false) {
  console.log("Email login başlatıldı:", isRegister ? "Kayıt" : "Giriş");
  
  try {
    let email, password;
    
    if (isRegister) {
      email = $("regEmail")?.value;
      password = $("regPass")?.value;
      const password2 = $("regPass2")?.value;
      
      if (!email || !password) {
        toast("E-posta ve şifre gerekli", "error");
        return;
      }
      
      if (password !== password2) {
        toast("Şifreler uyuşmuyor", "error");
        return;
      }
      
      if (password.length < 6) {
        toast("Şifre en az 6 karakter olmalı", "error");
        return;
      }
      
      await window.firebaseApp.createUserWithEmailAndPassword(email, password);
      toast("Hesap oluşturuldu! Giriş yapılıyor...", "success");
      
    } else {
      email = $("loginEmail")?.value;
      password = $("loginPass")?.value;
      
      if (!email || !password) {
        toast("E-posta ve şifre gerekli", "error");
        return;
      }
      
      await window.firebaseApp.signInWithEmailAndPassword(email, password);
      toast("Giriş başarılı!", "success");
    }
    
    closeLogin();
    
  } catch (error) {
    console.error("Giriş hatası:", error);
    let errorMsg = "Giriş başarısız";
    
    if (error.code === 'auth/user-not-found') {
      errorMsg = "Kullanıcı bulunamadı";
    } else if (error.code === 'auth/wrong-password') {
      errorMsg = "Yanlış şifre";
    } else if (error.code === 'auth/email-already-in-use') {
      errorMsg = "Bu e-posta zaten kullanımda";
    } else if (error.code === 'auth/weak-password') {
      errorMsg = "Şifre çok zayıf";
    }
    
    toast(errorMsg, "error");
  }
}

async function doGoogleLogin() {
  console.log("Google login başlatıldı");
  try {
    await window.firebaseApp.signInWithPopup();
    toast("Google ile giriş başarılı!", "success");
    closeLogin();
  } catch (error) {
    console.error("Google giriş hatası:", error);
    toast("Google girişi başarısız", "error");
  }
}

// ========== ARAMA SİSTEMİ ==========
function setSearchMode(mode) {
  console.log("Arama modu değiştiriliyor:", mode);
  localStorage.setItem("searchMode", mode);
  
  // Butonları güncelle
  document.querySelectorAll('.modeBtn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "normal") {
    $("modeNormal")?.classList.add('active');
  } else if (mode === "fiyat") {
    $("modeFiyat")?.classList.add('active');
  } else if (mode === "ai") {
    $("modeAI")?.classList.add('active');
  }
  
  const hint = $("modeHint");
  if (hint) {
    const hints = {
      "normal": "Tüm sitelerde arama yap",
      "fiyat": "Gerçek fiyatları karşılaştır",
      "ai": "AI ile optimize edilmiş arama"
    };
    hint.textContent = hints[mode] || "";
  }
}

function getSearchMode() {
  return localStorage.getItem("searchMode") || "normal";
}

// ARAMA TÜRÜ SEÇİMİ
function setSearchType(type) {
  console.log("Arama türü değiştiriliyor:", type);
  localStorage.setItem("searchType", type);
  
  // Butonları güncelle
  document.querySelectorAll('.searchTypeBtn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (type === "all") {
    $("searchTypeAll")?.classList.add('active');
  } else if (type === "new") {
    $("searchTypeNew")?.classList.add('active');
  } else if (type === "secondhand") {
    $("searchTypeSecondHand")?.classList.add('active');
  }
  
  // Eğer arama sayfasındaysak yenile
  if ($("page-search")?.classList.contains("active")) {
    const query = $("qNormal")?.value;
    if (query && query.trim()) {
      renderSiteList($("normalList"), query);
    }
  }
}

function getSearchType() {
  return localStorage.getItem("searchType") || "all";
}

// SİTE LİSTESİNİ GÖSTER (GÜNCELLENMİŞ)
function renderSiteList(container, query) {
  console.log("Site listesi render ediliyor:", query);
  
  if (!container) return;
  const q = String(query || "").trim();
  
  if (!q) {
    container.innerHTML = `<div class="cardBox"><b>Lütfen bir arama terimi girin.</b></div>`;
    return;
  }

  container.innerHTML = "";
  
  // Arama türüne göre siteleri seç
  let sitesToShow = [];
  const searchType = getSearchType();
  
  if (searchType === "all") {
    sitesToShow = [...SITES, ...SECOND_HAND_SITES];
  } else if (searchType === "new") {
    sitesToShow = SITES;
  } else if (searchType === "secondhand") {
    sitesToShow = SECOND_HAND_SITES;
  }
  
  // Filtreleme: alakasız kelimeleri temizle
  const cleanQuery = filterIrrelevantWords(q);
  
  // Kategoriye özel linkler
  const isPCSearch = cleanQuery.toLowerCase().includes('ram') || 
                     cleanQuery.toLowerCase().includes('ddr') ||
                     cleanQuery.toLowerCase().includes('işlemci') ||
                     cleanQuery.toLowerCase().includes('ekran kartı') ||
                     cleanQuery.toLowerCase().includes('anakart') ||
                     cleanQuery.toLowerCase().includes('ssd') ||
                     cleanQuery.toLowerCase().includes('hdd');
  
  let html = '';
  
  // Banner gösterme
  if (searchType === "secondhand") {
    html += `
      <div class="categoryBanner secondhand">
        <div class="bannerIcon">🔄</div>
        <div class="bannerContent">
          <div class="bannerTitle">İkinci El Arama</div>
          <div class="bannerSub">Sahibinden, Dolap, Letgo</div>
        </div>
      </div>
    `;
  } else if (searchType === "new") {
    html += `
      <div class="categoryBanner new">
        <div class="bannerIcon">🛍️</div>
        <div class="bannerContent">
          <div class="bannerTitle">Yeni Ürün Arama</div>
          <div class="bannerSub">Trendyol, Hepsiburada, Amazon, Teknosa</div>
        </div>
      </div>
    `;
  }
  
  // PC bileşeni ise özel mesaj
  if (isPCSearch) {
    html += `
      <div class="pcSpecialBanner">
        <div class="pcIcon">💻</div>
        <div class="pcContent">
          <div class="pcTitle">PC Bileşeni Tespit Edildi</div>
          <div class="pcSub">En düşük fiyatlı sonuçlar gösteriliyor</div>
        </div>
      </div>
    `;
  }
  
  // Site listesi
  sitesToShow.forEach(site => {
    let url = site.build(cleanQuery);
    
    // Özel kategori linkleri
    if (isPCSearch && site.key === "sahibinden") {
      url = `https://www.sahibinden.com/bilgisayar?query_text=${encodeURIComponent(cleanQuery)}&sorting=price_asc`;
    }
    
    html += `
      <div class="siteCard modernCard">
        <div class="siteHeader">
          <div class="siteIcon">${getSiteIcon(site.key)}</div>
          <div class="siteInfo">
            <div class="siteName">${site.name}</div>
            <div class="siteQuery">${cleanQuery}</div>
            <div class="siteBadge ${SECOND_HAND_SITES.includes(site) ? 'secondhandBadge' : 'newBadge'}">
              ${SECOND_HAND_SITES.includes(site) ? '🔄 İkinci El' : '🛍️ Yeni'}
            </div>
          </div>
        </div>
        <div class="siteActions">
          <button class="modernBtn primary" onclick="window.open('${url}', '_blank')">
            <span class="btnIcon">🔍</span>
            <span>Ara</span>
          </button>
          <button class="modernBtn ghost" onclick="copyToClipboard('${url}')">
            <span class="btnIcon">⧉</span>
            <span>Kopyala</span>
          </button>
          <button class="modernBtn fav" 
                  data-fav-url="${url}" 
                  data-site-key="${site.key}" 
                  data-site-name="${site.name}" 
                  data-query="${cleanQuery}">
            <span class="btnIcon favIcon">🤍</span>
            <span>Favori</span>
          </button>
          <button class="modernBtn cart" onclick="addToCartFromSite('${site.name}', '${cleanQuery}', '${url}')">
            <span class="btnIcon">🛒</span>
            <span>Sepet</span>
          </button>
        </div>
        <div class="siteFooter">
          <span class="priceSortBadge">⬆️ En Düşük Fiyat</span>
          <span class="relevanceBadge">🎯 İlgili Sonuçlar</span>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Event listener'ları ekle
  attachEventListeners();
  applyFavUI();
  updateCartButtonStates();
}

// Alakasız kelimeleri filtrele
function filterIrrelevantWords(query) {
  const irrelevantWords = [
    'kılıf', 'case', 'cover', 'şarj', 'charger', 'kulaklık', 'headphone',
    'kablo', 'cable', 'sticker', 'etiket', 'temizlik', 'clean', 'kit',
    'aksesuar', 'accessory', 'koruma', 'protection', 'film', 'screen'
  ];
  
  const words = query.toLowerCase().split(' ');
  const filteredWords = words.filter(word => {
    // Kelime uzunluğu 2'den kısa ise atla
    if (word.length < 3) return false;
    
    // Rakam içeriyorsa tut (örneğin: "8gb", "ddr4")
    if (/\d/.test(word)) return true;
    
    // Teknoloji terimlerini tut
    const techTerms = [
      'ram', 'ddr', 'gb', 'tb', 'ghz', 'mhz', 'rtx', 'gtx', 'rx',
      'intel', 'amd', 'nvidia', 'core', 'ryzen', 'i5', 'i7', 'i9',
      'ssd', 'hdd', 'nvme', 'm2', 'sata', 'usb', 'hdmi', 'displayport'
    ];
    
    if (techTerms.includes(word)) return true;
    
    // Alakasız kelime değilse tut
    return !irrelevantWords.includes(word);
  });
  
  return filteredWords.join(' ') || query;
}

// Site icon'ları
function getSiteIcon(siteKey) {
  const icons = {
    'trendyol': '🛍️',
    'hepsiburada': '📦',
    'n11': '🔟',
    'amazontr': '📦',
    'pazarama': '🛒',
    'ciceksepeti': '💐',
    'idefix': '📚',
    'teknosa': '💻',
    'mediamarkt': '📺',
    'vatan': '💻',
    'pttavm': '📮',
    'sahibinden': '🏠',
    'dolap': '👗',
    'letgo': '🔄'
  };
  
  return icons[siteKey] || '🔍';
}

// ========== FAVORİ SİSTEMİ ==========
async function toggleFavorite(userId, favoriteData) {
  console.log("Favori toggle:", favoriteData);
  
  if (!userId) {
    toast("Önce giriş yapmalısınız", "error");
    openLogin();
    return;
  }

  try {
    const favRef = window.firebaseApp.getUserFavoritesRef(userId);
    const query = window.firebaseApp.query(favRef, 'url', '==', favoriteData.url);
    const snapshot = await window.firebaseApp.getDocs(query);

    if (snapshot.empty) {
      // Favoriye ekle
      await window.firebaseApp.addDoc(favRef, {
        ...favoriteData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast("Favorilere eklendi ❤️", "success");
    } else {
      // Favoriden çıkar
      const docId = snapshot.docs[0].id;
      await window.firebaseApp.deleteDoc(window.firebaseApp.doc(`users/${userId}/favorites/${docId}`));
      toast("Favorilerden çıkarıldı", "info");
    }
    
    await loadFavorites(userId);
    applyFavUI();
  } catch (error) {
    console.error("Favori hatası:", error);
    toast("Favori işlemi başarısız", "error");
  }
}

async function loadFavorites(userId) {
  try {
    if (!userId) {
      favCache = [];
      return;
    }
    
    const favRef = window.firebaseApp.getUserFavoritesRef(userId);
    const snapshot = await window.firebaseApp.getDocs(favRef);
    favCache = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log("Favoriler yüklendi:", favCache.length);
    updateFavCounter();
  } catch (error) {
    console.error("Favori yükleme hatası:", error);
    favCache = [];
  }
}

function updateFavCounter() {
  const counter = $("favCount");
  if (counter) {
    counter.textContent = favCache.length;
  }
}

function applyFavUI() {
  document.querySelectorAll('.modernBtn.fav').forEach(btn => {
    const url = btn.getAttribute('data-fav-url');
    const isFav = favCache.some(fav => fav.url === url);
    const favIcon = btn.querySelector('.favIcon');
    
    if (isFav) {
      if (favIcon) favIcon.textContent = '❤️';
      btn.classList.add('isFav');
    } else {
      if (favIcon) favIcon.textContent = '🤍';
      btn.classList.remove('isFav');
    }
  });
}

async function renderFavoritesPage(userId) {
  console.log("Favoriler sayfası render ediliyor");
  
  if (!userId) {
    $("favList").innerHTML = `
      <div class="emptyFavState">
        <div class="emptyIcon">🔒</div>
        <h3>Giriş Yapın</h3>
        <p>Favorilerinizi görmek için giriş yapın</p>
        <button class="btnPrimary" onclick="openLogin()">Giriş Yap</button>
      </div>
    `;
    return;
  }

  await loadFavorites(userId);
  
  if (favCache.length === 0) {
    $("favList").innerHTML = `
      <div class="emptyFavState">
        <div class="emptyIcon">❤️</div>
        <h3>Favori Yok</h3>
        <p>Arama sonuçlarından favorilere ekleyin</p>
      </div>
    `;
    return;
  }

  let html = '';
  favCache.forEach(fav => {
    html += `
      <div class="siteCard modernCard">
        <div class="siteHeader">
          <div class="siteIcon">${getSiteIcon(fav.siteKey)}</div>
          <div class="siteInfo">
            <div class="siteName">${fav.siteName}</div>
            <div class="siteQuery">${fav.query}</div>
            <div class="siteBadge ${SECOND_HAND_SITES.some(s => s.key === fav.siteKey) ? 'secondhandBadge' : 'newBadge'}">
              ${SECOND_HAND_SITES.some(s => s.key === fav.siteKey) ? '🔄 İkinci El' : '🛍️ Yeni'}
            </div>
          </div>
        </div>
        <div class="siteActions">
          <button class="modernBtn primary" onclick="window.open('${fav.url}', '_blank')">
            <span class="btnIcon">🔍</span>
            <span>Ara</span>
          </button>
          <button class="modernBtn ghost" onclick="copyToClipboard('${fav.url}')">
            <span class="btnIcon">⧉</span>
            <span>Kopyala</span>
          </button>
          <button class="modernBtn fav isFav" onclick="removeFavorite('${userId}', '${fav.id}')">
            <span class="btnIcon">❤️</span>
            <span>Kaldır</span>
          </button>
        </div>
      </div>
    `;
  });

  $("favList").innerHTML = html;
}

async function removeFavorite(userId, favId) {
  try {
    await window.firebaseApp.deleteDoc(window.firebaseApp.doc(`users/${userId}/favorites/${favId}`));
    await loadFavorites(userId);
    renderFavoritesPage(userId);
    toast("Favoriden çıkarıldı", "info");
  } catch (error) {
    console.error("Favori silme hatası:", error);
    toast("Favori silinemedi", "error");
  }
}

// ========== COPY LINK SİSTEMİ ==========
async function copyToClipboard(text) {
  console.log("Kopyalama işlemi:", text.substring(0, 50) + "...");
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      toast("Link kopyalandı! 📋", "success");
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast("Link kopyalandı! 📋", "success");
    }
  } catch (error) {
    console.error("Copy error:", error);
    toast("Kopyalama başarısız", "error");
  }
}

// ========== SEPET SİSTEMİ ==========
function addToCartFromSite(siteName, query, url) {
  console.log("Sepete ekleniyor:", siteName, query);
  const product = {
    title: `${siteName}: ${query}`,
    price: "Arama sonucu",
    site: siteName,
    link: url,
    type: "search_link",
    addedAt: new Date().toISOString()
  };
  
  addToCart(product);
}

function addToCart(product) {
  console.log("Sepete ekle:", product.title);
  
  // Check if already in cart
  const existingIndex = cartItems.findIndex(item => item.link === product.link);
  
  if (existingIndex > -1) {
    // Increase quantity if already in cart
    cartItems[existingIndex].quantity += 1;
    toast(`"${product.title.substring(0,30)}..." miktarı arttırıldı`, "info");
  } else {
    // Add new item to cart
    const cartItem = {
      id: 'cart_' + Date.now() + Math.random().toString(36).substr(2, 9),
      title: product.title || product.urun || "Ürün",
      price: product.price || product.fiyat || "₺???",
      site: product.site || "",
      link: product.link || "",
      quantity: 1,
      addedAt: new Date().toISOString()
    };
    
    cartItems.push(cartItem);
    toast(`"${cartItem.title.substring(0,30)}..." sepete eklendi`, "success");
  }
  
  localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  updateCartCounter();
  updateCartButtonStates();
  
  if ($("page-cart")?.classList.contains("active")) {
    renderCartPage();
  }
}

function removeFromCart(itemId) {
  console.log("Sepetten çıkar:", itemId);
  cartItems = cartItems.filter(item => item.id !== itemId);
  localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  updateCartCounter();
  updateCartButtonStates();
  renderCartPage();
  toast("Ürün sepetten çıkarıldı", "info");
}

function updateCartQuantity(itemId, newQuantity) {
  console.log("Sepet miktarı güncelle:", itemId, newQuantity);
  if (newQuantity < 1) {
    removeFromCart(itemId);
    return;
  }
  
  const itemIndex = cartItems.findIndex(item => item.id === itemId);
  if (itemIndex > -1) {
    cartItems[itemIndex].quantity = newQuantity;
    localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
    updateCartCounter();
    renderCartPage();
  }
}

function clearCart() {
  console.log("Sepet temizleniyor");
  if (cartItems.length === 0) {
    toast("Sepet zaten boş", "info");
    return;
  }
  
  if (confirm("Sepeti tamamen boşaltmak istediğinize emin misiniz?")) {
    cartItems = [];
    localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
    updateCartCounter();
    updateCartButtonStates();
    renderCartPage();
    toast("Sepet temizlendi", "success");
  }
}

function checkoutCart() {
  console.log("Ödeme işlemi başlatılıyor");
  if (cartItems.length === 0) {
    toast("Sepet boş", "error");
    return;
  }
  
  const message = `Sepetinizde ${cartItems.length} ürün var. Toplam: ${formatPrice(cartTotal)}`;
  toast(message, "info");
  
  // Here you would typically redirect to checkout page
  // For now, just show a message
  setTimeout(() => {
    if (confirm("Siparişi tamamlamak istiyor musunuz?")) {
      toast("Siparişiniz alındı! (Demo)", "success");
    }
  }, 500);
}

function renderCartPage() {
  console.log("Sepet sayfası render ediliyor");
  const cartList = $("cartList");
  const cartSubtotal = $("cartSubtotal");
  const cartTotalPrice = $("cartTotalPrice");
  const cartItemCount = $("cartItemCount");
  
  if (!cartList) return;
  
  if (cartItems.length === 0) {
    cartList.innerHTML = `
      <div class="emptyCartState">
        <div class="emptyIcon">🛒</div>
        <h3>Sepet Boş</h3>
        <p>Arama sonuçlarından sepete ürün ekleyin</p>
        <button class="btnPrimary" onclick="showPage('home')">Alışverişe Başla</button>
      </div>
    `;
    
    if (cartSubtotal) cartSubtotal.textContent = "₺0,00";
    if (cartTotalPrice) cartTotalPrice.textContent = "₺0,00";
    if (cartItemCount) cartItemCount.textContent = "0 ürün";
    return;
  }
  
  // Calculate totals
  cartTotal = cartItems.reduce((total, item) => {
    const priceStr = item.price.toString().replace(/[^\d.,]/g, '');
    const price = parseFloat(priceStr.replace(',', '.')) || 0;
    return total + (price * item.quantity);
  }, 0);
  
  // Render cart items
  let html = '';
  cartItems.forEach(item => {
    html += `
      <div class="cartItem modernCard">
        <div class="cartItemHeader">
          <div class="cartItemTitle">${item.title}</div>
          <button class="cartItemRemove" onclick="removeFromCart('${item.id}')">✕</button>
        </div>
        <div class="cartItemDetails">
          <div class="cartItemSite">${item.site}</div>
          <div class="cartItemPrice">${item.price}</div>
        </div>
        <div class="cartItemActions">
          <div class="quantityControls">
            <button class="quantityBtn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">−</button>
            <span class="quantityValue">${item.quantity}</span>
            <button class="quantityBtn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
          </div>
          <a href="${item.link}" target="_blank" class="visitProductBtn">
            Ürüne Git <span class="btnIcon">↗</span>
          </a>
        </div>
      </div>
    `;
  });
  
  cartList.innerHTML = html;
  
  // Update summary
  if (cartSubtotal) cartSubtotal.textContent = formatPrice(cartTotal);
  if (cartTotalPrice) cartTotalPrice.textContent = formatPrice(cartTotal);
  if (cartItemCount) {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartItemCount.textContent = `${totalItems} ürün`;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price);
}

function updateCartCounter() {
  const count = cartItems.length;
  const counter = $("cartCount");
  
  if (counter) {
    counter.textContent = count;
    counter.style.display = count > 0 ? 'flex' : 'none';
  }
  
  // Recalculate total
  cartTotal = cartItems.reduce((total, item) => {
    const priceStr = item.price.toString().replace(/[^\d.,]/g, '');
    const price = parseFloat(priceStr.replace(',', '.')) || 0;
    return total + (price * item.quantity);
  }, 0);
}

function updateCartButtonStates() {
  document.querySelectorAll('.modernBtn.cart').forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick');
    if (onclickAttr) {
      const match = onclickAttr.match(/'([^']+)'/g);
      if (match && match[2]) {
        const url = match[2].replace(/'/g, '');
        const isInCart = cartItems.some(item => item.link === url);
        
        if (isInCart) {
          btn.innerHTML = '<span class="btnIcon">✓</span><span>Sepette</span>';
          btn.classList.add('inCart');
        } else {
          btn.innerHTML = '<span class="btnIcon">🛒</span><span>Sepet</span>';
          btn.classList.remove('inCart');
        }
      }
    }
  });
}

// ========== DİĞER FONKSİYONLAR ==========
function fiyatAra(query) {
  console.log("Fiyat arama başlatıldı:", query);
  toast("Fiyat arama modu aktif (Demo)", "info");
  // Burada gerçek API çağrısı yapılacak
}

function handleRecentSearch(query) {
  let recent = JSON.parse(localStorage.getItem('fiyattakip_recent') || '[]');
  recent = recent.filter(q => q !== query);
  recent.unshift(query);
  if (recent.length > 10) recent = recent.slice(0, 10);
  localStorage.setItem('fiyattakip_recent', JSON.stringify(recent));
  renderRecentSearches();
}

function removeRecentSearch(query) {
  let recent = JSON.parse(localStorage.getItem('fiyattakip_recent') || '[]');
  recent = recent.filter(q => q !== query);
  localStorage.setItem('fiyattakip_recent', JSON.stringify(recent));
  renderRecentSearches();
}

function clearRecentSearches() {
  localStorage.removeItem('fiyattakip_recent');
  renderRecentSearches();
  toast("Son aramalar temizlendi", "info");
}

function renderRecentSearches() {
  const recentList = $("recentList");
  if (!recentList) return;
  
  const recent = JSON.parse(localStorage.getItem('fiyattakip_recent') || '[]');
  
  if (recent.length === 0) {
    recentList.innerHTML = '<div class="recentEmpty">Henüz arama yapılmadı</div>';
    return;
  }
  
  let html = '';
  recent.forEach(query => {
    html += `
      <div class="recentItem" onclick="$('qNormal').value='${query}'; $('btnNormal').click();">
        <span>🔍</span>
        <span>${query}</span>
        <button class="recentRemove" onclick="event.stopPropagation(); removeRecentSearch('${query}')">✕</button>
      </div>
    `;
  });
  
  recentList.innerHTML = html;
}

function cameraAiSearch() {
  toast("Kamera arama özelliği yakında gelecek!", "info");
}

function clearAppCache() {
  if (confirm("Tüm önbelleği temizlemek istediğinize emin misiniz?")) {
    localStorage.clear();
    cartItems = [];
    favCache = [];
    updateCartCounter();
    updateCartButtonStates();
    renderRecentSearches();
    toast("Önbellek temizlendi", "success");
  }
}

function openAPIModal() {
  const modal = document.getElementById("apiModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("show");
  }
}

function closeAPIModal() {
  const modal = document.getElementById("apiModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("show");
  }
}

function saveAPISettings() {
  const url = $("apiUrl")?.value || "";
  if (url) {
    localStorage.setItem('fiyattakip_api_url', url);
    API_URL = url;
    toast("API URL kaydedildi", "success");
  }
  closeAPIModal();
}

function openAIModal() {
  const modal = document.getElementById("aiModal");
  if (modal) {
    modal.style.display = "flex";
    modal.classList.add("show");
  }
}

function closeAIModal() {
  const modal = document.getElementById("aiModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.remove("show");
  }
}

// Event listener'ları ekle
function attachEventListeners() {
  console.log("Event listener'lar ekleniyor...");
  
  // Favori butonları
  document.querySelectorAll('.modernBtn.fav').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      
      if (!window.currentUser) {
        toast("Önce giriş yapmalısınız", "error");
        openLogin();
        return;
      }
      
      const url = btn.getAttribute('data-fav-url');
      const siteKey = btn.getAttribute('data-site-key');
      const siteName = btn.getAttribute('data-site-name');
      const query = btn.getAttribute('data-query');
      
      await toggleFavorite(window.currentUser.uid, { 
        url, 
        siteKey, 
        siteName, 
        query,
        type: "search_link"
      });
    });
  });
  
  // Copy butonları için event delegation
  document.addEventListener("click", async (e) => {
    const copyBtn = e.target.closest('.modernBtn.ghost');
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      
      // URL'yi bul
      const siteCard = copyBtn.closest('.siteCard');
      if (siteCard) {
        const openBtn = siteCard.querySelector('.modernBtn.primary');
        if (openBtn && openBtn.onclick) {
          const onclickStr = openBtn.getAttribute('onclick') || '';
          const match = onclickStr.match(/window\.open\('([^']+)'/);
          if (match && match[1]) {
            await copyToClipboard(match[1]);
          }
        }
      }
    }
  });
}

// ========== ARAMA FONKSİYONU ==========
function performSearch() {
  console.log("Arama başlatılıyor...");
  const query = ($("qNormal")?.value || "").trim();
  
  if (!query) {
    toast("Lütfen bir ürün adı girin", "error");
    return;
  }
  
  console.log("Arama sorgusu:", query);
  
  // Son aramalara ekle
  handleRecentSearch(query);
  
  const mode = getSearchMode();
  console.log("Arama modu:", mode);
  
  if (mode === "fiyat") {
    fiyatAra(query);
  } else {
    showPage("search");
    setTimeout(() => {
      renderSiteList($("normalList"), query);
    }, 100);
  }
}

// ========== UYGULAMA BAŞLANGICI ==========
window.addEventListener("DOMContentLoaded", async () => {
  console.log("Uygulama başlatılıyor...");
  
  // UI bağlantılarını kur
  wireUI();
  
  // Arama modunu ayarla
  setSearchMode(getSearchMode());
  
  // Arama türünü ayarla
  setSearchType(getSearchType());
  
  // Son aramaları yükle
  renderRecentSearches();
  
  // Sepet sayacını güncelle
  updateCartCounter();
  
  // Firebase auth state listener
  window.firebaseApp.onAuthStateChanged(async (user) => {
    window.currentUser = user;
    
    if (user) {
      console.log("Kullanıcı giriş yaptı:", user.email);
      await loadFavorites(user.uid);
      applyFavUI();
      
      // Kullanıcı adını göster
      const userEmail = document.querySelector('.userEmail');
      if (userEmail) {
        userEmail.textContent = user.email;
      }
    } else {
      console.log("Kullanıcı çıkış yaptı");
      favCache = [];
      applyFavUI();
      
      // Kullanıcı adını temizle
      const userEmail = document.querySelector('.userEmail');
      if (userEmail) {
        userEmail.textContent = "Misafir";
      }
    }
  });
  
  console.log("Uygulama hazır!");
});

// ========== WIRE UI GÜNCELLENMİŞ ==========
function wireUI() {
  console.log("UI event listener'ları bağlanıyor...");
  
  // Arama butonu
  const searchBtn = $("btnNormal");
  if (searchBtn) {
    searchBtn.addEventListener("click", performSearch);
    console.log("Arama butonu bağlandı");
  } else {
    console.error("Arama butonu bulunamadı!");
  }

  // Enter tuşu ile arama
  const searchInput = $("qNormal");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch();
      }
    });
    console.log("Enter tuşu bağlandı");
  }

  // Arama modu butonları
  $("modeNormal")?.addEventListener("click", () => {
    setSearchMode("normal");
    console.log("Normal mod seçildi");
  });
  
  $("modeFiyat")?.addEventListener("click", () => {
    setSearchMode("fiyat");
    console.log("Fiyat modu seçildi");
  });
  
  $("modeAI")?.addEventListener("click", () => {
    setSearchMode("ai");
    console.log("AI modu seçildi");
  });
  
  // Arama türü butonları
  $("searchTypeAll")?.addEventListener("click", () => {
    setSearchType("all");
    console.log("Tümü seçildi");
  });
  
  $("searchTypeNew")?.addEventListener("click", () => {
    setSearchType("new");
    console.log("Yeni seçildi");
  });
  
  $("searchTypeSecondHand")?.addEventListener("click", () => {
    setSearchType("secondhand");
    console.log("İkinci El seçildi");
  });
  
  // Tab butonları
  document.querySelectorAll(".tab[data-page]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const page = e.currentTarget.dataset.page;
      console.log("Tab tıklandı:", page);
      showPage(page);
    });
  });

  // Kamera butonu
  $("cameraTabBtn")?.addEventListener("click", cameraAiSearch);

  // Hızlı arama etiketleri
  document.querySelectorAll(".quickTag").forEach(tag => {
    tag.addEventListener("click", () => {
      const query = tag.dataset.query;
      console.log("Hızlı arama:", query);
      $("qNormal").value = query;
      const mode = getSearchMode();
      
      if (mode === "fiyat") {
        fiyatAra(query);
      } else {
        showPage("search");
        setTimeout(() => {
          renderSiteList($("normalList"), query);
        }, 100);
      }
    });
  });

  // Login/Register tabs
  $("tabLogin")?.addEventListener("click", () => {
    $("loginPane").classList.remove("hidden");
    $("registerPane").classList.add("hidden");
    $("tabLogin").classList.add("isActive");
    $("tabRegister").classList.remove("isActive");
  });
  
  $("tabRegister")?.addEventListener("click", () => {
    $("loginPane").classList.add("hidden");
    $("registerPane").classList.remove("hidden");
    $("tabLogin").classList.remove("isActive");
    $("tabRegister").classList.add("isActive");
  });
  
  // Login/Register buttons
  $("btnLogin")?.addEventListener("click", () => doEmailLogin(false));
  $("btnRegister")?.addEventListener("click", () => doEmailLogin(true));
  $("btnGoogleLogin")?.addEventListener("click", doGoogleLogin);
  $("btnGoogleLogin2")?.addEventListener("click", doGoogleLogin);

  // Modal kapatma
  document.querySelectorAll("#closeLogin, #loginBackdrop").forEach(btn => {
    btn.addEventListener("click", closeLogin);
  });
  
  document.querySelectorAll("#closeApi, #apiBackdrop").forEach(btn => {
    btn.addEventListener("click", closeAPIModal);
  });
  
  document.querySelectorAll("#closeAi, #aiBackdrop").forEach(btn => {
    btn.addEventListener("click", closeAIModal);
  });

  // API modal
  $("btnApiSettings")?.addEventListener("click", openAPIModal);
  $("btnSaveApi")?.addEventListener("click", saveAPISettings);

  // AI modal
  $("btnAiSettings")?.addEventListener("click", openAIModal);
  $("btnSaveAI")?.addEventListener("click", () => {
    toast("AI ayarları kaydedildi", "success");
    closeAIModal();
  });

  // Temizleme
  $("btnClearCache")?.addEventListener("click", clearAppCache);
  $("btnClearSearch")?.addEventListener("click", () => {
    $("normalList").innerHTML = "";
    toast("Arama temizlendi", "info");
  });

  // Logout
  $("logoutBtn")?.addEventListener("click", async () => {
    try {
      await window.firebaseApp.signOut();
      toast("Çıkış yapıldı", "info");
      showPage('home');
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }
  });

  // Favori yenileme
  $("btnFavRefresh")?.addEventListener("click", async () => {
    if (!window.currentUser) return openLogin();
    await loadFavorites(window.currentUser.uid);
    renderFavoritesPage(window.currentUser.uid);
    toast("Favoriler yenilendi", "info");
  });

  // Sepet icon
  $("cartIcon")?.addEventListener("click", () => {
    showPage('cart');
    renderCartPage();
  });
  
  console.log("Tüm event listener'lar bağlandı");
}

// GLOBAL FONKSİYONLAR
window.showPage = showPage;
window.fiyatAra = fiyatAra;
window.copyToClipboard = copyToClipboard;
window.handleRecentSearch = handleRecentSearch;
window.removeRecentSearch = removeRecentSearch;
window.cameraAiSearch = cameraAiSearch;
window.addToCart = addToCart;
window.addToCartFromSite = addToCartFromSite;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.checkoutCart = checkoutCart;
window.setSearchType = setSearchType;
window.openLogin = openLogin;
window.closeLogin = closeLogin;
window.doEmailLogin = doEmailLogin;
window.doGoogleLogin = doGoogleLogin;
window.toggleFavorite = toggleFavorite;
window.removeFavorite = removeFavorite;
window.performSearch = performSearch;

console.log("App.js yüklendi!");

// app.js - Fiyat Takip Uygulaması (GÜNCELLENMİŞ)

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

// ========== SİTE LİSTESİ (GÜNCELLENMİŞ - Teknobiyotik ve GittiGidiyor KALDIRILDI) ==========
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

// İKİNCİ EL SİTELER (AYRI LİSTE)
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
      return `https://www.dolap.com/ara?q=${encodedQ}&sort=price_asc`;
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
  if (!t) { console.log(msg); return; }
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 2200);
}

function showPage(key) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

  const page = $(`page-${key}`);
  if (page) page.classList.add("active");

  const tab = document.querySelector(`.tab[data-page="${key}"]`);
  if (tab) tab.classList.add("active");

  if (key === 'favs') renderFavoritesPage(window.currentUser?.uid);
  if (key === 'home') renderRecentSearches();
  if (key === 'cart') renderCartPage();
  if (key === 'search') {
    const query = $("qNormal")?.value;
    if (query) {
      renderSiteList($("normalList"), query);
    }
  }
}

// ========== ARAMA SİSTEMİ ==========
function setSearchMode(mode) {
  localStorage.setItem("searchMode", mode);
  $("modeNormal")?.classList.toggle("active", mode === "normal");
  $("modeFiyat")?.classList.toggle("active", mode === "fiyat");
  $("modeAI")?.classList.toggle("active", mode === "ai");
  
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
  localStorage.setItem("searchType", type);
  $("searchTypeAll")?.classList.toggle("active", type === "all");
  $("searchTypeNew")?.classList.toggle("active", type === "new");
  $("searchTypeSecondHand")?.classList.toggle("active", type === "secondhand");
  
  // Eğer arama sayfasındaysak yenile
  if ($("page-search")?.classList.contains("active")) {
    const query = $("qNormal")?.value;
    if (query) {
      renderSiteList($("normalList"), query);
    }
  }
}

function getSearchType() {
  return localStorage.getItem("searchType") || "all";
}

// SİTE LİSTESİNİ GÖSTER (GÜNCELLENMİŞ - Arama türüne göre filtreleme)
function renderSiteList(container, query) {
  if (!container) return;
  const q = String(query || "").trim();
  
  if (!q) {
    container.innerHTML = `<div class="cardBox"><b>Bir şey yaz.</b></div>`;
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
            <div class="siteBadge ${site.key.includes('secondhand') ? 'secondhandBadge' : 'newBadge'}">
              ${site.key.includes('secondhand') ? '🔄 İkinci El' : '🛍️ Yeni'}
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
            <span class="btnIcon">🤍</span>
            <span>Favori</span>
          </button>
          <button class="modernBtn cart" data-cart-url="${url}">
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

// Event listener'ları ekle
function attachEventListeners() {
  // Favori butonları
  document.querySelectorAll('.modernBtn.fav').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!window.currentUser) return openLogin();
      
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
  
  // Sepet butonları
  document.querySelectorAll('.modernBtn.cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-cart-url');
      const siteCard = btn.closest('.siteCard');
      const siteName = siteCard?.querySelector('.siteName')?.textContent || '';
      const query = siteCard?.querySelector('.siteQuery')?.textContent || '';
      
      addToCart({
        title: `${siteName}: ${query}`,
        price: "Arama sonucu",
        site: siteName,
        link: url,
        type: "search_link"
      });
    });
  });
}

// ========== SEPET SİSTEMİ ==========
function addToCart(product) {
  if (cartItems.some(item => item.link === product.link)) {
    toast("Bu ürün zaten sepette", "info");
    return;
  }
  
  const cartItem = {
    id: 'cart_' + Date.now(),
    title: product.title || product.urun || "Ürün",
    price: product.price || product.fiyat || "₺???",
    site: product.site || "",
    link: product.link || "",
    quantity: 1,
    addedAt: new Date().toISOString()
  };
  
  cartItems.push(cartItem);
  localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  
  updateCartCounter();
  updateCartButtonStates();
  
  toast(`"${cartItem.title.substring(0,30)}..." sepete eklendi`, "success");
}

function updateCartCounter() {
  const count = cartItems.length;
  const counter = $("cartCount");
  
  if (counter) {
    counter.textContent = count;
    counter.style.display = count > 0 ? 'flex' : 'none';
  }
  
  cartTotal = cartItems.reduce((total, item) => {
    const priceStr = item.price.toString().replace(/[^\d.,]/g, '');
    const price = parseFloat(priceStr.replace(',', '.')) || 0;
    return total + (price * item.quantity);
  }, 0);
}

function updateCartButtonStates() {
  document.querySelectorAll('.modernBtn.cart').forEach(btn => {
    const url = btn.getAttribute('data-cart-url');
    const isInCart = cartItems.some(item => item.link === url);
    
    if (isInCart) {
      btn.innerHTML = '<span class="btnIcon">✓</span><span>Sepette</span>';
      btn.classList.add('inCart');
    } else {
      btn.innerHTML = '<span class="btnIcon">🛒</span><span>Sepet</span>';
      btn.classList.remove('inCart');
    }
  });
}

// Kalan fonksiyonlar aynı kalacak (toast, showPage, favori sistemi, vs.)
// Sadece yukarıdaki değişen kısımları gösterdim.

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
    } else {
      console.log("Kullanıcı çıkış yaptı");
      favCache = [];
      applyFavUI();
    }
  });
  
  console.log("Uygulama hazır!");
});

// ========== WIRE UI GÜNCELLENMİŞ ==========
function wireUI() {
  // Arama butonu
  $("btnNormal")?.addEventListener("click", () => {
    const query = ($("qNormal")?.value || "").trim();
    if (!query) return toast("Ürün adı girin", "error");
    
    const mode = getSearchMode();
    if (mode === "fiyat") {
      fiyatAra(query);
    } else {
      showPage("search");
      renderSiteList($("normalList"), query);
    }
  });

  // Enter tuşu ile arama
  $("qNormal")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      $("btnNormal").click();
    }
  });

  // Arama modu butonları
  $("modeNormal")?.addEventListener("click", () => setSearchMode("normal"));
  $("modeFiyat")?.addEventListener("click", () => setSearchMode("fiyat"));
  $("modeAI")?.addEventListener("click", () => setSearchMode("ai"));
  
  // Arama türü butonları
  $("searchTypeAll")?.addEventListener("click", () => setSearchType("all"));
  $("searchTypeNew")?.addEventListener("click", () => setSearchType("new"));
  $("searchTypeSecondHand")?.addEventListener("click", () => setSearchType("secondhand"));
  
  // Tab butonları
  document.querySelectorAll(".tab[data-page]").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });

  // Kamera butonu
  $("cameraTabBtn")?.addEventListener("click", cameraAiSearch);

  // Hızlı arama etiketleri
  document.querySelectorAll(".quickTag").forEach(tag => {
    tag.addEventListener("click", () => {
      const query = tag.dataset.query;
      $("qNormal").value = query;
      const mode = getSearchMode();
      
      if (mode === "fiyat") {
        fiyatAra(query);
      } else {
        showPage("search");
        renderSiteList($("normalList"), query);
      }
    });
  });

  // Copy butonları
  document.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.("[data-copy-url]");
    if (!btn) return;
    const url = btn.getAttribute("data-copy-url") || "";
    if (url) await copyToClipboard(url);
  });

  // Login/Register
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
}

// GLOBAL FONKSİYONLAR
window.showPage = showPage;
window.fiyatAra = fiyatAra;
window.copyToClipboard = copyToClipboard;
window.handleRecentSearch = handleRecentSearch;
window.removeRecentSearch = removeRecentSearch;
window.cameraAiSearch = cameraAiSearch;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.checkoutCart = checkoutCart;
window.setSearchType = setSearchType;

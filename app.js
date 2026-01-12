// app.js - Fiyat Takip Uygulaması

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

// ========== SİTE LİSTESİ (GÜNCELLENMİŞ URL'ler) ==========
const SITES = [
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
  
  // İKİNCİ EL SİTELER (GÜNCELLENDİ)
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
  },
  { 
    key: "gittigidiyor", 
    name: "GittiGidiyor", 
    build: q => {
      const encodedQ = encodeURIComponent(q);
      return `https://www.gittigidiyor.com/arama/?k=${encodedQ}&sra=PriceLow`;
    }
  },
  
  // TEKNOLOJİ MAĞAZALARI (GÜNCELLENDİ)
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
  },
  { 
    key: "teknobiyotik", 
    name: "Teknobiyotik", 
    build: q => `https://www.teknobiyotik.com/search?text=${encodeURIComponent(q)}`
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
      "normal": "Link modu: Sadece arama linkleri oluşturur",
      "fiyat": "Fiyat modu: Gerçek fiyatları çeker (Render API)",
      "ai": "AI modu: AI ile optimize edilmiş arama"
    };
    hint.textContent = hints[mode] || "";
  }
}

function getSearchMode() {
  return localStorage.getItem("searchMode") || "normal";
}

function renderSiteList(container, query) {
  if (!container) return;
  const q = String(query || "").trim();
  
  if (!q) {
    container.innerHTML = `<div class="cardBox"><b>Bir şey yaz.</b></div>`;
    return;
  }

  container.innerHTML = "";
  
  SITES.forEach(site => {
    const url = site.build(q);
    const card = document.createElement("div");
    card.className = "cardBox";
    card.innerHTML = `
      <div class="rowLine">
        <div>
          <div class="ttl">${site.name}</div>
          <div class="sub">${q}</div>
          <div class="sub-small" style="font-size:11px;color:#888;margin-top:2px;">
            🔍 En düşük fiyat sıralı
          </div>
        </div>
        <div class="actions">
          <button class="btnPrimary sm btnOpen" type="button">Aç</button>
          <button class="btnGhost sm btnCopy" type="button" data-copy-url="${url}">⧉</button>
          <button class="btnGhost sm btnFav" type="button" 
                  data-fav-url="${url}" 
                  data-site-key="${site.key}" 
                  data-site-name="${site.name}" 
                  data-query="${q}">🤍</button>
          <button class="btnGhost sm btnCart" type="button" 
                  data-cart-url="${url}" 
                  data-site-key="${site.key}" 
                  data-site-name="${site.name}" 
                  data-query="${q}">🛒</button>
        </div>
      </div>
    `;
    
    card.querySelector(".btnOpen").addEventListener("click", () => {
      window.open(url, "_blank", "noopener");
    });
    
    card.querySelector(".btnCopy").addEventListener("click", async () => {
      await copyToClipboard(url);
      toast(`✅ ${site.name} linki kopyalandı`, "success");
    });
    
    card.querySelector(".btnFav").addEventListener("click", async () => {
      if (!window.currentUser) return openLogin();
      await toggleFavorite(window.currentUser.uid, { 
        url, 
        siteKey: site.key, 
        siteName: site.name, 
        query: q,
        type: "search_link"
      });
    });
    
    card.querySelector(".btnCart").addEventListener("click", () => {
      addToCart({
        title: `${site.name}: ${q}`,
        price: "Arama sonucu",
        site: site.name,
        link: url,
        type: "search_link"
      });
    });
    
    container.appendChild(card);
  });
  
  applyFavUI();
  updateCartButtonStates();
}

// ========== FİYAT ARAMA ==========
async function fiyatAra(query, page = 1, sort = 'asc') {
  if (!query.trim()) {
    toast("Lütfen bir şey yazın", "error");
    return;
  }

  showPage("search");
  const container = $("normalList");
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Fiyatlar çekiliyor...</p>
    </div>
  `;

  saveRecentSearch(query);

  try {
    const response = await fetch(`${API_URL}/api/search/${encodeURIComponent(query)}`);
    
    if (!response.ok) throw new Error(`API hatası: ${response.status}`);
    
    const data = await response.json();
    
    if (data.success) {
      renderFiyatSonuclari(data);
      toast(`${data.toplamUrun || 0} ürün bulundu`, "success");
    } else {
      throw new Error(data.error || "Fiyat çekilemedi");
    }
  } catch (error) {
    console.error("Fiyat arama hatası:", error);
    // API çalışmıyorsa normal site listesini göster
    container.innerHTML = "";
    renderSiteList(container, query);
    toast("API çalışmıyor, site linkleri gösteriliyor", "warning");
  }
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
  document.querySelectorAll('.btnCart').forEach(btn => {
    const url = btn.getAttribute('data-cart-url');
    const isInCart = cartItems.some(item => item.link === url);
    
    if (isInCart) {
      btn.innerHTML = '✓ Sepette';
      btn.classList.add('inCart');
    } else {
      btn.innerHTML = '🛒';
      btn.classList.remove('inCart');
    }
  });
}

function renderCartPage() {
  const container = $("cartList");
  if (!container) return;
  
  if (cartItems.length === 0) {
    container.innerHTML = `
      <div class="emptyState">
        <div class="emptyIcon">🛒</div>
        <h3>Sepetiniz Boş</h3>
        <p>Ürünleri sepete ekleyerek toplam fiyatınızı görebilirsiniz.</p>
        <button onclick="showPage('home')" class="btnPrimary">Alışverişe Başla</button>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="cartSummary cardBox">
      <div class="cartTotalRow">
        <span>Toplam Ürün:</span>
        <span>${cartItems.reduce((sum, item) => sum + item.quantity, 0)} adet</span>
      </div>
      <div class="cartTotalRow">
        <span>Toplam Fiyat:</span>
        <span class="totalPrice">₺${cartTotal.toFixed(2).replace('.', ',')}</span>
      </div>
      <div class="cartButtons">
        <button class="btnGhost" onclick="clearCart()">Sepeti Temizle</button>
        <button class="btnPrimary" onclick="checkoutCart()">Siparişi Tamamla</button>
      </div>
    </div>
    
    <div class="cartItems">
  `;
  
  cartItems.forEach(item => {
    html += `
      <div class="cartItem cardBox">
        <div class="cartItemInfo">
          <div class="cartItemTitle">${item.title.substring(0,50)}${item.title.length > 50 ? '...' : ''}</div>
          <div class="cartItemMeta">
            <span class="cartSite">${item.site}</span>
            <span class="cartPrice">${item.price}</span>
          </div>
        </div>
        <div class="cartItemActions">
          <div class="quantityControl">
            <button class="qtyBtn" onclick="updateCartQuantity('${item.id}', -1)">-</button>
            <span class="qtyValue">${item.quantity}</span>
            <button class="qtyBtn" onclick="updateCartQuantity('${item.id}', 1)">+</button>
          </div>
          <button class="btnGhost sm" onclick="removeFromCart('${item.id}')">Sil</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function removeFromCart(itemId) {
  cartItems = cartItems.filter(item => item.id !== itemId);
  localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  updateCartCounter();
  updateCartButtonStates();
  renderCartPage();
  toast("Ürün sepetten çıkarıldı", "info");
}

function updateCartQuantity(itemId, change) {
  const item = cartItems.find(item => item.id === itemId);
  if (item) {
    item.quantity = Math.max(1, item.quantity + change);
    localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
    updateCartCounter();
    renderCartPage();
  }
}

function clearCart() {
  if (cartItems.length === 0) return;
  
  if (confirm(`${cartItems.length} ürünü sepetinizden silmek istiyor musunuz?`)) {
    cartItems = [];
    localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
    updateCartCounter();
    renderCartPage();
    toast("Sepet temizlendi", "success");
  }
}

function checkoutCart() {
  if (cartItems.length === 0) {
    toast("Sepetiniz boş", "error");
    return;
  }
  
  toast("Sipariş oluşturuldu! Toplam: ₺" + cartTotal.toFixed(2).replace('.', ','), "success");
}

// ========== FAVORİ SİSTEMİ ==========
async function loadFavorites(uid) {
  if (!uid) { favCache = []; return favCache; }
  
  try {
    const userFavsRef = window.firebaseApp.collection(`users/${uid}/favorites`);
    const snapshot = await window.firebaseApp.getDocs(userFavsRef);
    favCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Favori yükleme hatası:", e);
    favCache = [];
  }
  return favCache;
}

async function toggleFavorite(uid, fav) {
  if (!uid) { openLogin(); return; }
  
  const favId = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const favRef = window.firebaseApp.doc(`users/${uid}/favorites/${favId}`);
  
  if (favCache.some(f => f.url === fav.url)) {
    await window.firebaseApp.deleteDoc(favRef);
    toast("Favoriden çıkarıldı", 'info');
  } else {
    await window.firebaseApp.setDoc(favRef, {
      ...fav,
      createdAt: Date.now(),
    });
    toast("Favorilere eklendi", 'success');
  }
  
  await loadFavorites(uid);
  applyFavUI();
}

function applyFavUI() {
  document.querySelectorAll("[data-fav-url]").forEach(btn => {
    const url = btn.getAttribute("data-fav-url") || "";
    const isFav = favCache.some(f => f.url === url);
    btn.classList.toggle("isFav", isFav);
    btn.innerHTML = isFav ? "❤️" : "🤍";
    btn.title = isFav ? "Favoride" : "Favoriye ekle";
  });
}

// ========== SON ARAMALAR ==========
function saveRecentSearch(query) {
  let recent = JSON.parse(localStorage.getItem('fiyattakip_recent') || '[]');
  recent = recent.filter(q => q !== query);
  recent.unshift(query);
  recent = recent.slice(0, 5);
  localStorage.setItem('fiyattakip_recent', JSON.stringify(recent));
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = $("recentList");
  if (!container) return;
  
  const recent = JSON.parse(localStorage.getItem('fiyattakip_recent') || '[]');
  
  if (recent.length === 0) {
    container.innerHTML = '<p class="muted">Henüz arama yapılmadı</p>';
    return;
  }
  
  let html = '';
  recent.forEach(query => {
    const safeQuery = query.replace(/'/g, "\\'");
    html += `
      <div class="recentItem" onclick="handleRecentSearch('${safeQuery}')">
        <span>🔍</span>
        <span>${query}</span>
        <button class="recentRemove" onclick="event.stopPropagation(); removeRecentSearch('${safeQuery}')">✕</button>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function handleRecentSearch(query) {
  $("qNormal").value = query;
  const mode = getSearchMode();
  
  if (mode === 'fiyat') {
    fiyatAra(query);
  } else {
    showPage('search');
    renderSiteList($('normalList'), query);
  }
}

function removeRecentSearch(query) {
  let recent = JSON.parse(localStorage.getItem('fiyattakip_recent') || '[]');
  recent = recent.filter(q => q !== query);
  localStorage.setItem('fiyattakip_recent', JSON.stringify(recent));
  renderRecentSearches();
}

// ========== AUTH SİSTEMİ ==========
function openLogin() {
  const modal = $("loginModal");
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modalOpen");
}

function closeLogin() {
  const modal = $("loginModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modalOpen");
}

async function doEmailLogin(isRegister) {
  const email = isRegister ? 
    ($("regEmail")?.value || "").trim() : 
    ($("loginEmail")?.value || "").trim();
  const pass = isRegister ? $("regPass")?.value || "" : $("loginPass")?.value || "";
  const pass2 = isRegister ? $("regPass2")?.value || "" : "";

  if (!email || !pass) {
    return toast("E-posta ve şifre gir.", "error");
  }
  
  if (isRegister) {
    if (pass.length < 6) {
      return toast("Şifre en az 6 karakter olmalı.", "error");
    }
    if (!pass2 || pass !== pass2) {
      return toast("Şifreler uyuşmuyor.", "error");
    }
  }

  toast(isRegister ? "Kayıt deneniyor..." : "Giriş deneniyor...", "info");

  try {
    if (isRegister) {
      await window.firebaseApp.createUserWithEmailAndPassword(email, pass);
      toast("Kayıt tamam. Giriş yapıldı.", "success");
    } else {
      await window.firebaseApp.signInWithEmailAndPassword(email, pass);
      toast("Giriş başarılı.", "success");
      closeLogin();
    }
  } catch (e) {
    console.error(e);
    const msg = String(e?.message || e || "");
    toast("Hata: " + msg.replace(/^Firebase:\s*/, ""), "error");
  }
}

async function doGoogleLogin() {
  try {
    await window.firebaseApp.signInWithPopup();
    toast("Google ile giriş başarılı", "success");
    closeLogin();
  } catch (e) {
    console.error("Google giriş hatası:", e);
    toast("Google giriş hatası", "error");
  }
}

// ========== MODAL İŞLEMLERİ ==========
function openAIModal() {
  const m = $("aiModal");
  if (!m) return;
  m.classList.add("show");
  m.setAttribute("aria-hidden", "false");
}

function closeAIModal() {
  const m = $("aiModal");
  if (!m) return;
  m.classList.remove("show");
  m.setAttribute("aria-hidden", "true");
}

function openAPIModal() {
  const m = $("apiModal");
  if (!m) return;
  m.classList.add("show");
  m.setAttribute("aria-hidden", "false");
  $("apiUrl").value = API_URL;
}

function closeAPIModal() {
  const m = $("apiModal");
  if (!m) return;
  m.classList.remove("show");
  m.setAttribute("aria-hidden", "true");
}

function saveAPISettings() {
  const url = $("apiUrl")?.value?.trim() || DEFAULT_API_URL;
  API_URL = url;
  localStorage.setItem('fiyattakip_api_url', url);
  toast("API URL kaydedildi", "success");
  closeAPIModal();
}

// ========== KAMERA SİSTEMİ ==========
async function cameraAiSearch() {
  toast("Kamera özelliği yakında eklenecek!", "info");
}

// ========== YARDIMCI FONKSİYONLAR ==========
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Kopyalandı", 'success');
  } catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("Kopyalandı", 'success'); } catch (_) { }
    document.body.removeChild(ta);
  }
}

async function clearAppCache() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    toast("Önbellek temizlendi. Yenileniyor...", 'info');
    setTimeout(() => location.reload(), 600);
  } catch (e) {
    console.error(e);
    toast("Temizleme hatası", 'error');
  }
}

// ========== UI BAĞLANTILARI ==========
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

// ========== UYGULAMA BAŞLANGICI ==========
window.addEventListener("DOMContentLoaded", async () => {
  console.log("Uygulama başlatılıyor...");
  
  // UI bağlantılarını kur
  wireUI();
  
  // Arama modunu ayarla
  setSearchMode(getSearchMode());
  
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

// ========== GLOBAL FONKSİYONLAR ==========
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

// Fiyat sonuçlarını render et
window.renderFiyatSonuclari = function(data) {
  const container = $("normalList");
  if (!container) return;
  
  if (!data.fiyatlar || data.fiyatlar.length === 0) {
    container.innerHTML = `
      <div class="emptyState">
        <div class="emptyIcon">😕</div>
        <h3>Ürün bulunamadı</h3>
        <p>"${data.query}" için sonuç bulunamadı</p>
        <button onclick="showPage('home')" class="btnPrimary">Yeni Arama</button>
      </div>
    `;
    return;
  }

  let html = '<div class="cardBox" style="margin-bottom:15px;background:rgba(124,92,255,0.1);border-color:rgba(124,92,255,0.3);">';
  html += '<div style="font-size:14px;color:#7c5cff;font-weight:700;">📊 Fiyat Karşılaştırması</div>';
  html += '<div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">API: ' + API_URL + '</div>';
  html += '</div>';
  
  // API'den gelen verileri göster
  if (data.fiyatlar && data.fiyatlar.length > 0) {
    data.fiyatlar.forEach(product => {
      html += `
        <div class="cardBox">
          <div class="rowLine">
            <div>
              <div class="ttl">${product.urun || product.title}</div>
              <div class="sub">${product.site}</div>
              <div style="color:#36d399;font-weight:700;margin-top:5px;">${product.fiyat || product.price}</div>
            </div>
            <div class="actions">
              <button class="btnPrimary sm" onclick="window.open('${product.link}', '_blank')">Aç</button>
              <button class="btnGhost sm" onclick="copyToClipboard('${product.link}')">⧉</button>
              <button class="btnGhost sm btnFav" 
                      data-fav-url="${product.link}" 
                      data-site-key="${product.site?.toLowerCase()}" 
                      data-site-name="${product.site}" 
                      data-query="${data.query}">🤍</button>
              <button class="btnGhost sm btnCart" 
                      data-cart-url="${product.link}">🛒</button>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html;
  applyFavUI();
  updateCartButtonStates();
};

// Favoriler sayfasını render et
window.renderFavoritesPage = function(uid) {
  const list = $("favList");
  if (!list) return;
  
  if (!favCache.length) {
    list.innerHTML = `<div class="emptyState">Favori yok.</div>`;
    return;
  }
  
  let html = '';
  favCache.forEach(fav => {
    html += `
      <div class="cardBox favoriteCard">
        <div class="favoriteHeader">
          <div class="favoriteInfo">
            <div class="favSite">${fav.siteName || "Favori"}</div>
            <div class="favQuery">${fav.query || ""}</div>
            <div class="favPrice" style="margin-top:8px;color:#36d399;font-size:14px;">
              🔗 Arama Linki
            </div>
          </div>
          <div class="favoriteActions">
            <button class="btnGhost sm" onclick="window.open('${fav.url || ""}', '_blank')">Aç</button>
            <button class="btnGhost sm btnFav isFav" data-fav-url="${fav.url || ""}">❤️</button>
            <button class="btnGhost sm btnCart" data-cart-url="${fav.url || ""}">🛒</button>
          </div>
        </div>
      </div>
    `;
  });
  
  list.innerHTML = html;
  applyFavUI();
  updateCartButtonStates();
};

// app.js - TAM ÇALIŞAN VERSİYON (Güncel)

// ========== GLOBAL DEĞİŞKENLER ==========
const $ = (id) => document.getElementById(id);

// Sepet ve önbellek
let cartItems = JSON.parse(localStorage.getItem('fiyattakip_cart') || '[]');
let currentUser = null;

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
  
  // Tüm sayfaları gizle
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });
  
  // Tüm tabları normal yap
  document.querySelectorAll(".tab").forEach(t => {
    t.classList.remove("active");
  });
  
  // Hedef sayfayı göster
  const page = $(`page-${key}`);
  if (page) {
    page.classList.add("active");
  }
  
  // Hedef tabı aktif yap
  const tab = document.querySelector(`.tab[data-page="${key}"]`);
  if (tab) {
    tab.classList.add("active");
  }
  
  // Özel sayfa işlemleri
  if (key === 'cart') {
    renderCartPage();
  } else if (key === 'favs') {
    renderFavoritesPage();
  } else if (key === 'home') {
    renderRecentSearches();
  } else if (key === 'settings') {
    updateUserInfo();
  }
}

// ========== AUTH SİSTEMİ ==========
function showLoginModal() {
  $("loginModal").classList.remove("hidden");
}

function hideLoginModal() {
  $("loginModal").classList.add("hidden");
}

function loginWithEmail() {
  const email = $("loginEmail").value.trim();
  const password = $("loginPass").value;
  
  if (!email || !password) {
    toast("Lütfen tüm alanları doldurun", "error");
    return;
  }
  
  try {
    if (window.firebaseApp) {
      window.firebaseApp.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          currentUser = userCredential.user;
          toast("Giriş başarılı! ✅", "success");
          hideLoginModal();
          updateUserInfo();
        })
        .catch((error) => {
          console.error("Login error:", error);
          toast("Giriş başarısız: " + error.message, "error");
        });
    } else {
      // Mock login (Firebase yoksa)
      currentUser = {
        email: email,
        displayName: email.split('@')[0],
        uid: 'mock_' + Date.now()
      };
      toast("Demo: Giriş başarılı! ✅", "success");
      hideLoginModal();
      updateUserInfo();
    }
  } catch (error) {
    console.error("Login error:", error);
    toast("Giriş işlemi başarısız", "error");
  }
}

function registerWithEmail() {
  const email = $("regEmail").value.trim();
  const password = $("regPass").value;
  const password2 = $("regPass2").value;
  
  if (!email || !password || !password2) {
    toast("Lütfen tüm alanları doldurun", "error");
    return;
  }
  
  if (password !== password2) {
    toast("Şifreler eşleşmiyor", "error");
    return;
  }
  
  if (password.length < 6) {
    toast("Şifre en az 6 karakter olmalı", "error");
    return;
  }
  
  try {
    if (window.firebaseApp) {
      window.firebaseApp.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          currentUser = userCredential.user;
          toast("Kayıt başarılı! Hoş geldiniz 🎉", "success");
          hideLoginModal();
          updateUserInfo();
        })
        .catch((error) => {
          console.error("Register error:", error);
          toast("Kayıt başarısız: " + error.message, "error");
        });
    } else {
      // Mock registration
      currentUser = {
        email: email,
        displayName: email.split('@')[0],
        uid: 'mock_' + Date.now()
      };
      toast("Demo: Kayıt başarılı! 🎉", "success");
      hideLoginModal();
      updateUserInfo();
    }
  } catch (error) {
    console.error("Register error:", error);
    toast("Kayıt işlemi başarısız", "error");
  }
}

function loginWithGoogle() {
  toast("Google ile giriş yakında gelecek! ⏳", "info");
  
  if (window.firebaseApp) {
    window.firebaseApp.signInWithPopup()
      .then((result) => {
        currentUser = result.user;
        toast("Google ile giriş başarılı! ✅", "success");
        hideLoginModal();
        updateUserInfo();
      })
      .catch((error) => {
        console.error("Google login error:", error);
        toast("Google girişi başarısız", "error");
      });
  }
}

function logout() {
  if (window.firebaseApp) {
    window.firebaseApp.signOut()
      .then(() => {
        currentUser = null;
        toast("Çıkış yapıldı", "info");
        updateUserInfo();
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  } else {
    currentUser = null;
    toast("Demo: Çıkış yapıldı", "info");
    updateUserInfo();
  }
}

function updateUserInfo() {
  const userElement = $("currentUser");
  if (!userElement) return;
  
  if (currentUser) {
    userElement.textContent = currentUser.email || currentUser.displayName || "Kullanıcı";
    $("logoutBtn").textContent = "Çıkış Yap";
  } else {
    userElement.textContent = "Misafir";
    $("logoutBtn").textContent = "Giriş Yap";
  }
}

// ========== ARAMA SİSTEMİ ==========
function performSearch() {
  const query = ($("qNormal")?.value || "").trim();
  
  if (!query) {
    toast("Lütfen bir ürün adı girin", "error");
    return;
  }
  
  console.log("Arama yapılıyor:", query);
  
  // Son aramalara ekle
  handleRecentSearch(query);
  
  // Arama sayfasına geç
  showPage("search");
  
  // Arama bilgisini güncelle
  updateSearchInfo(query);
  
  // Sonuçları göster
  showMockResults(query);
}

function updateSearchInfo(query) {
  const searchInfo = $("searchInfo");
  if (!searchInfo) return;
  
  searchInfo.innerHTML = `
    <div class="searchQuery">"${query}"</div>
    <div class="searchStats">6 sitede araştırılıyor...</div>
  `;
}

function showMockResults(query) {
  const container = $("normalList");
  if (!container) return;
  
  const sites = [
    { name: "Trendyol", icon: "🛍️", type: "new" },
    { name: "Hepsiburada", icon: "📦", type: "new" },
    { name: "Amazon", icon: "📦", type: "new" },
    { name: "Sahibinden", icon: "🏠", type: "secondhand" },
    { name: "Dolap", icon: "👗", type: "secondhand" },
    { name: "Teknosa", icon: "💻", type: "new" }
  ];
  
  let html = '';
  
  sites.forEach((site, index) => {
    const url = `https://${site.name.toLowerCase().replace(' ', '')}.com/ara?q=${encodeURIComponent(query)}`;
    const delay = index * 100;
    
    html += `
      <div class="siteCard" style="animation-delay: ${delay}ms">
        <div class="siteHeader">
          <div class="siteIcon">${site.icon}</div>
          <div class="siteInfo">
            <div class="siteName">${site.name}</div>
            <div class="siteQuery">${query}</div>
            <div class="siteBadge ${site.type === 'new' ? 'badgeNew' : 'badgeSecondhand'}">
              ${site.type === 'new' ? '🛍️ Yeni' : '🔄 İkinci El'}
            </div>
          </div>
        </div>
        <div class="siteActions">
          <button class="actionBtn btnPrimary" onclick="window.open('${url}', '_blank')">
            <span class="btnIcon">🔍</span>
            <span>Ara</span>
          </button>
          <button class="actionBtn btnGhost" onclick="copyToClipboard('${url}')">
            <span class="btnIcon">⧉</span>
            <span>Kopyala</span>
          </button>
          <button class="actionBtn btnFav" onclick="addFavorite('${site.name}', '${query}', '${url}')">
            <span class="btnIcon">🤍</span>
            <span>Favori</span>
          </button>
          <button class="actionBtn btnCart" onclick="addToCartFromSite('${site.name}', '${query}', '${url}')">
            <span class="btnIcon">🛒</span>
            <span>Sepet</span>
          </button>
        </div>
        <div class="siteFooter">
          <span class="footerBadge">⬆️ En Düşük Fiyat</span>
          <span class="footerBadge">🎯 İlgili Sonuçlar</span>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ========== COPY LINK ==========
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Link kopyalandı! 📋", "success");
  } catch (error) {
    console.error("Copy error:", error);
    toast("Kopyalama başarısız", "error");
  }
}

// ========== FAVORİ SİSTEMİ ==========
function addFavorite(siteName, query, url) {
  let favorites = JSON.parse(localStorage.getItem('fiyattakip_favorites') || '[]');
  
  const favorite = {
    id: 'fav_' + Date.now(),
    siteName: siteName,
    query: query,
    url: url,
    addedAt: new Date().toISOString(),
    type: siteName.toLowerCase().includes('sahibinden') ? 'secondhand' : 'new'
  };
  
  // Aynı URL zaten favorilerde mi?
  const exists = favorites.some(fav => fav.url === url);
  if (exists) {
    toast("Bu site zaten favorilerinizde! ❤️", "info");
    return;
  }
  
  favorites.push(favorite);
  localStorage.setItem('fiyattakip_favorites', JSON.stringify(favorites));
  
  toast("Favorilere eklendi! ❤️", "success");
  renderFavoritesPage();
}

function removeFavorite(favoriteId) {
  let favorites = JSON.parse(localStorage.getItem('fiyattakip_favorites') || '[]');
  favorites = favorites.filter(fav => fav.id !== favoriteId);
  localStorage.setItem('fiyattakip_favorites', JSON.stringify(favorites));
  
  toast("Favoriden çıkarıldı", "info");
  renderFavoritesPage();
}

function clearFavorites() {
  if (confirm("Tüm favorileri temizlemek istediğinize emin misiniz?")) {
    localStorage.removeItem('fiyattakip_favorites');
    toast("Favoriler temizlendi", "success");
    renderFavoritesPage();
  }
}

function renderFavoritesPage() {
  const favList = $("favList");
  const favCount = $("favCount");
  const favSites = $("favSites");
  
  if (!favList) return;
  
  let favorites = JSON.parse(localStorage.getItem('fiyattakip_favorites') || '[]');
  
  if (favCount) favCount.textContent = favorites.length;
  if (favSites) {
    const uniqueSites = [...new Set(favorites.map(fav => fav.siteName))];
    favSites.textContent = uniqueSites.length;
  }
  
  if (favorites.length === 0) {
    favList.innerHTML = `
      <div class="emptyState">
        <div class="emptyIcon">❤️</div>
        <h3>Favori Yok</h3>
        <p>Arama sonuçlarından favorilere ekleyin</p>
        <button class="btn primary" onclick="showPage('home')">Arama Yap</button>
      </div>
    `;
    return;
  }
  
  let html = '';
  favorites.forEach(fav => {
    html += `
      <div class="siteCard">
        <div class="siteHeader">
          <div class="siteIcon">${fav.siteName.includes('Sahibinden') ? '🏠' : '🛍️'}</div>
          <div class="siteInfo">
            <div class="siteName">${fav.siteName}</div>
            <div class="siteQuery">${fav.query}</div>
            <div class="siteBadge ${fav.type === 'new' ? 'badgeNew' : 'badgeSecondhand'}">
              ${fav.type === 'new' ? '🛍️ Yeni' : '🔄 İkinci El'}
            </div>
          </div>
        </div>
        <div class="siteActions">
          <button class="actionBtn btnPrimary" onclick="window.open('${fav.url}', '_blank')">
            <span class="btnIcon">🔍</span>
            <span>Ara</span>
          </button>
          <button class="actionBtn btnGhost" onclick="copyToClipboard('${fav.url}')">
            <span class="btnIcon">⧉</span>
            <span>Kopyala</span>
          </button>
          <button class="actionBtn btnFav isFav" onclick="removeFavorite('${fav.id}')">
            <span class="btnIcon">❤️</span>
            <span>Kaldır</span>
          </button>
          <button class="actionBtn btnCart" onclick="addToCartFromSite('${fav.siteName}', '${fav.query}', '${fav.url}')">
            <span class="btnIcon">🛒</span>
            <span>Sepet</span>
          </button>
        </div>
        <div class="siteFooter">
          <span class="footerBadge">${new Date(fav.addedAt).toLocaleDateString('tr-TR')}</span>
        </div>
      </div>
    `;
  });
  
  favList.innerHTML = html;
}

// ========== SEPET SİSTEMİ ==========
function addToCartFromSite(siteName, query, url) {
  const product = {
    title: `${siteName}: ${query}`,
    price: "₺???",
    site: siteName,
    link: url,
    addedAt: new Date().toISOString()
  };
  
  addToCart(product);
}

function addToCart(product) {
  // Sepette var mı kontrol et
  const existingIndex = cartItems.findIndex(item => item.link === product.link);
  
  if (existingIndex > -1) {
    cartItems[existingIndex].quantity += 1;
    toast(`"${product.title.substring(0,30)}..." miktarı arttırıldı`, "info");
  } else {
    const cartItem = {
      id: 'cart_' + Date.now() + Math.random().toString(36).substr(2, 9),
      title: product.title,
      price: product.price,
      site: product.site,
      link: product.link,
      quantity: 1,
      addedAt: new Date().toISOString()
    };
    
    cartItems.push(cartItem);
    toast(`"${cartItem.title.substring(0,30)}..." sepete eklendi`, "success");
  }
  
  localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  updateCartCounter();
}

function removeFromCart(itemId) {
  cartItems = cartItems.filter(item => item.id !== itemId);
  localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  updateCartCounter();
  renderCartPage();
  toast("Ürün sepetten çıkarıldı", "info");
}

function clearCart() {
  if (cartItems.length === 0) {
    toast("Sepet zaten boş", "info");
    return;
  }
  
  if (confirm("Sepeti tamamen boşaltmak istediğinize emin misiniz?")) {
    cartItems = [];
    localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
    updateCartCounter();
    renderCartPage();
    toast("Sepet temizlendi", "success");
  }
}

function checkoutCart() {
  if (cartItems.length === 0) {
    toast("Sepet boş", "error");
    return;
  }
  
  toast("Siparişiniz alındı! (Demo)", "success");
  cartItems = [];
  localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  updateCartCounter();
  renderCartPage();
}

function renderCartPage() {
  const cartList = $("cartList");
  const cartSubtotal = $("cartSubtotal");
  const cartTotalPrice = $("cartTotalPrice");
  const cartItemCount = $("cartItemCount");
  const tabCartCount = $("tabCartCount");
  
  if (!cartList) return;
  
  if (cartItems.length === 0) {
    cartList.innerHTML = `
      <div class="emptyState">
        <div class="emptyIcon">🛒</div>
        <h3>Sepet Boş</h3>
        <p>Arama sonuçlarından sepete ürün ekleyin</p>
        <button class="btn primary mt-4" onclick="showPage('home')">Alışverişe Başla</button>
      </div>
    `;
    
    if (cartSubtotal) cartSubtotal.textContent = "₺0,00";
    if (cartTotalPrice) cartTotalPrice.textContent = "₺0,00";
    if (cartItemCount) cartItemCount.textContent = "0 ürün";
    if (tabCartCount) {
      tabCartCount.textContent = "0";
      tabCartCount.classList.add("hidden");
    }
    return;
  }
  
  // Render cart items
  let html = '';
  cartItems.forEach(item => {
    html += `
      <div class="cartItem">
        <div class="cartItemHeader">
          <div class="cartItemTitle">${item.title}</div>
          <button class="cartItemRemove" onclick="removeFromCart('${item.id}')">✕</button>
        </div>
        <div class="cartItemDetails">
          <div class="cartItemSite">${item.site}</div>
          <div class="cartItemPrice">${item.price}</div>
        </div>
      </div>
    `;
  });
  
  cartList.innerHTML = html;
  
  // Update summary
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (cartSubtotal) cartSubtotal.textContent = "₺???";
  if (cartTotalPrice) cartTotalPrice.textContent = "₺???";
  if (cartItemCount) cartItemCount.textContent = `${totalItems} ürün`;
  if (tabCartCount) {
    tabCartCount.textContent = totalItems > 9 ? "9+" : totalItems.toString();
    tabCartCount.classList.remove("hidden");
  }
}

function updateCartCounter() {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const counter = $("cartCount");
  
  if (counter) {
    counter.textContent = totalItems > 9 ? "9+" : totalItems.toString();
    if (totalItems > 0) {
      counter.classList.remove("hidden");
    } else {
      counter.classList.add("hidden");
    }
  }
}

// ========== SON ARAMALAR ==========
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
      <div class="recentItem" onclick="$('qNormal').value='${query}'; performSearch();">
        <span>🔍</span>
        <span>${query}</span>
        <button class="recentRemove" onclick="event.stopPropagation(); removeRecentSearch('${query}')">✕</button>
      </div>
    `;
  });
  
  recentList.innerHTML = html;
}

// ========== EVENT LISTENERS ==========
function wireUI() {
  console.log("UI bağlantıları kuruluyor...");
  
  // Arama butonu
  $("btnNormal")?.addEventListener("click", performSearch);
  
  // Enter tuşu ile arama
  $("qNormal")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });
  
  // Tab butonları
  document.querySelectorAll(".tab[data-page]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const page = e.currentTarget.dataset.page;
      showPage(page);
    });
  });
  
  // Hızlı arama etiketleri
  document.querySelectorAll(".quickTag").forEach(tag => {
    tag.addEventListener("click", () => {
      const query = tag.dataset.query;
      $("qNormal").value = query;
      performSearch();
    });
  });
  
  // Kamera butonu
  $("cameraTabBtn")?.addEventListener("click", () => {
    toast("Kamera özelliği yakında gelecek! 📸", "info");
  });
  
  // Bildirim butonu
  $("btnBell")?.addEventListener("click", () => {
    toast("Bildirim özelliği yakında gelecek! 🔔", "info");
  });
  
  // Temizleme
  $("btnClearCache")?.addEventListener("click", () => {
    if (confirm("Tüm önbelleği temizlemek istediğinize emin misiniz?")) {
      localStorage.clear();
      cartItems = [];
      updateCartCounter();
      renderRecentSearches();
      renderFavoritesPage();
      renderCartPage();
      toast("Önbellek temizlendi", "success");
    }
  });
  
  // Arama temizleme
  $("btnClearSearch")?.addEventListener("click", () => {
    $("normalList").innerHTML = `
      <div class="emptyState">
        <div class="emptyIcon">🔍</div>
        <h3>Arama Yapın</h3>
        <p>Ürün adını yazıp arama yaparak başlayın</p>
      </div>
    `;
    
    if ($("searchInfo")) {
      $("searchInfo").innerHTML = `
        <div class="searchQuery">Arama yapılmadı</div>
        <div class="searchStats">0 sonuç</div>
      `;
    }
    
    toast("Arama temizlendi", "info");
  });
  
  // Sepet icon
  $("cartIcon")?.addEventListener("click", () => {
    showPage('cart');
  });
  
  // Login/Logout
  $("logoutBtn")?.addEventListener("click", () => {
    if (currentUser) {
      logout();
    } else {
      showLoginModal();
    }
  });
  
  // Login modal kapatma
  $("loginBackdrop")?.addEventListener("click", hideLoginModal);
  $("closeLogin")?.addEventListener("click", hideLoginModal);
  
  // Login tabları
  $("tabLogin")?.addEventListener("click", () => {
    $("tabLogin").classList.add("active");
    $("tabRegister").classList.remove("active");
    $("loginPane").classList.remove("hidden");
    $("registerPane").classList.add("hidden");
  });
  
  $("tabRegister")?.addEventListener("click", () => {
    $("tabRegister").classList.add("active");
    $("tabLogin").classList.remove("active");
    $("registerPane").classList.remove("hidden");
    $("loginPane").classList.add("hidden");
  });
  
  // Auth butonları
  $("btnLogin")?.addEventListener("click", loginWithEmail);
  $("btnRegister")?.addEventListener("click", registerWithEmail);
  $("btnGoogleLogin")?.addEventListener("click", loginWithGoogle);
  $("btnGoogleLogin2")?.addEventListener("click", loginWithGoogle);
  
  // Favori butonları
  $("btnFavRefresh")?.addEventListener("click", renderFavoritesPage);
  $("btnFavClear")?.addEventListener("click", clearFavorites);
  
  // Enter key for login
  $("loginPass")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginWithEmail();
  });
  $("regPass2")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") registerWithEmail();
  });
  
  // Arama modları
  document.querySelectorAll(".modeBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".modeBtn").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      toast(`Mod değiştirildi: ${e.currentTarget.dataset.mode}`, "info");
    });
  });
  
  // Arama tipleri
  document.querySelectorAll(".typeBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".typeBtn").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      toast(`Arama tipi: ${e.currentTarget.dataset.type}`, "info");
    });
  });
}

// ========== UYGULAMA BAŞLANGICI ==========
window.addEventListener("DOMContentLoaded", () => {
  console.log("Uygulama başlatılıyor...");
  
  // UI bağlantılarını kur
  wireUI();
  
  // Firebase auth durumunu dinle
  if (window.firebaseApp) {
    window.firebaseApp.onAuthStateChanged((user) => {
      currentUser = user;
      updateUserInfo();
      console.log("Auth state:", user ? "Logged in" : "Logged out");
    });
  }
  
  // Sepet sayacını güncelle
  updateCartCounter();
  
  // Son aramaları yükle
  renderRecentSearches();
  
  // Favorileri yükle
  renderFavoritesPage();
  
  // Kullanıcı bilgisini güncelle
  updateUserInfo();
  
  console.log("✅ Uygulama hazır!");
});

// GLOBAL FONKSİYONLAR
window.showPage = showPage;
window.performSearch = performSearch;
window.copyToClipboard = copyToClipboard;
window.addFavorite = addFavorite;
window.addToCart = addToCart;
window.addToCartFromSite = addToCartFromSite;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.checkoutCart = checkoutCart;
window.clearRecentSearches = clearRecentSearches;
window.showLoginModal = showLoginModal;
window.hideLoginModal = hideLoginModal;
window.loginWithEmail = loginWithEmail;
window.registerWithEmail = registerWithEmail;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;

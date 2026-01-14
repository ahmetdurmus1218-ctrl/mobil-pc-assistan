// app.js - TEMEL UYGULAMA (DÜZENLİ)

// ========== GLOBAL DEĞİŞKENLER ==========
const $ = (id) => document.getElementById(id);
let cartItems = JSON.parse(localStorage.getItem('fiyattakip_cart') || '[]');
let currentSearchType = 'all';

// ========== SİTE LİSTESİ ==========
const SITES = {
  new: [
    { name: "Trendyol", icon: "🛍️", type: "new",
      searchUrl: (q) => `https://www.trendyol.com/sr?q=${encodeURIComponent(q)}&sst=PRICE_BY_ASC` },
    { name: "Hepsiburada", icon: "📦", type: "new",
      searchUrl: (q) => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}&siralama=yorumsayisi-azalan` },
    { name: "Amazon TR", icon: "📦", type: "new",
      searchUrl: (q) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}&s=price-asc-rank` },
    { name: "n11", icon: "🏪", type: "new",
      searchUrl: (q) => `https://www.n11.com/arama?q=${encodeURIComponent(q)}&srt=PRICE_LOW` },
    { name: "ÇiçekSepeti", icon: "🌸", type: "new",
      searchUrl: (q) => `https://www.ciceksepeti.com/arama?query=${encodeURIComponent(q)}&srt=PRICE_LOW` },
    { name: "Teknosa", icon: "💻", type: "new",
      searchUrl: (q) => `https://www.teknosa.com/arama/?s=${encodeURIComponent(q)}&srt=PRICE_LOW` },
    { name: "Vatan Bilgisayar", icon: "💾", type: "new",
      searchUrl: (q) => `https://www.vatanbilgisayar.com/arama/${q.replace(/ /g, '%20')}/?srt=UP` },
    { name: "MediaMarkt", icon: "📺", type: "new",
      searchUrl: (q) => `https://www.mediamarkt.com.tr/tr/search.html?query=${q.replace(/ /g, '%20')}&sort=currentprice+asc` },
    { name: "İdefix", icon: "📚", type: "new",
      searchUrl: (q) => `https://www.idefix.com/arama?q=${q.replace(/ /g, '+')}&typing=false&siralama=asc_price` },
    { name: "PTT AVM", icon: "📮", type: "new",
      searchUrl: (q) => `https://www.pttavm.com/arama?q=${encodeURIComponent(q)}&srt=price_asc` }
  ],
  secondhand: [
    { name: "Sahibinden", icon: "🏠", type: "secondhand",
      searchUrl: (q) => `https://www.sahibinden.com/arama?query_text=${encodeURIComponent(q)}&sorting=price_asc` },
    { name: "Dolap", icon: "👗", type: "secondhand",
      searchUrl: (q) => `https://dolap.com/ara?q=${encodeURIComponent(q)}&sira=artan-fiyat` },
    { name: "Letgo", icon: "🔄", type: "secondhand",
      searchUrl: (q) => `https://www.letgo.com/arama?query_text=${encodeURIComponent(q)}&isSearchCall=true&sorting=desc-price` },
    { name: "Facebook Marketplace", icon: "📱", type: "secondhand",
      searchUrl: (q) => `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(q)}&sortBy=price_ascend` }
  ]
};

// ========== TEMEL FONKSİYONLAR ==========
function toast(msg, type = 'info') {
  const t = $("toast");
  if (!t) return;
  
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 2200);
}

function showPage(key) {
  // Tüm sayfaları gizle
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  
  // Hedef sayfayı göster
  const page = $(`page-${key}`);
  if (page) page.classList.add("active");
  
  // Hedef tabı aktif yap
  const tab = document.querySelector(`.tab[data-page="${key}"]`);
  if (tab) tab.classList.add("active");
  
  // Özel sayfa işlemleri
  if (key === 'cart') renderCartPage();
  else if (key === 'favs') renderFavoritesPage();
  else if (key === 'home') renderRecentSearches();
}

function setSearchType(type) {
  currentSearchType = type;
  
  // UI'da aktif butonu güncelle
  document.querySelectorAll(".typeBtn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.typeBtn[data-type="${type}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  
  // Arama sayfasındaysak yenile
  if ($("page-search")?.classList.contains("active") && $("qNormal").value.trim()) {
    performSearch();
  }
  
  toast(`Arama tipi: ${type === 'all' ? 'Tüm Siteler' : type === 'new' ? 'Yeni Ürünler' : 'İkinci El'}`, "info");
}

// ========== ARAMA SİSTEMİ ==========
function performSearch() {
  const query = ($("qNormal")?.value || "").trim();
  if (!query) {
    toast("Lütfen bir ürün adı girin", "error");
    return;
  }
  
  handleRecentSearch(query);
  showPage("search");
  updateSearchInfo(query);
  showSearchResults(query);
}

function updateSearchInfo(query) {
  const searchInfo = $("searchInfo");
  if (!searchInfo) return;
  
  searchInfo.innerHTML = `
    <div class="searchQuery">"${query}"</div>
    <div class="searchStats">Sitelerde araştırılıyor...</div>
  `;
}

function showSearchResults(query) {
  const container = $("normalList");
  if (!container) return;
  
  // PC Toplama kartı (üstte)
  let pcCardHTML = "";
  if (window.PCBuilder && PCBuilder.isPcRelated(query)) {
    pcCardHTML = `<div id="pcSearchMount" style="margin-bottom: 20px;"></div>`;
  }
  
  // Mevcut arama tipine göre siteleri filtrele
  let sitesToShow = [];
  if (currentSearchType === 'all') sitesToShow = [...SITES.new, ...SITES.secondhand];
  else if (currentSearchType === 'new') sitesToShow = SITES.new;
  else sitesToShow = SITES.secondhand;
  
  // Her site için kart oluştur
  let sitesHTML = '';
  sitesToShow.forEach((site, index) => {
    const url = site.searchUrl(query);
    
    sitesHTML += `
      <div class="siteCard" style="animation-delay: ${index * 50}ms">
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
          <button class="actionBtn btnFav" onclick="addFavorite('${site.name}', '${query}', '${url}', '${site.type}')">
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
  
  container.innerHTML = pcCardHTML + sitesHTML;
  
  // PC Builder içeriğini render et
  const pcMount = document.getElementById('pcSearchMount');
  if (pcMount && window.PCBuilder) {
    PCBuilder.renderTo(pcMount, query, query);
  }
  
  updateSearchStats(sitesToShow.length, query);
}

function updateSearchStats(count, query) {
  const searchInfo = $("searchInfo");
  if (!searchInfo) return;
  
  const typeText = currentSearchType === 'all' ? 'Tüm Siteler' : 
                   currentSearchType === 'new' ? 'Yeni Ürün Siteleri' : 'İkinci El Siteleri';
  
  searchInfo.innerHTML = `
    <div class="searchQuery">"${query}"</div>
    <div class="searchStats">${count} sitede araştırılıyor (${typeText})</div>
  `;
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
function addFavorite(siteName, query, url, type) {
  let favorites = JSON.parse(localStorage.getItem('fiyattakip_favorites') || '[]');
  
  const favorite = {
    id: 'fav_' + Date.now(),
    siteName: siteName,
    query: query,
    url: url,
    type: type,
    addedAt: new Date().toISOString()
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
          <div class="siteIcon">${getSiteIcon(fav.siteName)}</div>
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
      </div>
    `;
  });
  
  favList.innerHTML = html;
}

function getSiteIcon(siteName) {
  const iconMap = {
    'Sahibinden': '🏠',
    'Facebook Marketplace': '📱',
    'Dolap': '👗',
    'Letgo': '🔄',
    'Trendyol': '🛍️',
    'Hepsiburada': '📦',
    'Amazon TR': '📦',
    'n11': '🏪',
    'ÇiçekSepeti': '🌸',
    'Teknosa': '💻',
    'Vatan Bilgisayar': '💾',
    'MediaMarkt': '📺',
    'İdefix': '📚',
    'PTT AVM': '📮'
  };
  return iconMap[siteName] || '🛒';
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
    if (e.key === "Enter") performSearch();
  });
  
  // Autocomplete
  if (window.initTypeahead && $("qNormal")) {
    initTypeahead($("qNormal"), ({canonical}) => {
      $("qNormal").value = canonical;
      performSearch();
    });
  }
  
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
    showLoginModal();
  });
  
  // Arama tipi butonları
  document.querySelectorAll(".typeBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const type = e.currentTarget.dataset.type;
      setSearchType(type);
    });
  });
  
  // Arama modları
  document.querySelectorAll(".modeBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".modeBtn").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      toast(`Mod değiştirildi: ${e.currentTarget.dataset.mode}`, "info");
    });
  });
  
  // Favori butonları
  $("btnFavRefresh")?.addEventListener("click", renderFavoritesPage);
  $("btnFavClear")?.addEventListener("click", clearFavorites);
}

// ========== UYGULAMA BAŞLANGICI ==========
window.addEventListener("DOMContentLoaded", () => {
  console.log("Uygulama başlatılıyor...");
  
  // UI bağlantılarını kur
  wireUI();
  
  // Sepet sayacını güncelle
  updateCartCounter();
  
  // Son aramaları yükle
  renderRecentSearches();
  
  // Favorileri yükle
  renderFavoritesPage();
  
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
window.setSearchType = setSearchType;

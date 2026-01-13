// app.js - TÜM SİTE URL'LERİ DÜZELTİLDİ (Ürünler Açılacak)

// ========== GLOBAL DEĞİŞKENLER ==========
const $ = (id) => document.getElementById(id);

// Sepet ve önbellek
let cartItems = JSON.parse(localStorage.getItem('fiyattakip_cart') || '[]');
let currentUser = null;
let currentSearchType = 'all';

// ========== DÜZELTİLMİŞ SİTE URL YAPILARI ==========
const SITES = {
  new: [
    { 
      name: "Trendyol", 
      icon: "🛍️", 
      type: "new", 
      domain: "trendyol.com",
      searchUrl: (query) => `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}&sst=PRICE_BY_ASC`
    },
    { 
      name: "Hepsiburada", 
      icon: "📦", 
      type: "new", 
      domain: "hepsiburada.com",
      searchUrl: (query) => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}&siralama=yorumsayisi-azalan`
    },
    { 
      name: "Amazon TR", 
      icon: "📦", 
      type: "new", 
      domain: "amazon.com.tr",
      searchUrl: (query) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(query)}&s=price-asc-rank`
    },
    { 
      name: "n11", 
      icon: "🏪", 
      type: "new", 
      domain: "n11.com",
      searchUrl: (query) => `https://www.n11.com/arama?q=${encodeURIComponent(query)}&srt=PRICE_LOW`
    },
    { 
      name: "ÇiçekSepeti", 
      icon: "🌸", 
      type: "new", 
      domain: "ciceksepeti.com",
      searchUrl: (query) => `https://www.ciceksepeti.com/arama?query=${encodeURIComponent(query)}&srt=PRICE_LOW`
    },
    { 
      name: "Teknosa", 
      icon: "💻", 
      type: "new", 
      domain: "teknosa.com",
      searchUrl: (query) => `https://www.teknosa.com/arama/?s=${encodeURIComponent(query)}&srt=PRICE_LOW`
    },
    { 
      name: "Vatan Bilgisayar", 
      icon: "💾", 
      type: "new", 
      domain: "vatanbilgisayar.com",
      searchUrl: (query) => {
        // Boşluğu %20 ile değiştir
        const encodedQuery = query.replace(/ /g, '%20');
        return `https://www.vatanbilgisayar.com/arama/${encodedQuery}/?srt=UP`;
      }
    },
    { 
      name: "MediaMarkt", 
      icon: "📺", 
      type: "new", 
      domain: "mediamarkt.com.tr",
      searchUrl: (query) => {
        const encodedQuery = query.replace(/ /g, '%20');
        return `https://www.mediamarkt.com.tr/tr/search.html?query=${encodedQuery}&sort=currentprice+asc`;
      }
    },
    { 
      name: "İdefix", 
      icon: "📚", 
      type: "new", 
      domain: "idefix.com",
      searchUrl: (query) => {
        const encodedQuery = query.replace(/ /g, '+');
        return `https://www.idefix.com/arama?q=${encodedQuery}&typing=false&siralama=asc_price`;
      }
    },
    { 
      name: "PTT AVM", 
      icon: "📮", 
      type: "new", 
      domain: "pttavm.com",
      searchUrl: (query) => `https://www.pttavm.com/arama?q=${encodeURIComponent(query)}&srt=price_asc`
    }
  ],
  secondhand: [
    { 
      name: "Sahibinden", 
      icon: "🏠", 
      type: "secondhand", 
      domain: "sahibinden.com",
      searchUrl: (query) => `https://www.sahibinden.com/arama?query_text=${encodeURIComponent(query)}&sorting=price_asc`
    },
    { 
      name: "Dolap", 
      icon: "👗", 
      type: "secondhand", 
      domain: "dolap.com",
      searchUrl: (query) => `https://dolap.com/ara?q=${encodeURIComponent(query)}&sira=artan-fiyat`
    },
    { 
      name: "Letgo", 
      icon: "🔄", 
      type: "secondhand", 
      domain: "letgo.com",
      searchUrl: (query) => `https://www.letgo.com/arama?query_text=${encodeURIComponent(query)}&isSearchCall=true&sorting=desc-price`
    },
    { 
      name: "Facebook Marketplace", 
      icon: "📱", 
      type: "secondhand", 
      domain: "facebook.com/marketplace",
      searchUrl: (query) => `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}&sortBy=price_ascend`
    }
  ]
};

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

  // PC Toplama kartı (arama sonucunun en üstü)
  let pcCardHTML = "";
  if (window.PCBuilder && PCBuilder.isPcRelated(query)) {
    pcCardHTML = `<div id="pcSearchMount"></div>`;
  }
// Mevcut arama tipine göre siteleri filtrele
  let sitesToShow = [];
  
  if (currentSearchType === 'all') {
    // Tüm siteleri birleştir (önce yeni, sonra ikinci el)
    sitesToShow = [...SITES.new, ...SITES.secondhand];
  } else if (currentSearchType === 'new') {
    // Sadece yeni ürün siteleri
    sitesToShow = SITES.new;
  } else if (currentSearchType === 'secondhand') {
    // Sadece ikinci el siteleri
    sitesToShow = SITES.secondhand;
  }
  
  // Her site için kart oluştur
  let html = '';
  
  sitesToShow.forEach((site, index) => {
    const url = site.searchUrl(query);
    
    html += `
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
          <span class="footerBadge">${site.domain}</span>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = pcCardHTML + html;

  // PC Builder içeriğini bas
  const pcMount = document.getElementById('pcSearchMount');
  if (pcMount && window.PCBuilder) {
    PCBuilder.renderTo(pcMount, query, query);
  }
  
  // Arama istatistiklerini güncelle
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
        <div class="siteFooter">
          <span class="footerBadge">${new Date(fav.addedAt).toLocaleDateString('tr-TR')}</span>
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

// ========== AYARLAR ve KULLANICI ==========
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
  
  // Demo login
  currentUser = {
    email: email,
    displayName: email.split('@')[0],
    uid: 'mock_' + Date.now()
  };
  toast("Demo: Giriş başarılı! ✅", "success");
  hideLoginModal();
  updateUserInfo();
}

function logout() {
  currentUser = null;
  toast("Demo: Çıkış yapıldı", "info");
  updateUserInfo();
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

// ========== ARAMA TİPLERİNİ YÖNET ==========
function setSearchType(type) {
  currentSearchType = type;
  
  // UI'da aktif butonu güncelle
  document.querySelectorAll(".typeBtn").forEach(btn => {
    btn.classList.remove("active");
  });
  
  const activeBtn = document.querySelector(`.typeBtn[data-type="${type}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  // Eğer arama sayfasındaysak, sonuçları yenile
  if ($("page-search")?.classList.contains("active") && $("qNormal").value.trim()) {
    performSearch();
  }
  
  toast(`Arama tipi: ${type === 'all' ? 'Tüm Siteler' : type === 'new' ? 'Yeni Ürünler' : 'İkinci El'}`, "info");
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
  
  // Demo login butonları
  $("btnLogin")?.addEventListener("click", loginWithEmail);
  
  // Enter key for login
  $("loginPass")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginWithEmail();
  });
}

// ========== UYGULAMA BAŞLANGICI ==========


/* ===== PC TOPLAMA MOTORU (2010+ / KURAL TABANLI) ===== */
(function(){
  const PC = {};

  // --- Chipset DB (2010+ desktop) ---
  const CHIPSET_DB = {
    // AMD AM3/AM3+
    "760g":{brand:"amd",socket:"AM3",ram:"DDR3"},
    "770":{brand:"amd",socket:"AM3",ram:"DDR3"},
    "780g":{brand:"amd",socket:"AM3",ram:"DDR3"},
    "785g":{brand:"amd",socket:"AM3",ram:"DDR3"},
    "870":{brand:"amd",socket:"AM3",ram:"DDR3"},
    "880g":{brand:"amd",socket:"AM3",ram:"DDR3"},
    "890fx":{brand:"amd",socket:"AM3+",ram:"DDR3"},
    "970":{brand:"amd",socket:"AM3+",ram:"DDR3"},
    "990x":{brand:"amd",socket:"AM3+",ram:"DDR3"},
    "990fx":{brand:"amd",socket:"AM3+",ram:"DDR3"},
    // AMD AM4
    "a320":{brand:"amd",socket:"AM4",ram:"DDR4"},
    "a520":{brand:"amd",socket:"AM4",ram:"DDR4"},
    "b350":{brand:"amd",socket:"AM4",ram:"DDR4"},
    "b450":{brand:"amd",socket:"AM4",ram:"DDR4"},
    "b550":{brand:"amd",socket:"AM4",ram:"DDR4"},
    "x370":{brand:"amd",socket:"AM4",ram:"DDR4"},
    "x470":{brand:"amd",socket:"AM4",ram:"DDR4"},
    "x570":{brand:"amd",socket:"AM4",ram:"DDR4"},
    // AMD AM5
    "a620":{brand:"amd",socket:"AM5",ram:"DDR5"},
    "b650":{brand:"amd",socket:"AM5",ram:"DDR5"},
    "b650e":{brand:"amd",socket:"AM5",ram:"DDR5"},
    "x670":{brand:"amd",socket:"AM5",ram:"DDR5"},
    "x670e":{brand:"amd",socket:"AM5",ram:"DDR5"},
    // Intel 2010+
    "h61":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "h67":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "p67":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "z68":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "h77":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "z75":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "z77":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "h81":{brand:"intel",socket:"LGA1150",ram:"DDR3"},
    "b85":{brand:"intel",socket:"LGA1150",ram:"DDR3"},
    "h87":{brand:"intel",socket:"LGA1150",ram:"DDR3"},
    "z87":{brand:"intel",socket:"LGA1150",ram:"DDR3"},
    "h97":{brand:"intel",socket:"LGA1150",ram:"DDR3"},
    "z97":{brand:"intel",socket:"LGA1150",ram:"DDR3"},
    "h110":{brand:"intel",socket:"LGA1151",ram:"DDR4"},
    "b150":{brand:"intel",socket:"LGA1151",ram:"DDR4"},
    "h170":{brand:"intel",socket:"LGA1151",ram:"DDR4"},
    "z170":{brand:"intel",socket:"LGA1151",ram:"DDR4"},
    "b250":{brand:"intel",socket:"LGA1151",ram:"DDR4"},
    "h270":{brand:"intel",socket:"LGA1151",ram:"DDR4"},
    "z270":{brand:"intel",socket:"LGA1151",ram:"DDR4"},
    "h310":{brand:"intel",socket:"LGA1151v2",ram:"DDR4"},
    "b360":{brand:"intel",socket:"LGA1151v2",ram:"DDR4"},
    "b365":{brand:"intel",socket:"LGA1151v2",ram:"DDR4"},
    "h370":{brand:"intel",socket:"LGA1151v2",ram:"DDR4"},
    "z370":{brand:"intel",socket:"LGA1151v2",ram:"DDR4"},
    "z390":{brand:"intel",socket:"LGA1151v2",ram:"DDR4"},
    "h410":{brand:"intel",socket:"LGA1200",ram:"DDR4"},
    "b460":{brand:"intel",socket:"LGA1200",ram:"DDR4"},
    "h470":{brand:"intel",socket:"LGA1200",ram:"DDR4"},
    "z490":{brand:"intel",socket:"LGA1200",ram:"DDR4"},
    "h510":{brand:"intel",socket:"LGA1200",ram:"DDR4"},
    "b560":{brand:"intel",socket:"LGA1200",ram:"DDR4"},
    "h570":{brand:"intel",socket:"LGA1200",ram:"DDR4"},
    "z590":{brand:"intel",socket:"LGA1200",ram:"DDR4"},
    "h610":{brand:"intel",socket:"LGA1700",ram:"DDR4/DDR5"},
    "b660":{brand:"intel",socket:"LGA1700",ram:"DDR4/DDR5"},
    "b760":{brand:"intel",socket:"LGA1700",ram:"DDR4/DDR5"},
    "z690":{brand:"intel",socket:"LGA1700",ram:"DDR4/DDR5"},
    "z790":{brand:"intel",socket:"LGA1700",ram:"DDR4/DDR5"},
    "h810":{brand:"intel",socket:"LGA1851",ram:"DDR5"},
    "b860":{brand:"intel",socket:"LGA1851",ram:"DDR5"},
    "z890":{brand:"intel",socket:"LGA1851",ram:"DDR5"}
  };

  const ALIAS_FIX = [
    {re:/\bb610\b/ig, to:"h610"},
    {re:/\bb710\b/ig, to:"b760"},
    {re:/\bz710\b/ig, to:"z790"}
  ];

  function normalizeQuery(q){
    let s = (q||"").toLowerCase().trim();
    ALIAS_FIX.forEach(a=>{ s = s.replace(a.re, a.to); });
    s = s.replace(/\s+/g," ");
    return s;
  }

  function detectRam(q){
    q = normalizeQuery(q);
    const m = q.match(/\bddr(3|4|5)\b/i);
    if(!m) return null;
    const type = "DDR"+m[1];
    const size = (q.match(/\b(4|8|16|32|64)\s*gb\b/i)||[])[1] ? ((q.match(/\b(4|8|16|32|64)\s*gb\b/i)||[])[1]+"GB") : null;
    const mhz = (q.match(/\b(1066|1333|1600|1866|2133|2400|2666|3000|3200|3600|4000|4800|5200|5600|6000|6400|7200|8000)\b/)||[])[1] || null;
    return {type,size,mhz};
  }

  function detectPsu(q){
    q = normalizeQuery(q);
    const m = q.match(/\b(300|350|400|450|500|550|600|650|700|750|800|850|900|1000|1200)\s*w\b/);
    if(!m) return null;
    return {watt: parseInt(m[1],10)};
  }

  function detectChipset(q){
    q = normalizeQuery(q);
    const keys = Object.keys(CHIPSET_DB).sort((a,b)=>b.length-a.length);
    for(const k of keys){
      if(q.includes(k)) return {chipset:k.toUpperCase(), ...CHIPSET_DB[k]};
    }
    return null;
  }

  // Intel CPU parse: i3/i5/i7/i9 + model number
  function parseIntelCPU(q){
    q = normalizeQuery(q);
    // examples: i5 12400f, i7-8700k, 14700k
    let m = q.match(/\b(i[3579])[-\s]?(\d{4,5})([a-z]{0,3})\b/i);
    if(!m){
      // allow bare 5-digit like 12400f / 14700k etc when "i5" omitted
      m = q.match(/\b(\d{5})([a-z]{0,3})\b/i);
      if(!m) return null;
      // can't know i3/i5/i7/i9, assume i5 mid unless "900" style doesn't apply
      return intelFromModel("i5", m[1], m[2]);
    }
    return intelFromModel(m[1].toLowerCase(), m[2], m[3].toLowerCase());
  }

  function intelFromModel(family, modelStr, suffix){
    const model = parseInt(modelStr,10);
    let gen;
    if(modelStr.length===4){
      gen = parseInt(modelStr[0],10); // 2..9
    } else {
      gen = parseInt(modelStr.slice(0,2),10); // 10..
    }
    let socket="LGA1700", ram="DDR4/DDR5";
    if(gen<=3){ socket="LGA1155"; ram="DDR3"; }
    else if(gen<=5){ socket="LGA1150"; ram="DDR3"; }
    else if(gen<=7){ socket="LGA1151"; ram="DDR4"; }
    else if(gen<=9){ socket="LGA1151v2"; ram="DDR4"; }
    else if(gen<=11){ socket="LGA1200"; ram="DDR4"; }
    else if(gen<=14){ socket="LGA1700"; ram="DDR4/DDR5"; }
    else { socket="LGA1851"; ram="DDR5"; }
    const level = (family==="i3") ? "entry" : (family==="i5") ? "mid" : "high";
    return {brand:"Intel", family:family.toUpperCase(), model:modelStr+suffix.toUpperCase(), gen, socket, ram, level};
  }

  function parseAmdRyzen(q){
    q = normalizeQuery(q);
    // Ryzen 5 5600X, R7 5800X3D, 7700, 9700X etc
    let m = q.match(/\b(ryzen\s*[3579]|r[3579])\s*(\d{4})(x3d|xt|x|g|ge)?\b/i);
    if(!m){
      // bare 4-digit like 5600x/7700x
      m = q.match(/\b(\d{4})(x3d|xt|x|g|ge)?\b/i);
      if(!m) return null;
      // assume R5 unless 8/9xxx? We'll guess by range
      return amdFromModel("R5", m[1], (m[2]||"").toLowerCase());
    }
    const fam = m[1].toLowerCase().includes("7") ? "R7" : m[1].toLowerCase().includes("9") ? "R9" : m[1].toLowerCase().includes("3") ? "R3" : "R5";
    return amdFromModel(fam, m[2], (m[3]||"").toLowerCase());
  }

  function amdFromModel(fam, modelStr, suffix){
    const n = parseInt(modelStr,10);
    let socket="AM4", ram="DDR4";
    if(n>=7000){ socket="AM5"; ram="DDR5"; }
    const level = (fam==="R3") ? "entry" : (fam==="R5") ? "mid" : "high";
    return {brand:"AMD", family:fam, model:modelStr + suffix.toUpperCase(), socket, ram, level, suffix:suffix.toUpperCase()};
  }

  function parseGpu(q){
    q = normalizeQuery(q);
    // NVIDIA RTX/GTX
    let m = q.match(/\b(rtx|gtx)\s*(\d{3,4})\s*(ti|super)?\b/i);
    if(m){
      const kind = m[1].toUpperCase();
      const num = parseInt(m[2],10);
      const suf = (m[3]||"").toUpperCase();
      let tier = "entry";
      if(kind==="RTX"){
        if(num>=4070) tier="high";
        else if(num>=3060) tier="mid";
        else tier="entry";
      } else {
        if(num>=1080) tier="mid";
        else tier="entry";
      }
      let minPsu = tier==="high" ? 650 : tier==="mid" ? 600 : 500;
      return {brand:"NVIDIA", name:`${kind} ${m[2]} ${suf}`.trim(), tier, minPsu};
    }
    // AMD RX
    m = q.match(/\brx\s*(\d{3,4})\s*(xt|x)?\b/i);
    if(m){
      const num = parseInt(m[1],10);
      const suf = (m[2]||"").toUpperCase();
      let tier="entry";
      if(num>=7800) tier="high";
      else if(num>=6600) tier="mid";
      else tier="entry";
      let minPsu = tier==="high" ? 700 : tier==="mid" ? 600 : 500;
      // Special: 6700 XT etc
      if(num==6700 and suf=="XT") minPsu=650;
      return {brand:"AMD", name:`RX ${m[1]} ${suf}`.trim(), tier, minPsu};
    }
    return null;
  }

  function detectPart(q){
    const nq = normalizeQuery(q);
    const cpuA = parseAmdRyzen(nq);
    const cpuI = parseIntelCPU(nq);
    const gpu = parseGpu(nq);
    const cs = detectChipset(nq);
    const ram = detectRam(nq);
    const psu = detectPsu(nq);

    // decide by strongest match
    if(cpuA && /ryzen|\br[3579]\b/i.test(nq)) return {type:"cpu", data:cpuA};
    if(cpuI && /\bi[3579]\b|\b\d{4,5}[a-z]{0,2}\b/i.test(nq)) return {type:"cpu", data:cpuI};
    if(gpu) return {type:"gpu", data:gpu};
    if(cs) return {type:"mobo", data:cs};
    if(ram) return {type:"ram", data:ram};
    if(psu) return {type:"psu", data:psu};
    return null;
  }

  function pickMoboByProfile(socket, profile){
    // generic pick by socket & profile
    if(socket==="AM4"){
      return profile==="budget" ? "A520 / B450 (giriş)" : profile==="balanced" ? "B450 üst / B550" : "B550 üst / X570";
    }
    if(socket==="AM5"){
      return profile==="budget" ? "A620" : profile==="balanced" ? "B650" : "B650E / X670E";
    }
    if(socket==="LGA1155") return profile==="budget" ? "H61/H67" : profile==="balanced" ? "H77" : "Z77";
    if(socket==="LGA1150") return profile==="budget" ? "H81/B85" : profile==="balanced" ? "H97" : "Z97";
    if(socket==="LGA1151") return profile==="budget" ? "H110/B150" : profile==="balanced" ? "H270" : "Z270";
    if(socket==="LGA1151v2") return profile==="budget" ? "H310/B360" : profile==="balanced" ? "B365/H370" : "Z390";
    if(socket==="LGA1200") return profile==="budget" ? "H410/B460" : profile==="balanced" ? "B560" : "Z590";
    if(socket==="LGA1700") return profile==="budget" ? "H610" : profile==="balanced" ? "B660/B760" : "Z690/Z790";
    if(socket==="LGA1851") return profile==="budget" ? "H810" : profile==="balanced" ? "B860" : "Z890";
    return "Uyumlu bir anakart";
  }

  function pickRamByPlatform(ramType, profile){
    if(ramType==="DDR3") return profile==="performance" ? "16GB DDR3 1600" : "8-16GB DDR3 1600";
    if(ramType==="DDR4") return profile==="budget" ? "16GB DDR4 3200" : profile==="balanced" ? "16GB DDR4 3200 CL16" : "32GB DDR4 3600";
    if(ramType==="DDR5") return profile==="budget" ? "16GB DDR5 5600" : profile==="balanced" ? "32GB DDR5 6000" : "32GB DDR5 6000-6400";
    return "16GB RAM";
  }

  function pickPsu(minWatt, profile){
    const base = minWatt || 500;
    const extra = profile==="budget" ? 0 : profile==="balanced" ? 50 : 150;
    const target = base + extra;
    const rounded = target<=500?500: target<=550?550: target<=650?650: target<=750?750: target<=850?850: 1000;
    const rating = rounded>=750 ? "Gold" : "Bronze";
    return `${rounded}W 80+ ${rating}`;
  }

  function buildProfiles(part){
    const profiles = [
      {key:"budget", label:"💸 Bütçe"},
      {key:"balanced", label:"⚖️ Dengeli"},
      {key:"performance", label:"🚀 Güçlü"}
    ];

    const out = profiles.map(p=>{
      const profile = p.key;
      const row = {profile: p.label};

      if(part.type==="cpu"){
        row.cpu = part.data.brand==="Intel" ? `${part.data.family} ${part.data.model}` : `${part.data.family} ${part.data.model}`;
        row.mobo = pickMoboByProfile(part.data.socket, profile);
        // choose ram type preference
        const ramType = (part.data.ram||"DDR4/DDR5").includes("DDR5") && profile!=="budget" ? "DDR5" : (part.data.ram||"DDR4").includes("DDR3") ? "DDR3" : "DDR4";
        row.ram = pickRamByPlatform(ramType, profile);
        // gpu suggestion by cpu level
        row.gpu = part.data.level==="entry" ? "GTX 1060 / RX 580" : part.data.level==="mid" ? "RTX 3060 / RX 6600-6700XT" : "RTX 4070 / RX 7800 XT";
        row.psu = pickPsu(600, profile);
      }

      if(part.type==="gpu"){
        row.gpu = part.data.name;
        row.psu = pickPsu(part.data.minPsu, profile);
        row.cpu = part.data.tier==="entry" ? "Ryzen 5 2600 / i5-8400" : part.data.tier==="mid" ? "Ryzen 5 5600 / i5-12400F" : "Ryzen 7 5800X3D / i7-12700F+";
        // infer platform
        row.mobo = part.data.tier==="high" ? "B550 üst / B650 / Z790" : "B450/B550 veya B660";
        row.ram = part.data.tier==="high" ? "32GB RAM" : "16GB RAM";
      }

      if(part.type==="mobo"){
        row.mobo = `${part.data.chipset} (${part.data.socket})`;
        row.cpu = part.data.socket.startsWith("LGA") ? "Uygun Intel CPU" : "Uygun AMD CPU";
        row.ram = part.data.ram.includes("DDR4") && !part.data.ram.includes("DDR5") ? "16GB DDR4 3200" : part.data.ram==="DDR5" ? "32GB DDR5 6000" : "DDR4/DDR5 uyumlu";
        row.gpu = "Bütçene göre GPU";
        row.psu = "650W öneri";
      }

      if(part.type==="ram"){
        row.ram = `${part.data.type}${part.data.size?(" "+part.data.size):""}${part.data.mhz?(" "+part.data.mhz+"MHz"):""}`.trim();
        row.cpu = part.data.type==="DDR3" ? "2-4. nesil Intel / AM3+/FM2+" : part.data.type==="DDR4" ? "AM4 / 6-14. nesil Intel" : "AM5 / 12-15. nesil Intel";
        row.mobo = part.data.type==="DDR3" ? "H61/H77/Z77, 970/990FX" : part.data.type==="DDR4" ? "B450/B550, B660/B760" : "B650/X670E, Z790/B860";
        row.gpu = "GPU seçimine göre";
        row.psu = "Sisteme göre";
      }

      if(part.type==="psu"){
        row.psu = `${part.data.watt}W`;
        row.gpu = part.data.watt<500 ? "RX 570/GTX 970 (riskli)" : part.data.watt<650 ? "RX 6600 / RTX 3060" : part.data.watt<750 ? "RX 6700 XT / RTX 4070" : "Üst seviye GPU";
        row.cpu = "GPU’ya göre CPU";
        row.mobo = "CPU soketine göre";
        row.ram = "16-32GB";
      }

      row.warnings = buildWarnings(part, profile, row);
      return row;
    });

    return out;
  }

  function buildWarnings(part, profile, row){
    const warns = [];
    // RAM mismatch warnings on motherboard
    if(part.type==="mobo"){
      if(part.data.socket==="AM4" && row.ram.includes("DDR5")) warns.push("❌ AM4 anakart DDR5 desteklemez.");
      if(part.data.socket==="AM5" && row.ram.includes("DDR4")) warns.push("❌ AM5 anakart DDR4 desteklemez.");
    }
    if(part.type==="cpu"){
      if((part.data.socket==="AM4") && row.ram.includes("DDR5")) warns.push("❌ AM4 CPU ile DDR5 olmaz.");
      if((part.data.socket==="AM5") && row.ram.includes("DDR4")) warns.push("❌ AM5 CPU ile DDR4 olmaz.");
    }
    if(part.type==="gpu"){
      // Entry CPU vs high GPU
      if(part.data.tier==="high") warns.push("ℹ️ Üst seviye GPU için 1080p/1440p hedefliyorsan 32GB RAM ve güçlü CPU önerilir.");
    }
    if(part.type==="psu"){
      if(part.data.watt<500) warns.push("⚠️ 500W altı PSU'da güçlü ekran kartı riskli olabilir.");
    }
    // 2.el hint
    warns.push("🟡 Bot engeli nedeniyle canlı fiyat yok: kopyala-ara ile sitelerde arat.");
    return warns;
  }

  function isPcRelated(q){
    const s = normalizeQuery(q);
    return /(ryzen|\bi[3579]\b|rtx|gtx|\brx\b|ddr3|ddr4|ddr5|b450|b550|x570|b650|z790|h610|psu|\b\d{3,4}\s*w\b)/i.test(s);
  }

  function buildCardHTML(query, contextLabel){
    const part = detectPart(query);
    if(!part) return "";
    if(!isPcRelated(query)) return "";
    const profiles = buildProfiles(part);
    const safe = (x)=>String(x||"").replace(/[&<>"]/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[m]));
    const title = contextLabel ? `PC Toplama: ${contextLabel}` : "PC Toplama Önerisi";
    let html = `<div class="pcBuildCard">
      <div class="pcBuildHeader">
        <div class="pcBuildTitle">${safe(title)}</div>
        <div class="pcBuildSubtitle">Algılanan: <b>${safe(part.type.toUpperCase())}</b></div>
      </div>
      <div class="pcBuildControls">
        <label>Profil</label>
        <select class="pcProfileSel">
          <option value="0">💸 Bütçe</option>
          <option value="1">⚖️ Dengeli</option>
          <option value="2">🚀 Güçlü</option>
        </select>
        <label>Durum</label>
        <select class="pcConditionSel">
          <option value="2el">🔄 2. El</option>
          <option value="sifir">🛍️ Sıfır</option>
        </select>
        <button class="pcCopyBtn">Kopyala & Ara</button>
      </div>
      <div class="pcBuildBody"></div>
    </div>`;
    return html;
  }

  function renderCard(container, query, contextLabel){
    if(!container) return;
    const part = detectPart(query);
    if(!part || !isPcRelated(query)) return;
    container.innerHTML = buildCardHTML(query, contextLabel);
    const card = container.querySelector(".pcBuildCard");
    const body = card.querySelector(".pcBuildBody");
    const profSel = card.querySelector(".pcProfileSel");
    const condSel = card.querySelector(".pcConditionSel");
    const copyBtn = card.querySelector(".pcCopyBtn");

    const profiles = buildProfiles(part);

    function renderProfile(){
      const p = profiles[parseInt(profSel.value,10)];
      body.innerHTML = `
        <div class="pcGrid">
          <div><span>CPU</span><b>${p.cpu||"-"}</b></div>
          <div><span>GPU</span><b>${p.gpu||"-"}</b></div>
          <div><span>Anakart</span><b>${p.mobo||"-"}</b></div>
          <div><span>RAM</span><b>${p.ram||"-"}</b></div>
          <div><span>PSU</span><b>${p.psu||"-"}</b></div>
        </div>
        <div class="pcWarn">
          ${(p.warnings||[]).map(w=>`<div>${w}</div>`).join("")}
        </div>
      `;
    }
    function buildCopyText(){
      const p = profiles[parseInt(profSel.value,10)];
      const cond = condSel.value==="2el" ? " ikinci el" : " sıfır";
      const lines = [];
      if(p.cpu && p.cpu!=="-") lines.push((p.cpu+cond).trim());
      if(p.gpu && p.gpu!=="-") lines.push((p.gpu+cond).trim());
      if(p.mobo && p.mobo!=="-") lines.push((p.mobo+cond).trim());
      if(p.ram && p.ram!=="-") lines.push((p.ram+cond).trim());
      if(p.psu && p.psu!=="-") lines.push((p.psu+cond).trim());
      return lines.join("\n");
    }
    profSel.addEventListener("change", renderProfile);
    condSel.addEventListener("change", ()=>{});
    copyBtn.addEventListener("click", async ()=>{
      const text = buildCopyText();
      try{
        await navigator.clipboard.writeText(text);
        if(window.toast) toast("Kopyalandı ✅", "success");
      } catch(e){
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy"); ta.remove();
        if(window.toast) toast("Kopyalandı ✅", "success");
      }
    });

    renderProfile();
  }

  // Expose
  PC.normalizeQuery = normalizeQuery;
  PC.detectPart = detectPart;
  PC.renderTo = function(containerIdOrEl, query, label){
    const el = (typeof containerIdOrEl === "string") ? document.getElementById(containerIdOrEl) : containerIdOrEl;
    renderCard(el, query, label);
  };
  PC.isPcRelated = isPcRelated;
  window.PCBuilder = PC;
})();

window.addEventListener("DOMContentLoaded", () => {
  console.log("Uygulama başlatılıyor...");
  const hasMainUI = document.getElementById("qNormal") || document.querySelector(".tab[data-page]");
  if (hasMainUI) {
    // UI bağlantılarını kur
    wireUI();
    // Sepet sayacını güncelle
    updateCartCounter();
    // Son aramaları yükle
    renderRecentSearches();
    // Favorileri yükle
    renderFavoritesPage();
    // Kullanıcı bilgisini güncelle
    updateUserInfo();
  }

  // Ürün detay sayfasında varsa PC Builder bölümünü doldur
  const pcMount = document.getElementById("pcBuilderMount");
  if (pcMount && window.PCBuilder) {
    const h1 = document.querySelector("h1");
    const title = h1 ? h1.textContent.trim() : (document.title || "");
    if (PCBuilder.isPcRelated(title)) {
      PCBuilder.renderTo(pcMount, title, title);
    } else {
      pcMount.innerHTML = `<div class="pcBuildCard"><div class="pcBuildHeader"><div class="pcBuildTitle">PC Toplama</div><div class="pcBuildSubtitle">Bu ürün PC parçası gibi görünmüyor.</div></div></div>`;
    }
  }

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
window.logout = logout;
window.setSearchType = setSearchType;

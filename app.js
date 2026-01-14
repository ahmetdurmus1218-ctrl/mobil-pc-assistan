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

  // ==== PC TOPLAMA MOTORU (kural tabanlı) ====
  try { renderPcBuildCard(query); } catch (e) { console.warn("PC builder error", e); }

  
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
  
  container.innerHTML = html;
  
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
window.logout = logout;
window.setSearchType = setSearchType;



/* =====================================================================
   PC TOPLAMA MOTORU - FULL (2010+ KURAL TABANLI)
   - AI yok, canlı veri yok
   - Her şeyi app.js içinde tutar (ek dosya yok)
   - Yazım varyasyonlarını yakalar (5600x, 12400f, b610->h610 vb.)
===================================================================== */

const PCBUILDER = (() => {
  const LS_PROFILE = "pcbuilder_profile";
  const LS_COND = "pcbuilder_condition";
  const profiles = ["budget","balanced","performance"];
  const profileLabels = {budget:"💸 Bütçe", balanced:"⚖️ Dengeli", performance:"🚀 Güçlü"};
  const condLabels = {secondhand:"🔄 2. El", new:"🛍️ Sıfır"};

  function getProfile(){ return localStorage.getItem(LS_PROFILE) || "balanced"; }
  function setProfile(p){ localStorage.setItem(LS_PROFILE, p); }
  function getCond(){ return localStorage.getItem(LS_COND) || "secondhand"; }
  function setCond(c){ localStorage.setItem(LS_COND, c); }

  // ---------- Helpers ----------
  const norm = (s) => (s||"")
    .toLowerCase()
    .replace(/\s+/g," ")
    .trim();

  const has = (q, x) => q.includes(x);

  // ---------- Chipset DB (2010+) ----------
  // NOTE: Tier here is "chipset feature tier" not board model quality.
  // Board quality (VRM) varies by MODEL; we only guarantee platform+RAM.
  const chipsetAliases = {
    "b610":"h610",
    "b710":"b760",
    "z710":"z790",
    "x650":"b650",
  };

  const CHIPSETS = [
    // AMD AM3/AM3+
    {k:"760g", brand:"amd", socket:"AM3", ram:"DDR3"},
    {k:"770", brand:"amd", socket:"AM3", ram:"DDR3"},
    {k:"780g", brand:"amd", socket:"AM3", ram:"DDR3"},
    {k:"785g", brand:"amd", socket:"AM3", ram:"DDR3"},
    {k:"870", brand:"amd", socket:"AM3", ram:"DDR3"},
    {k:"880g", brand:"amd", socket:"AM3", ram:"DDR3"},
    {k:"890gx", brand:"amd", socket:"AM3", ram:"DDR3"},
    {k:"890fx", brand:"amd", socket:"AM3+", ram:"DDR3"},
    {k:"970", brand:"amd", socket:"AM3+", ram:"DDR3"},
    {k:"990x", brand:"amd", socket:"AM3+", ram:"DDR3"},
    {k:"990fx", brand:"amd", socket:"AM3+", ram:"DDR3"},

    // AMD FM1/FM2/FM2+
    {k:"a55", brand:"amd", socket:"FM1", ram:"DDR3"},
    {k:"a75", brand:"amd", socket:"FM1", ram:"DDR3"},
    {k:"a85x", brand:"amd", socket:"FM2", ram:"DDR3"},
    {k:"a88x", brand:"amd", socket:"FM2+", ram:"DDR3"},
    {k:"a68h", brand:"amd", socket:"FM2+", ram:"DDR3"},
    {k:"a78", brand:"amd", socket:"FM2+", ram:"DDR3"},

    // AMD AM4
    {k:"a320", brand:"amd", socket:"AM4", ram:"DDR4"},
    {k:"a520", brand:"amd", socket:"AM4", ram:"DDR4"},
    {k:"b350", brand:"amd", socket:"AM4", ram:"DDR4"},
    {k:"b450", brand:"amd", socket:"AM4", ram:"DDR4"},
    {k:"b550", brand:"amd", socket:"AM4", ram:"DDR4"},
    {k:"x370", brand:"amd", socket:"AM4", ram:"DDR4"},
    {k:"x470", brand:"amd", socket:"AM4", ram:"DDR4"},
    {k:"x570", brand:"amd", socket:"AM4", ram:"DDR4"},

    // AMD AM5
    {k:"a620", brand:"amd", socket:"AM5", ram:"DDR5"},
    {k:"b650e", brand:"amd", socket:"AM5", ram:"DDR5"},
    {k:"b650", brand:"amd", socket:"AM5", ram:"DDR5"},
    {k:"x670e", brand:"amd", socket:"AM5", ram:"DDR5"},
    {k:"x670", brand:"amd", socket:"AM5", ram:"DDR5"},

    // Intel LGA1155
    {k:"h61", brand:"intel", socket:"LGA1155", ram:"DDR3"},
    {k:"h67", brand:"intel", socket:"LGA1155", ram:"DDR3"},
    {k:"p67", brand:"intel", socket:"LGA1155", ram:"DDR3"},
    {k:"z68", brand:"intel", socket:"LGA1155", ram:"DDR3"},
    {k:"h77", brand:"intel", socket:"LGA1155", ram:"DDR3"},
    {k:"z77", brand:"intel", socket:"LGA1155", ram:"DDR3"},

    // Intel LGA1150
    {k:"h81", brand:"intel", socket:"LGA1150", ram:"DDR3"},
    {k:"b85", brand:"intel", socket:"LGA1150", ram:"DDR3"},
    {k:"h87", brand:"intel", socket:"LGA1150", ram:"DDR3"},
    {k:"z87", brand:"intel", socket:"LGA1150", ram:"DDR3"},
    {k:"h97", brand:"intel", socket:"LGA1150", ram:"DDR3"},
    {k:"z97", brand:"intel", socket:"LGA1150", ram:"DDR3"},

    // Intel LGA1151 (v1)
    {k:"h110", brand:"intel", socket:"LGA1151", ram:"DDR4"},
    {k:"b150", brand:"intel", socket:"LGA1151", ram:"DDR4"},
    {k:"h170", brand:"intel", socket:"LGA1151", ram:"DDR4"},
    {k:"z170", brand:"intel", socket:"LGA1151", ram:"DDR4"},
    {k:"b250", brand:"intel", socket:"LGA1151", ram:"DDR4"},
    {k:"h270", brand:"intel", socket:"LGA1151", ram:"DDR4"},
    {k:"z270", brand:"intel", socket:"LGA1151", ram:"DDR4"},

    // Intel LGA1151v2
    {k:"h310", brand:"intel", socket:"LGA1151v2", ram:"DDR4"},
    {k:"b360", brand:"intel", socket:"LGA1151v2", ram:"DDR4"},
    {k:"b365", brand:"intel", socket:"LGA1151v2", ram:"DDR4"},
    {k:"h370", brand:"intel", socket:"LGA1151v2", ram:"DDR4"},
    {k:"z370", brand:"intel", socket:"LGA1151v2", ram:"DDR4"},
    {k:"z390", brand:"intel", socket:"LGA1151v2", ram:"DDR4"},

    // Intel LGA1200
    {k:"h410", brand:"intel", socket:"LGA1200", ram:"DDR4"},
    {k:"b460", brand:"intel", socket:"LGA1200", ram:"DDR4"},
    {k:"h470", brand:"intel", socket:"LGA1200", ram:"DDR4"},
    {k:"z490", brand:"intel", socket:"LGA1200", ram:"DDR4"},
    {k:"h510", brand:"intel", socket:"LGA1200", ram:"DDR4"},
    {k:"b560", brand:"intel", socket:"LGA1200", ram:"DDR4"},
    {k:"h570", brand:"intel", socket:"LGA1200", ram:"DDR4"},
    {k:"z590", brand:"intel", socket:"LGA1200", ram:"DDR4"},

    // Intel LGA1700
    {k:"h610", brand:"intel", socket:"LGA1700", ram:"DDR4/DDR5"},
    {k:"b660", brand:"intel", socket:"LGA1700", ram:"DDR4/DDR5"},
    {k:"b760", brand:"intel", socket:"LGA1700", ram:"DDR4/DDR5"},
    {k:"z690", brand:"intel", socket:"LGA1700", ram:"DDR4/DDR5"},
    {k:"z790", brand:"intel", socket:"LGA1700", ram:"DDR4/DDR5"},

    // Intel LGA1851 (Core Ultra / 200 series)
    {k:"h810", brand:"intel", socket:"LGA1851", ram:"DDR5"},
    {k:"b860", brand:"intel", socket:"LGA1851", ram:"DDR5"},
    {k:"z890", brand:"intel", socket:"LGA1851", ram:"DDR5"},
  ];

  function detectChipset(q){
    // apply alias replacements on token level
    let qq = q;
    for (const bad in chipsetAliases){
      if (qq.includes(bad)) qq = qq.replaceAll(bad, chipsetAliases[bad]);
    }
    for (const c of CHIPSETS){
      if (qq.includes(c.k)) return {chipset:c.k.toUpperCase(), ...c};
    }
    return null;
  }

  // ---------- CPU detection (pattern-based; "full" without listing every SKU) ----------
  function detectCPU(q){
    // AMD Ryzen: ryzen 3/5/7/9 ####(suffix)
    let m = q.match(/\b(ryzen|r)\s*(3|5|7|9)\s*([0-9]{3,4})([a-z0-9]*)\b/);
    if (m){
      const series = parseInt(m[2],10);
      const num = parseInt(m[3],10);
      const suf = (m[4]||"").toLowerCase();
      let socket="AM4", ram="DDR4", gen=null;
      if (num>=9000){ socket="AM5"; ram="DDR5"; gen="Zen5"; }
      else if (num>=8000){ socket="AM5"; ram="DDR5"; gen="Zen4/Zen4c"; }
      else if (num>=7000){ socket="AM5"; ram="DDR5"; gen="Zen4"; }
      else if (num>=5000){ socket="AM4"; ram="DDR4"; gen="Zen3"; }
      else if (num>=3000){ socket="AM4"; ram="DDR4"; gen="Zen2"; }
      else if (num>=2000){ socket="AM4"; ram="DDR4"; gen="Zen+"; }
      else if (num>=1000){ socket="AM4"; ram="DDR4"; gen="Zen1"; }
      // level heuristic
      const level = series<=3 ? "entry" : (series==5 ? "mid" : (series==7 ? "high" : "high"));
      return {brand:"AMD", family:"Ryzen", name:`Ryzen ${series} ${num}${suf.toUpperCase()}`, series, num, suffix:suf, socket, ram, gen, level, tdp: (series>=7?105:65)};
    }

    // Intel Core i3/i5/i7/i9 xxxx/xxxxx (optional suffix like k,f,kf)
    m = q.match(/\b(i3|i5|i7|i9)\s*[- ]?\s*([0-9]{4,5})([a-z]{0,2})\b/);
    if (m){
      const tier = m[1].toUpperCase();
      const model = m[2];
      const suffix = (m[3]||"").toLowerCase();
      const n = parseInt(model,10);
      let genNum = null;
      if (model.length===5) genNum = parseInt(model.slice(0,2),10);
      else genNum = parseInt(model.slice(0,1),10); // 4-digit: 4xxx => 4th etc
      let socket="LGA1150", ram="DDR3";
      if (genNum<=3){ socket="LGA1155"; ram="DDR3"; }
      else if (genNum<=5){ socket="LGA1150"; ram="DDR3"; }
      else if (genNum<=7){ socket="LGA1151"; ram="DDR4"; }
      else if (genNum<=9){ socket="LGA1151v2"; ram="DDR4"; }
      else if (genNum<=11){ socket="LGA1200"; ram="DDR4"; }
      else if (genNum<=14){ socket="LGA1700"; ram="DDR4/DDR5"; }
      else { socket="LGA1851"; ram="DDR5"; } // future-safe
      const level = (tier==="I3") ? "entry" : (tier==="I5" ? "mid" : "high");
      return {brand:"Intel", family:"Core", name:`Core ${tier}-${model}${suffix.toUpperCase()}`, gen:genNum, socket, ram, level, tdp: (suffix.includes("k")?125:65)};
    }

    // Intel Core Ultra (very simplified): "ultra 5 245k" etc
    m = q.match(/\b(ultra)\s*(3|5|7|9)\s*([0-9]{3})\s*([a-z]{0,2})\b/);
    if (m){
      const tierNum = parseInt(m[2],10);
      const model = m[3];
      const suffix = (m[4]||"").toLowerCase();
      const level = (tierNum<=3)?"entry":(tierNum==5?"mid":"high");
      return {brand:"Intel", family:"Core Ultra", name:`Core Ultra ${tierNum} ${model}${suffix.toUpperCase()}`, gen:"Ultra", socket:"LGA1851", ram:"DDR5", level, tdp:(suffix.includes("k")?125:65)};
    }

    return null;
  }

  // ---------- GPU detection ----------
  function detectGPU(q){
    // NVIDIA RTX/GTX
    let m = q.match(/\b(rtx|gtx)\s*([0-9]{3,4})\s*(ti|super)?\b/);
    if (m){
      const fam = m[1].toUpperCase();
      const num = parseInt(m[2],10);
      const suf = (m[3]||"").toLowerCase();
      const series = Math.floor(num/10)*10;
      let level="mid";
      if (num>=4070 || num>=7800) level="high";
      if (num<=1660 || num<=1060) level="entry";
      // PSU heuristic
      let minPsu = 500;
      if (num>=4070) minPsu = 650;
      if (num>=4080) minPsu = 750;
      if (num>=4090) minPsu = 850;
      return {brand:"NVIDIA", family:fam, name:`${fam} ${num}${suf?(" "+suf.toUpperCase()):""}`, num, suffix:suf, level, minPsu, tdp:(num>=4070?200:170)};
    }

    // AMD RX
    m = q.match(/\b(rx)\s*([0-9]{3,4})\s*(xtx|xt)?\b/);
    if (m){
      const num = parseInt(m[2],10);
      const suf = (m[3]||"").toLowerCase();
      let level="mid";
      if (num<=590) level="entry";
      if (num>=7800 || num>=7900) level="high";
      let minPsu = 500;
      if (num>=6700) minPsu = 650;
      if (num>=7800) minPsu = 750;
      if (num>=7900) minPsu = 850;
      return {brand:"AMD", family:"RX", name:`RX ${num}${suf?(" "+suf.toUpperCase()):""}`, num, suffix:suf, level, minPsu, tdp:(num>=6700?230:160)};
    }
    return null;
  }

  function detectRAM(q){
    const m = q.match(/\bddr(3|4|5)\b/);
    if (!m) return null;
    const type = `DDR${m[1]}`;
    const size = (q.match(/\b([0-9]{1,3})\s*gb\b/)||[])[1] || null;
    const speed = (q.match(/\b(1[0-9]{3}|2[0-9]{3}|3[0-9]{3}|4[0-9]{3}|5[0-9]{3}|6[0-9]{3})\s*mhz\b/)||[])[1] || null;
    return {type, size, speed};
  }

  function detectPSU(q){
    const m = q.match(/\b([4-9][0-9]{2,3})\s*w\b/);
    if(!m) return null;
    const watt = parseInt(m[1],10);
    return {watt};
  }

  function classifyQuery(query){
    const q = norm(query);
    const cpu = detectCPU(q);
    if (cpu) return {type:"cpu", cpu};
    const gpu = detectGPU(q);
    if (gpu) return {type:"gpu", gpu};
    const chipset = detectChipset(q);
    if (chipset) return {type:"mobo", mobo:chipset};
    const ram = detectRAM(q);
    if (ram) return {type:"ram", ram};
    const psu = detectPSU(q);
    if (psu) return {type:"psu", psu};
    return {type:"unknown"};
  }

  // ---------- Recommendation rules ----------
  function recommendFromCPU(cpu, profile){
    const cond = getCond();
    const base = {cpu: cpu.name, why: []};

    // Motherboard chipset suggestion
    let mobo = null;
    if (cpu.socket==="AM4"){
      if (profile==="budget") mobo = "A520 / B450";
      if (profile==="balanced") mobo = "B450 (iyi model) / B550";
      if (profile==="performance") mobo = "B550 (iyi) / X570";
    } else if (cpu.socket==="AM5"){
      if (profile==="budget") mobo = "A620";
      if (profile==="balanced") mobo = "B650";
      if (profile==="performance") mobo = "B650E / X670E";
    } else if (cpu.socket==="LGA1700"){
      if (profile==="budget") mobo = "H610";
      if (profile==="balanced") mobo = "B660 / B760";
      if (profile==="performance") mobo = "Z690 / Z790";
    } else if (cpu.socket==="LGA1200"){
      if (profile==="budget") mobo = "B460 / H510";
      if (profile==="balanced") mobo = "B560 / H570";
      if (profile==="performance") mobo = "Z490 / Z590";
    } else if (cpu.socket==="LGA1151v2"){
      if (profile==="budget") mobo = "H310 / B360";
      if (profile==="balanced") mobo = "B365 / H370";
      if (profile==="performance") mobo = "Z370 / Z390";
    } else if (cpu.socket==="LGA1155"){
      mobo = "H61/H67/H77/Z77 (DDR3)";
    } else {
      mobo = `${cpu.socket} chipset`;
    }

    // RAM
    let ram = cpu.ram;
    if (cpu.ram==="DDR4/DDR5"){
      ram = (profile==="performance") ? "DDR5 6000 (32GB önerilir)" : "DDR4 3200 (16GB min)";
    } else if (cpu.ram==="DDR5"){
      ram = (profile==="budget") ? "DDR5 5200 (16GB)" : (profile==="balanced" ? "DDR5 6000 (16-32GB)" : "DDR5 6000+ (32GB)");
    } else if (cpu.ram==="DDR4"){
      ram = (profile==="budget") ? "DDR4 3200 (16GB)" : (profile==="balanced" ? "DDR4 3200 (16-32GB)" : "DDR4 3600 (32GB)");
    } else if (cpu.ram==="DDR3"){
      ram = "DDR3 1600 (16GB tavsiye)";
    }

    // GPU pairing heuristics
    let gpu = "RX 6600 / RTX 3060 (örnek)";
    if (profile==="budget"){
      gpu = cpu.level==="high" ? "RX 6600 / RTX 3060" : "RX 580 / GTX 1660S";
    } else if (profile==="balanced"){
      gpu = cpu.level==="high" ? "RX 6700 XT / RTX 4060 Ti" : "RX 6600 / RTX 3060";
    } else {
      gpu = "RTX 4070 / RX 7800 XT";
      if (cpu.level==="entry") gpu = "RX 6600 / RTX 3060 (daha mantıklı)";
    }

    // PSU
    let psu = "650W Bronze";
    if (profile==="budget") psu = "500-550W Bronze";
    if (profile==="performance") psu = "750W Gold";

    base.mobo = mobo;
    base.ram = ram;
    base.gpu = gpu;
    base.psu = psu;

    // Condition hint
    if (cond==="new" && (cpu.socket==="LGA1155" || cpu.socket==="LGA1150" || cpu.socket==="AM3" || cpu.socket==="AM3+")){
      base.why.push("Sıfır parça bulunması zor; 2. el daha mantıklı.");
    }
    if (cond==="secondhand") base.why.push("2. elde daha uygun fiyat/performans yakalanır.");

    return base;
  }

  function recommendFromGPU(gpu, profile){
    const cond = getCond();
    const base = {gpu: gpu.name, why: []};

    // CPU pairing
    let cpu = "Ryzen 5 5600 / i5-12400 (örnek)";
    if (gpu.level==="entry"){
      cpu = (profile==="budget") ? "i3-10100 / Ryzen 5 2600" : "Ryzen 5 3600 / i5-10400";
    } else if (gpu.level==="mid"){
      cpu = (profile==="budget") ? "Ryzen 5 3600 / i5-10400" : (profile==="balanced" ? "Ryzen 5 5600 / i5-12400" : "Ryzen 7 5800X3D / i5-13600K");
    } else {
      cpu = (profile==="budget") ? "Ryzen 5 5600 / i5-12400" : (profile==="balanced" ? "Ryzen 7 5800X3D / i5-13600K" : "Ryzen 7 7800X3D / i7-14700K");
    }

    // Motherboard based on cpu pick (rough)
    let mobo = "B550 / B650 / B760 (örnek)";
    if (cpu.includes("7800X3D") || cpu.includes("AM5")) mobo = (profile==="performance")?"X670E":"B650";
    else if (cpu.includes("13600") || cpu.includes("14700")) mobo = (profile==="performance")?"Z790":"B760";
    else mobo = "B550 (AMD) / B760 (Intel)";

    // RAM
    let ram = "16GB DDR4 3200";
    if (mobo.includes("B650") || mobo.includes("X670")) ram = (profile==="performance") ? "32GB DDR5 6000" : "16-32GB DDR5 6000";
    if (mobo.includes("Z790")) ram = (profile==="performance") ? "32GB DDR5 6000" : "16-32GB DDR4 3200 veya DDR5";

    // PSU
    let psu = `${gpu.minPsu}W+ önerilir`;
    if (profile==="performance") psu = `${Math.max(gpu.minPsu+100, 750)}W Gold önerilir`;

    base.cpu = cpu;
    base.mobo = mobo;
    base.ram = ram;
    base.psu = psu;

    if (cond==="secondhand") base.why.push("2. elde ekran kartında fiyat avantajı yüksek olur.");
    return base;
  }

  function recommendFromMobo(mobo, profile){
    const cond = getCond();
    const base = {mobo: `${mobo.chipset} (${mobo.socket})`, why: []};

    // CPU suggestion by socket
    let cpu = "Uyumlu CPU";
    if (mobo.socket==="AM4"){
      cpu = (profile==="budget") ? "Ryzen 5 2600 / 3600" : (profile==="balanced" ? "Ryzen 5 5600" : "Ryzen 7 5800X3D");
    } else if (mobo.socket==="AM5"){
      cpu = (profile==="budget") ? "Ryzen 5 7500F / 7600" : (profile==="balanced" ? "Ryzen 5 7600 / Ryzen 7 7700" : "Ryzen 7 7800X3D / Ryzen 9 7900");
    } else if (mobo.socket==="LGA1700"){
      cpu = (profile==="budget") ? "i3-12100F / i5-12400F" : (profile==="balanced" ? "i5-13400F / i5-12400" : "i5-13600K / i7-14700K");
    } else if (mobo.socket==="LGA1200"){
      cpu = (profile==="budget") ? "i3-10100 / i5-10400" : (profile==="balanced" ? "i5-11400" : "i7-11700K");
    } else {
      cpu = `Bu soket için uyumlu CPU ( ${mobo.socket} )`;
    }

    // RAM
    let ram = mobo.ram.includes("DDR5") ? "DDR5 6000" : (mobo.ram.includes("DDR4") ? "DDR4 3200" : "DDR3 1600");
    if (profile==="performance") ram = mobo.ram.includes("DDR5") ? "32GB DDR5 6000" : "32GB DDR4 3600";
    else ram = mobo.ram.includes("DDR5") ? "16-32GB DDR5 6000" : "16GB DDR4 3200";

    // GPU
    let gpu = (profile==="budget") ? "RX 580 / GTX 1660S" : (profile==="balanced" ? "RX 6600 / RTX 3060" : "RTX 4070 / RX 7800 XT");
    if (mobo.ram.includes("DDR3")) gpu = (profile==="performance") ? "GTX 970 / RX 580 (üst sınır)" : "GTX 960/1050Ti";

    // PSU
    let psu = (profile==="budget") ? "500W Bronze" : (profile==="balanced" ? "650W Bronze" : "750W Gold");

    base.cpu = cpu;
    base.ram = ram;
    base.gpu = gpu;
    base.psu = psu;

    if (cond==="new" && (mobo.ram==="DDR3" || mobo.socket in {"LGA1155":1,"LGA1150":1})){
      base.why.push("Sıfırda bulunması zor; 2. el daha mantıklı.");
    }
    return base;
  }

  function recommendFromRAM(ram, profile){
    const base = {ram: `${ram.type}${ram.size?(" "+ram.size+"GB"):""}${ram.speed?(" "+ram.speed+"MHz"):""}`, why: []};
    if (ram.type==="DDR3"){
      base.mobo = "LGA1155/LGA1150 veya AM3/AM3+ (DDR3)";
      base.cpu = "i7-2600 / i5-3470 / FX-8350 (örnek)";
      base.gpu = "GTX 970 / RX 580";
      base.psu = "500W Bronze";
      base.why.push("DDR3 sadece eski platformlarda çalışır.");
    } else if (ram.type==="DDR4"){
      base.mobo = "AM4 (B450/B550) veya Intel 6-14. nesil DDR4 anakart";
      base.cpu = (profile==="budget")?"Ryzen 5 3600 / i5-10400":"Ryzen 5 5600 / i5-12400";
      base.gpu = (profile==="performance")?"RTX 4070 (CPU güçlü olmalı)":"RX 6600 / RTX 3060";
      base.psu = (profile==="performance")?"750W Gold":"650W Bronze";
    } else {
      base.mobo = "AM5 (A620/B650/X670) veya Intel DDR5 anakart (B760/Z790)";
      base.cpu = (profile==="budget")?"Ryzen 5 7600 / i5-12400":"Ryzen 7 7800X3D / i7-14700K";
      base.gpu = (profile==="performance")?"RTX 4070 / RX 7800 XT":"RX 6700 XT / RTX 4060";
      base.psu = (profile==="performance")?"750W Gold":"650W Bronze";
    }
    return base;
  }

  function recommendFromPSU(psu, profile){
    const base = {psu: `${psu.watt}W`, why: []};
    if (psu.watt < 450){
      base.why.push("450W altı modern ekran kartlarında risklidir.");
    }
    if (psu.watt < 550){
      base.gpu = "RX 580 / GTX 1660S ve altı";
      base.cpu = "Ryzen 5 2600 / i5-8400";
    } else if (psu.watt < 700){
      base.gpu = "RX 6700 XT / RTX 3060-4060";
      base.cpu = "Ryzen 5 5600 / i5-12400";
    } else {
      base.gpu = "RTX 4070 / RX 7800 XT ve üstü";
      base.cpu = "Ryzen 7 7800X3D / i7-14700K";
    }
    base.mobo = "CPU seçimine göre (AM4/AM5/LGA1700)";
    return base;
  }

  function buildRecommendations(classified){
    const p = getProfile();
    const result = {
      detected: classified,
      selectedProfile: p,
      selectedCondition: getCond(),
      profiles: {}
    };
    for (const prof of profiles){
      if (classified.type==="cpu") result.profiles[prof] = recommendFromCPU(classified.cpu, prof);
      else if (classified.type==="gpu") result.profiles[prof] = recommendFromGPU(classified.gpu, prof);
      else if (classified.type==="mobo") result.profiles[prof] = recommendFromMobo(classified.mobo, prof);
      else if (classified.type==="ram") result.profiles[prof] = recommendFromRAM(classified.ram, prof);
      else if (classified.type==="psu") result.profiles[prof] = recommendFromPSU(classified.psu, prof);
      else result.profiles[prof] = {why:["Parça tanınamadı. Chipset/CPU/GPU/RAM/PSU formatında yaz." ]};
    }
    return result;
  }

  // ---------- Compatibility warnings (hard + soft) ----------
  function getWarnings(system){
    const w = {hard:[], soft:[]};

    // DDR mismatch
    const ramStr = (system.ram||"").toUpperCase();
    const moboStr = (system.mobo||"").toUpperCase();
    if (ramStr.includes("DDR5") && (moboStr.includes("B450") || moboStr.includes("B550") || moboStr.includes("H610") || moboStr.includes("B660") || moboStr.includes("Z690") || moboStr.includes("Z790")===false)){
      // don't overfit; but highlight known DDR4-only chipsets
      if (moboStr.includes("B450") || moboStr.includes("B550")) w.hard.push("❌ DDR5, AM4 (B450/B550/X570) ile uymaz.");
    }
    if (ramStr.includes("DDR4") && (moboStr.includes("B650") || moboStr.includes("X670") || moboStr.includes("A620"))){
      w.hard.push("❌ DDR4, AM5 (A620/B650/X670) ile uymaz.");
    }
    if (ramStr.includes("DDR3") && (moboStr.includes("B450") || moboStr.includes("B550") || moboStr.includes("B650") || moboStr.includes("Z790") || moboStr.includes("B760"))){
      w.hard.push("❌ DDR3 modern platformlarla uymaz.");
    }

    // PSU warnings (if detected GPU)
    const psuStr = (system.psu||"").toUpperCase();
    const psuW = (psuStr.match(/([4-9][0-9]{2,3})W/)||[])[1];
    if (psuW){
      const watt = parseInt(psuW,10);
      if ((system.gpu||"").toUpperCase().includes("RTX 4070") && watt < 650) w.hard.push("❌ RTX 4070 için 650W altı riskli.");
      if ((system.gpu||"").toUpperCase().includes("RX 6700") && watt < 650) w.hard.push("❌ RX 6700 XT için 650W önerilir.");
      if ((system.gpu||"").toUpperCase().includes("RX 580") && watt < 500) w.hard.push("❌ RX 580 için 500W altı riskli.");
    }

    // Soft: board quality hint
    if (moboStr.includes("H610") && (system.cpu||"").includes("i7")) w.soft.push("⚠️ H610 + i7: VRM ısınması olabilir; B760/Z790 daha mantıklı.");
    if (moboStr.includes("B450") && ((system.cpu||"").includes("Ryzen 7") || (system.cpu||"").includes("Ryzen 9"))) w.soft.push("⚠️ B450 giriş modellerinde Ryzen 7/9 uzun yükte ısınabilir; iyi VRM veya B550 önerilir.");
    return w;
  }

  function renderPcBuildCard(query){
    const container = document.getElementById("normalList");
    if (!container) return;

    // remove existing card if any
    const existing = container.querySelector(".pcBuildCard");
    if (existing) existing.remove();

    const classified = classifyQuery(query);
    const built = buildRecommendations(classified);

    const activeProfile = getProfile();
    const active = built.profiles[activeProfile] || {};
    const warnings = getWarnings(active);

    // Build UI
    const card = document.createElement("div");
    card.className = "pcBuildCard cardBox";
    card.innerHTML = `
      <div class="pcBuildTop">
        <div class="pcBuildTitle">🧩 Sistem Kurma Önerisi</div>
        <div class="pcBuildSub">Yazdığın parça: <b>${escapeHtml(query)}</b></div>
      </div>

      <div class="pcBuildSelectors">
        <div class="pcSeg">
          <div class="pcSegLabel">Profil</div>
          <div class="pcSegBtns">
            ${profiles.map(p=>`<button class="pcBtn ${getProfile()===p?"active":""}" data-prof="${p}">${profileLabels[p]}</button>`).join("")}
          </div>
        </div>
        <div class="pcSeg">
          <div class="pcSegLabel">Durum</div>
          <div class="pcSegBtns">
            ${["secondhand","new"].map(c=>`<button class="pcBtn ${getCond()===c?"active":""}" data-cond="${c}">${condLabels[c]}</button>`).join("")}
          </div>
        </div>
      </div>

      <div class="pcBuildDetected">
        <span class="tag">Tanınan: <b>${escapeHtml(classified.type.toUpperCase())}</b></span>
        ${classified.type==="cpu" ? `<span class="tag">${escapeHtml(classified.cpu.name)} • ${escapeHtml(classified.cpu.socket)} • ${escapeHtml(classified.cpu.ram)}</span>` : ""}
        ${classified.type==="gpu" ? `<span class="tag">${escapeHtml(classified.gpu.name)} • min PSU: ${classified.gpu.minPsu}W</span>` : ""}
        ${classified.type==="mobo" ? `<span class="tag">${escapeHtml(classified.mobo.chipset)} • ${escapeHtml(classified.mobo.socket)} • ${escapeHtml(classified.mobo.ram)}</span>` : ""}
        ${classified.type==="ram" ? `<span class="tag">${escapeHtml(classified.ram.type)} ${classified.ram.size?escapeHtml(classified.ram.size+"GB"):""}</span>` : ""}
        ${classified.type==="psu" ? `<span class="tag">${classified.psu.watt}W PSU</span>` : ""}
      </div>

      ${warnings.hard.length ? `<div class="pcWarn hard">${warnings.hard.map(x=>`<div>${escapeHtml(x)}</div>`).join("")}</div>` : `<div class="pcOk">✅ Kritik uyumsuzluk yok</div>`}
      ${warnings.soft.length ? `<div class="pcWarn soft">${warnings.soft.map(x=>`<div>${escapeHtml(x)}</div>`).join("")}</div>` : ""}

      <div class="pcBuildGrid">
        <div><div class="pcLbl">CPU</div><div class="pcVal">${escapeHtml(active.cpu||"-")}</div></div>
        <div><div class="pcLbl">GPU</div><div class="pcVal">${escapeHtml(active.gpu||"-")}</div></div>
        <div><div class="pcLbl">Anakart</div><div class="pcVal">${escapeHtml(active.mobo||"-")}</div></div>
        <div><div class="pcLbl">RAM</div><div class="pcVal">${escapeHtml(active.ram||"-")}</div></div>
        <div><div class="pcLbl">PSU</div><div class="pcVal">${escapeHtml(active.psu||"-")}</div></div>
      </div>

      <div class="pcBuildActions">
        <button class="btnPrimary pcAction" id="pcCopySearch">📋 Kopyala & Ara</button>
        <button class="btnSecondary pcAction" id="pcShowAll">📌 3 Profil Göster</button>
      </div>

      <div class="pcProfilesAll" style="display:none;">
        ${profiles.map(p=>{
          const s = built.profiles[p]||{};
          return `
            <div class="pcProfileBox">
              <div class="pcProfileHead">${profileLabels[p]}</div>
              <div class="pcProfileLine"><b>CPU:</b> ${escapeHtml(s.cpu||"-")}</div>
              <div class="pcProfileLine"><b>GPU:</b> ${escapeHtml(s.gpu||"-")}</div>
              <div class="pcProfileLine"><b>Anakart:</b> ${escapeHtml(s.mobo||"-")}</div>
              <div class="pcProfileLine"><b>RAM:</b> ${escapeHtml(s.ram||"-")}</div>
              <div class="pcProfileLine"><b>PSU:</b> ${escapeHtml(s.psu||"-")}</div>
              ${s.why && s.why.length ? `<div class="pcWhy">${s.why.map(x=>`<div>• ${escapeHtml(x)}</div>`).join("")}</div>` : ""}
            </div>
          `;
        }).join("")}
      </div>
    `;

    // Insert on top
    container.prepend(card);

    // Wire events
    card.querySelectorAll("button[data-prof]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setProfile(btn.getAttribute("data-prof"));
        renderPcBuildCard(query);
      });
    });
    card.querySelectorAll("button[data-cond]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        setCond(btn.getAttribute("data-cond"));
        renderPcBuildCard(query);
      });
    });

    const copyBtn = card.querySelector("#pcCopySearch");
    const showAllBtn = card.querySelector("#pcShowAll");
    const allBox = card.querySelector(".pcProfilesAll");

    showAllBtn.addEventListener("click", ()=>{
      const shown = allBox.style.display !== "none";
      allBox.style.display = shown ? "none" : "block";
      showAllBtn.textContent = shown ? "📌 3 Profil Göster" : "📌 3 Profili Gizle";
    });

    copyBtn.addEventListener("click", async ()=>{
      const searchLines = [
        (active.cpu ? `${active.cpu} ${getCond()==="secondhand"?"ikinci el":"sıfır"}` : ""),
        (active.gpu ? `${active.gpu} ${getCond()==="secondhand"?"ikinci el":"sıfır"}` : ""),
        (active.mobo ? `${active.mobo} anakart ${getCond()==="secondhand"?"ikinci el":"sıfır"}` : ""),
        (active.ram ? `${active.ram} ram ${getCond()==="secondhand"?"ikinci el":"sıfır"}` : ""),
        (active.psu ? `${active.psu} psu ${getCond()==="secondhand"?"ikinci el":"sıfır"}` : ""),
      ].filter(Boolean).join("\n");
      try {
        await navigator.clipboard.writeText(searchLines);
        toast("Kopyalandı! Sitelerden aratabilirsin ✅", "success");
      } catch(e){
        // fallback
        const ta=document.createElement("textarea");
        ta.value=searchLines;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        toast("Kopyalandı ✅", "success");
      }
    });
  }

  function escapeHtml(str){
    return (str??"").toString()
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  return { renderPcBuildCard };
})();

// Global wrapper used in performSearch hook
function renderPcBuildCard(query){
  PCBUILDER.renderPcBuildCard(query);
}

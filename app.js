// app.js - Basit ve Çalışan Versiyon

// ========== GLOBAL DEĞİŞKENLER ==========
const $ = (id) => document.getElementById(id);

// Sepet
let cartItems = JSON.parse(localStorage.getItem('fiyattakip_cart') || '[]');

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
  
  // Sepet sayfasını göster
  if (key === 'cart') {
    renderCartPage();
  }
  
  // Son aramaları göster
  if (key === 'home') {
    renderRecentSearches();
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
  
  // Mock site listesi göster
  showMockResults(query);
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
  
  sites.forEach(site => {
    const url = `https://${site.name.toLowerCase().replace(' ', '')}.com/ara?q=${encodeURIComponent(query)}`;
    
    html += `
      <div class="siteCard">
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

// ========== FAVORİ ==========
function addFavorite(siteName, query, url) {
  toast("Favorilere eklendi! ❤️", "success");
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
  // Check if already in cart
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
}

function renderCartPage() {
  const cartList = $("cartList");
  const cartSubtotal = $("cartSubtotal");
  const cartTotalPrice = $("cartTotalPrice");
  const cartItemCount = $("cartItemCount");
  
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
  if (cartSubtotal) cartSubtotal.textContent = "₺???";
  if (cartTotalPrice) cartTotalPrice.textContent = "₺???";
  if (cartItemCount) {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartItemCount.textContent = `${totalItems} ürün`;
  }
}

function updateCartCounter() {
  const count = cartItems.length;
  const counter = $("cartCount");
  
  if (counter) {
    counter.textContent = count;
    if (count > 0) {
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
    toast("Kamera özelliği yakında gelecek!", "info");
  });
  
  // Temizleme
  $("btnClearCache")?.addEventListener("click", () => {
    if (confirm("Tüm önbelleği temizlemek istediğinize emin misiniz?")) {
      localStorage.clear();
      cartItems = [];
      updateCartCounter();
      renderRecentSearches();
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
    toast("Arama temizlendi", "info");
  });
  
  // Sepet icon
  $("cartIcon")?.addEventListener("click", () => {
    showPage('cart');
  });
  
  // Logout
  $("logoutBtn")?.addEventListener("click", () => {
    toast("Çıkış yapıldı", "info");
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
  
  console.log("Uygulama hazır!");
});

// GLOBAL FONKSİYONLAR
window.showPage = showPage;
window.performSearch = performSearch;
window.copyToClipboard = copyToClipboard;
window.addToCart = addToCart;
window.addToCartFromSite = addToCartFromSite;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.checkoutCart = checkoutCart;
window.clearRecentSearches = clearRecentSearches;

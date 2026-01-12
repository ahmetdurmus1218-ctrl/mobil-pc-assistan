// app.js - Fiyat Takip Uygulaması (Firebase Hosting entegreli)
import { auth, googleProvider, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "firebase/auth";

import {
  collection, getDocs, doc, setDoc, deleteDoc, getDoc
} from "firebase/firestore";

const $ = (id) => document.getElementById(id);

// ========== API KONFİGÜRASYONU ==========
// GÜNCELLENMİŞ: Render.com'daki API'nizle entegre
const DEFAULT_API_URL = "https://fiyattakip-api.onrender.com";
let API_URL = localStorage.getItem('fiyattakip_api_url') || DEFAULT_API_URL;

// ========== SAYFALAMA AYARLARI ==========
let currentPage = 1;
let currentSort = 'asc';
let currentSearch = '';
let totalPages = 1;
let allProducts = [];

// ========== FAVORİLER ==========
let favCache = [];

// ========== SEPET SİSTEMİ - YENİ ==========
let cartItems = JSON.parse(localStorage.getItem('fiyattakip_cart') || '[]');
let cartTotal = 0;

// ========== TOAST MESAJ ==========
function toast(msg, type = 'info'){
  const t = $("toast");
  if (!t) { console.log(msg); return; }
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.add("hidden"), 2200);
}

// ========== SAYFA GEÇİŞLERİ ==========
function showPage(key){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));

  const page = document.querySelector(`#page-${CSS.escape(key)}`);
  if (page) page.classList.add("active");

  const tab = document.querySelector(`.tab[data-page="${CSS.escape(key)}"]`);
  if (tab) tab.classList.add("active");

  // Sayfa özel işlemler
  if (key === 'favs') renderFavoritesPage(window.currentUser?.uid);
  if (key === 'home') renderRecentSearches();
  if (key === 'cart') renderCartPage(); // SEPET SAYFASI
}

// ========== ARAMA MODU AYARLARI ==========
function setSearchMode(mode){
  localStorage.setItem("searchMode", mode);
  $("modeNormal")?.classList.toggle("active", mode==="normal");
  $("modeFiyat")?.classList.toggle("active", mode==="fiyat");
  $("modeAI")?.classList.toggle("active", mode==="ai");
  const hint = $("modeHint");
  if (hint){
    const hints = {
      "normal": "Link modu: Sadece arama linkleri oluşturur",
      "fiyat": "Fiyat modu: Gerçek fiyatları çeker (Render API)",
      "ai": "AI modu: AI ile optimize edilmiş arama"
    };
    hint.textContent = hints[mode] || "";
  }
}

function getSearchMode(){
  return localStorage.getItem("searchMode") || "normal";
}

// ========== NORMAL ARAMA (Link-only) - İKİNCİ EL SİTELER EKLENDİ ==========
const SITES = [
  // YENİ E-TİCARET
  { key:"trendyol", name:"Trendyol", build:q=>`https://www.trendyol.com/sr?q=${encodeURIComponent(q)}` },
  { key:"hepsiburada", name:"Hepsiburada", build:q=>`https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}` },
  { key:"n11", name:"N11", build:q=>`https://www.n11.com/arama?q=${encodeURIComponent(q)}` },
  { key:"amazontr", name:"Amazon TR", build:q=>`https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}` },
  { key:"pazarama", name:"Pazarama", build:q=>`https://www.pazarama.com/arama?q=${encodeURIComponent(q)}` },
  { key:"ciceksepeti", name:"ÇiçekSepeti", build:q=>`https://www.ciceksepeti.com/arama?query=${encodeURIComponent(q)}` },
  { key:"idefix", name:"idefix", build:q=>`https://www.idefix.com/arama/?q=${encodeURIComponent(q)}` },
  
  // İKİNCİ EL SİTELER - YENİ EKLENDİ
  { key:"sahibinden", name:"Sahibinden", build:q=>`https://www.sahibinden.com/ara?query_text=${encodeURIComponent(q)}` },
  { key:"dolap", name:"Dolap", build:q=>`https://www.dolap.com/ara?q=${encodeURIComponent(q)}` },
  { key:"letgo", name:"Letgo", build:q=>`https://www.letgo.com/tr-tr/k/ara?q=${encodeURIComponent(q)}` },
  { key:"gittigidiyor", name:"GittiGidiyor", build:q=>`https://www.gittigidiyor.com/arama/?k=${encodeURIComponent(q)}` },
  
  // TEKNOLOJİ
  { key:"teknosa", name:"Teknosa", build:q=>`https://www.teknosa.com/arama/?s=${encodeURIComponent(q)}` },
  { key:"mediamarkt", name:"MediaMarkt", build:q=>`https://www.mediamarkt.com.tr/search?query=${encodeURIComponent(q)}` },
  { key:"vatan", name:"Vatan Bilgisayar", build:q=>`https://www.vatanbilgisayar.com/arama/${encodeURIComponent(q)}/` },
];

function renderSiteList(container, query){
  if (!container) return;
  const q = String(query||"").trim();
  if (!q){
    container.innerHTML = `<div class="cardBox"><b>Bir şey yaz.</b></div>`;
    return;
  }

  container.innerHTML = "";
  for (const s of SITES){
    const url = s.build(q);
    const card = document.createElement("div");
    card.className = "cardBox";
    card.innerHTML = `
      <div class="rowLine">
        <div>
          <div class="ttl">${s.name}</div>
          <div class="sub">${q}</div>
        </div>
        <div class="actions">
          <button class="btnPrimary sm btnOpen" type="button">Aç</button>
          <button class="btnGhost sm btnCopy" type="button" data-copy-url="${url}" title="Linki kopyala">⧉</button>
          <button class="btnGhost sm btnFav" type="button" data-fav-url="${url}" data-site-key="${s.key}" data-site-name="${s.name}" data-query="${q}">🤍</button>
          <button class="btnGhost sm btnCart" type="button" data-cart-url="${url}" data-site-key="${s.key}" data-site-name="${s.name}" data-query="${q}">🛒</button>
        </div>
      </div>
    `;
    card.querySelector(".btnOpen")?.addEventListener("click", ()=> {
      window.open(url, "_blank", "noopener");
    });
    card.querySelector(".btnFav")?.addEventListener("click", async ()=>{
      if (!window.currentUser) return openLogin();
      await toggleFavorite(window.currentUser.uid, { url, siteKey: s.key, siteName: s.name, query: q });
    });
    card.querySelector(".btnCart")?.addEventListener("click", ()=>{
      addToCart({
        title: q,
        price: "Fiyat bilgisi yok",
        site: s.name,
        link: url
      });
    });
    container.appendChild(card);
  }
  applyFavUI();
  updateCartButtonStates();
}

// ========== FIYAT ARAMA (Render API) ==========
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

  // Son aramaya kaydet
  saveRecentSearch(query);

  try {
    toast("Fiyatlar çekiliyor...", "info");
    
    const response = await fetch(`${API_URL}/fiyat-cek`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        urun: query,
        page: page,
        sort: sort
      })
    });

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      // Global değişkenlere kaydet
      currentPage = data.sayfa || 1;
      currentSort = data.siralama || 'asc';
      currentSearch = query;
      totalPages = data.toplamSayfa || 1;
      allProducts = data.fiyatlar || [];
      
      renderFiyatSonuclari(data);
      updatePaginationControls();
      updateSortControls();
      
      toast(`${data.toplamUrun || 0} ürün bulundu (Sayfa ${currentPage}/${totalPages})`, "success");
    } else {
      throw new Error(data.error || "Fiyat çekilemedi");
    }
    
  } catch (error) {
    console.error("Fiyat arama hatası:", error);
    container.innerHTML = `
      <div class="errorState">
        <div class="errorIcon">😕</div>
        <h3>Fiyat çekilemedi</h3>
        <p>${error.message}</p>
        <button onclick="showPage('home')" class="btnPrimary">Ana Sayfaya Dön</button>
      </div>
    `;
  }
}

// ========== SEPET SİSTEMİ FONKSİYONLARI - YENİ ==========
function addToCart(product) {
  console.log("🛒 Sepete ekleniyor:", product);
  
  // Aynı ürün kontrolü
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

function removeFromCart(itemId) {
  cartItems = cartItems.filter(item => item.id !== itemId);
  localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  updateCartCounter();
  updateCartButtonStates();
  renderCartPage();
  toast("Ürün sepetten çıkarıldı", "info");
}

function updateCartCounter() {
  const count = cartItems.length;
  const counter = $("cartCount");
  
  if (counter) {
    counter.textContent = count;
    counter.style.display = count > 0 ? 'flex' : 'none';
  }
  
  // Toplam fiyatı hesapla
  cartTotal = cartItems.reduce((total, item) => {
    const priceStr = item.price.replace('₺', '').replace('TL', '').replace('.', '').replace(',', '.').trim();
    const price = parseFloat(priceStr) || 0;
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
      btn.disabled = false;
    } else {
      btn.innerHTML = '🛒';
      btn.classList.remove('inCart');
      btn.disabled = false;
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
  
  const itemsText = cartItems.map(item => 
    `${item.quantity}x ${item.title.substring(0,30)} - ${item.price}`
  ).join('\n');
  
  const message = `
🛍️ **Sipariş Özeti**
    
${itemsText}
    
💰 **Toplam: ₺${cartTotal.toFixed(2).replace('.', ',')}**
    
Siparişiniz alınmıştır. En kısa sürede satıcılarla iletişime geçebilirsiniz.
  `.trim();
  
  toast("Sipariş oluşturuldu! Toplam: ₺" + cartTotal.toFixed(2).replace('.', ','), "success");
  
  // Sepeti temizle (isteğe bağlı)
  // cartItems = [];
  // localStorage.setItem('fiyattakip_cart', JSON.stringify(cartItems));
  // updateCartCounter();
  // renderCartPage();
}

// ========== SEPET BUTONLARINI EKLE ==========
function addCartButtons() {
  console.log("🛒 Sepet butonları ekleniyor...");
  
  // En ucuz banner'a ekle
  document.querySelectorAll('.cheapestBanner').forEach(banner => {
    const actions = banner.querySelector('.productActions');
    if (!actions || actions.querySelector('.btnCart')) return;
    
    const title = banner.querySelector('.productTitle')?.textContent || '';
    const price = banner.querySelector('.productPrice')?.textContent || '';
    const site = banner.querySelector('.siteTag')?.textContent || '';
    
    let link = '';
    const openBtn = banner.querySelector('.btnPrimary[onclick]');
    if (openBtn) {
      const onclickAttr = openBtn.getAttribute('onclick');
      if (onclickAttr) {
        const match = onclickAttr.match(/window\.open\('([^']+)'/);
        if (match) link = match[1];
      }
    }
    
    if (!link) return;
    
    const cartBtn = document.createElement('button');
    cartBtn.className = 'btnCart btnGhost sm';
    cartBtn.innerHTML = '🛒';
    cartBtn.title = 'Sepete ekle';
    cartBtn.setAttribute('data-cart-url', link);
    
    cartBtn.onclick = function(e) {
      e.stopPropagation();
      const product = {
        title: title,
        price: price,
        site: site,
        link: link
      };
      addToCart(product);
    };
    
    actions.appendChild(cartBtn);
  });
  
  // Ürün kartlarına ekle
  document.querySelectorAll('.productCard').forEach(card => {
    const actions = card.querySelector('.productActions');
    if (!actions || actions.querySelector('.btnCart')) return;
    
    const title = card.querySelector('.productName')?.textContent || '';
    const price = card.querySelector('.productPrice')?.textContent || '';
    const site = card.querySelector('.productSite')?.textContent || '';
    
    let link = '';
    const openBtns = card.querySelectorAll('.btnGhost[onclick]');
    for (const btn of openBtns) {
      const onclickAttr = btn.getAttribute('onclick');
      if (onclickAttr && onclickAttr.includes('window.open')) {
        const match = onclickAttr.match(/window\.open\('([^']+)'/);
        if (match) {
          link = match[1];
          break;
        }
      }
    }
    
    if (!link) return;
    
    const cartBtn = document.createElement('button');
    cartBtn.className = 'btnCart btnGhost xs';
    cartBtn.innerHTML = '🛒';
    cartBtn.title = 'Sepete ekle';
    cartBtn.setAttribute('data-cart-url', link);
    
    cartBtn.onclick = function(e) {
      e.stopPropagation();
      const product = {
        title: title,
        price: price,
        site: site,
        link: link
      };
      addToCart(product);
    };
    
    actions.appendChild(cartBtn);
  });
  
  updateCartButtonStates();
}

// ========== ARAYÜZE SEPET İKONU EKLE ==========
function addCartToUI() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;
  
  if (document.getElementById('cartIcon')) return;
  
  const cartIcon = document.createElement('button');
  cartIcon.id = 'cartIcon';
  cartIcon.className = 'iconBtn';
  cartIcon.innerHTML = `
    🛒
    <span id="cartCount" class="cartBadge">0</span>
  `;
  cartIcon.style.position = 'relative';
  cartIcon.onclick = () => {
    showPage('cart');
    renderCartPage();
  };
  
  const bellBtn = document.getElementById('btnBell');
  if (bellBtn) {
    topbar.insertBefore(cartIcon, bellBtn);
  } else {
    topbar.appendChild(cartIcon);
  }
  
  updateCartCounter();
}

// ========== FİYAT SONUÇLARINI GÖSTER (Sepet butonlu) ==========
function renderFiyatSonuclari(data) {
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

  let html = '';
  
  // Sıralama bilgisi
  html += `
    <div class="sortInfo">
      <span>Sıralama: ${currentSort === 'asc' ? '🏷️ En Düşük Fiyat' : '🏷️ En Yüksek Fiyat'}</span>
      <span>Sayfa: ${currentPage}/${totalPages}</span>
    </div>
  `;
  
  // En ucuz ürün banner'ı
  if (data.fiyatlar.length > 0) {
    const cheapest = data.fiyatlar[0];
    html += `
      <div class="cheapestBanner">
        <div class="bannerHeader">
          <span class="badge">🥇 EN UCUZ</span>
          <span class="siteTag">${cheapest.site}</span>
        </div>
        <div class="productInfo">
          <div class="productTitle">${cheapest.urun}</div>
          <div class="productPrice">${cheapest.fiyat}</div>
          <div class="productActions">
            <button class="btnPrimary sm" onclick="window.open('${cheapest.link}', '_blank')">Ürüne Git</button>
            <button class="btnGhost sm" onclick="copyToClipboard('${cheapest.link}')">⧉ Kopyala</button>
            <button class="btnFav isFav" data-fav-url="${cheapest.link}" 
                    data-site-key="${cheapest.site.toLowerCase()}" 
                    data-site-name="${cheapest.site}" 
                    data-query="${data.query}">❤️</button>
            <button class="btnCart btnGhost sm" data-cart-url="${cheapest.link}">🛒</button>
          </div>
        </div>
      </div>
    `;
  }

  // Diğer ürünler
  html += '<div class="productList">';
  
  data.fiyatlar.forEach((product, index) => {
    if (index === 0) return;
    if (index >= 4) return;
    
    html += `
      <div class="productCard">
        <div class="productRow">
          <div class="productSite">${product.site}</div>
          <div class="productName">${product.urun}</div>
          <div class="productPriceRow">
            <span class="productPrice">${product.fiyat}</span>
            <div class="productActions">
              <button class="btnGhost xs" onclick="window.open('${product.link}', '_blank')">Aç</button>
              <button class="btnGhost xs" onclick="copyToClipboard('${product.link}')">⧉</button>
              <button class="btnGhost xs btnFav" 
                      data-fav-url="${product.link}" 
                      data-site-key="${product.site.toLowerCase()}" 
                      data-site-name="${product.site}" 
                      data-query="${data.query}">🤍</button>
              <button class="btnCart btnGhost xs" data-cart-url="${product.link}">🛒</button>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
  
  applyFavUI();
  updateCartButtonStates();
}

// ... Diğer fonksiyonlar (favori, auth vb.) aynı kalacak ...
// Sadece wireUI fonksiyonuna sepet eklemelerini yapın:

function wireUI(){
  // ... mevcut kodlarınız ...
  
  // Sepet sistemini başlat
  setTimeout(() => {
    addCartToUI();
    addCartButtons();
  }, 1000);
  
  // Sürekli sepet butonlarını kontrol et
  setInterval(() => {
    addCartButtons();
  }, 2000);
  
  // Arama yapıldığında sepet butonları ekle
  if (window.fiyatAra) {
    const originalFiyatAra = window.fiyatAra;
    window.fiyatAra = function(...args) {
      const result = originalFiyatAra.apply(this, args);
      setTimeout(() => {
        addCartButtons();
      }, 1500);
      return result;
    };
  }
  
  // ... diğer kodlarınız ...
}

// ========== GLOBAL FONKSİYONLAR ==========
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.checkoutCart = checkoutCart;
// ... diğer global fonksiyonlar ...

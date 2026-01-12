// app.js - Fiyat Takip Uygulaması (Firebase Hosting + İkinci El + Sepet)
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

// ========== SEPET SİSTEMİ ==========
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

  if (key === 'favs') renderFavoritesPage(window.currentUser?.uid);
  if (key === 'home') renderRecentSearches();
  if (key === 'cart') renderCartPage();
  if (key === 'search') {
    const query = $("qNormal")?.value;
    if (query && getSearchMode() !== 'fiyat') {
      renderSiteList($("normalList"), query);
    }
  }
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

// ========== NORMAL ARAMA (İkinci El Siteler Dahil) ==========
const SITES = [
  // YENİ E-TİCARET
  { key:"trendyol", name:"Trendyol", build:q=>`https://www.trendyol.com/sr?q=${encodeURIComponent(q)}` },
  { key:"hepsiburada", name:"Hepsiburada", build:q=>`https://www.hepsiburada.com/ara?q=${encodeURIComponent(q)}` },
  { key:"n11", name:"N11", build:q=>`https://www.n11.com/arama?q=${encodeURIComponent(q)}` },
  { key:"amazontr", name:"Amazon TR", build:q=>`https://www.amazon.com.tr/s?k=${encodeURIComponent(q)}` },
  { key:"pazarama", name:"Pazarama", build:q=>`https://www.pazarama.com/arama?q=${encodeURIComponent(q)}` },
  { key:"ciceksepeti", name:"ÇiçekSepeti", build:q=>`https://www.ciceksepeti.com/arama?query=${encodeURIComponent(q)}` },
  { key:"idefix", name:"idefix", build:q=>`https://www.idefix.com/arama/?q=${encodeURIComponent(q)}` },
  
  // İKİNCİ EL SİTELER
  { key:"sahibinden", name:"Sahibinden", build:q=>`https://www.sahibinden.com/ara?query_text=${encodeURIComponent(q)}` },
  { key:"dolap", name:"Dolap", build:q=>`https://www.dolap.com/ara?q=${encodeURIComponent(q)}` },
  { key:"letgo", name:"Letgo", build:q=>`https://www.letgo.com/tr-tr/k/ara?q=${encodeURIComponent(q)}` },
  { key:"gittigidiyor", name:"GittiGidiyor", build:q=>`https://www.gittigidiyor.com/arama/?k=${encodeURIComponent(q)}` },
  
  // TEKNOLOJİ
  { key:"teknosa", name:"Teknosa", build:q=>`https://www.teknosa.com/arama/?s=${encodeURIComponent(q)}` },
  { key:"mediamarkt", name:"MediaMarkt", build:q=>`https://www.mediamarkt.com.tr/search?query=${encodeURIComponent(q)}` },
  { key:"vatan", name:"Vatan Bilgisayar", build:q=>`https://www.vatanbilgisayar.com/arama/${encodeURIComponent(q)}/` },
  
  // DİĞER
  { key:"pttavm", name:"PTT AVm", build:q=>`https://www.pttavm.com/arama?q=${encodeURIComponent(q)}` },
  { key:"teknobiyotik", name:"Teknobiyotik", build:q=>`https://www.teknobiyotik.com/search?text=${encodeURIComponent(q)}` },
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

  saveRecentSearch(query);

  try {
    toast("Fiyatlar çekiliyor...", "info");
    
    const response = await fetch(`${API_URL}/fiyat-cek`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        urun: query,
        page: page,
        sort: sort
      })
    });

    if (!response.ok) throw new Error(`API hatası: ${response.status}`);

    const data = await response.json();
    
    if (data.success) {
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
  
  const message = `
🛍️ **Sipariş Özeti**
    
${cartItems.map(item => `${item.quantity}x ${item.title.substring(0,30)} - ${item.price}`).join('\n')}
    
💰 **Toplam: ₺${cartTotal.toFixed(2).replace('.', ',')}**
    
Siparişiniz alınmıştır. En kısa sürede satıcılarla iletişime geçebilirsiniz.
  `.trim();
  
  toast("Sipariş oluşturuldu! Toplam: ₺" + cartTotal.toFixed(2).replace('.', ','), "success");
}

function addCartButtons() {
  // En ucuz banner
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
      addToCart({
        title: title,
        price: price,
        site: site,
        link: link
      });
    };
    
    actions.appendChild(cartBtn);
  });
  
  // Ürün kartları
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
      addToCart({
        title: title,
        price: price,
        site: site,
        link: link
      });
    };
    
    actions.appendChild(cartBtn);
  });
  
  updateCartButtonStates();
}

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

// ========== FIYAT SONUÇLARINI GÖSTER ==========
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
  
  html += `
    <div class="sortInfo">
      <span>Sıralama: ${currentSort === 'asc' ? '🏷️ En Düşük Fiyat' : '🏷️ En Yüksek Fiyat'}</span>
      <span>Sayfa: ${currentPage}/${totalPages}</span>
    </div>
  `;
  
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

// ========== SAYFALAMA KONTROLLERİ ==========
function updatePaginationControls() {
  const container = $("normalList");
  if (!container || totalPages <= 1) return;
  
  let paginationHTML = `
    <div class="pagination">
      <button class="pageBtn ${currentPage === 1 ? 'disabled' : ''}" 
              onclick="changePage(${currentPage - 1})" 
              ${currentPage === 1 ? 'disabled' : ''}>
        ⬅️ Önceki
      </button>
      
      <span class="pageInfo">Sayfa ${currentPage} / ${totalPages}</span>
      
      <button class="pageBtn ${currentPage >= totalPages ? 'disabled' : ''}" 
              onclick="changePage(${currentPage + 1})" 
              ${currentPage >= totalPages ? 'disabled' : ''}>
        Sonraki ➡️
      </button>
    </div>
  `;
  
  const existingPagination = container.querySelector('.pagination');
  if (existingPagination) existingPagination.remove();
  container.insertAdjacentHTML('beforeend', paginationHTML);
}

// ========== SIRALAMA KONTROLLERİ ==========
function updateSortControls() {
  const container = $("normalList");
  if (!container) return;
  
  let sortHTML = `
    <div class="sortControls">
      <button class="sortBtn ${currentSort === 'asc' ? 'active' : ''}" 
              onclick="changeSort('asc')">
        ⬆️ En Düşük Fiyat
      </button>
      <button class="sortBtn ${currentSort === 'desc' ? 'active' : ''}" 
              onclick="changeSort('desc')">
        ⬇️ En Yüksek Fiyat
      </button>
    </div>
  `;
  
  const existingSort = container.querySelector('.sortControls');
  if (existingSort) existingSort.remove();
  container.insertAdjacentHTML('afterbegin', sortHTML);
}

// ========== SAYFA DEĞİŞTİRME ==========
function changePage(newPage) {
  if (newPage < 1 || newPage > totalPages) return;
  fiyatAra(currentSearch, newPage, currentSort);
}

// ========== SIRALAMA DEĞİŞTİRME ==========
function changeSort(newSort) {
  if (newSort === currentSort) return;
  fiyatAra(currentSearch, 1, newSort);
}

// ========== KAMERA AI ARAMA ==========
async function cameraAiSearch() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    const modal = document.createElement('div');
    modal.className = 'cameraModal';
    modal.innerHTML = `
      <div class="cameraContainer">
        <div class="cameraHeader">
          <h3>📸 Ürün Fotoğrafı Çek</h3>
          <button class="closeCamera">✕</button>
        </div>
        <video id="cameraVideo" autoplay playsinline></video>
        <div class="cameraControls">
          <button class="btnPrimary" id="captureBtn">📷 Çek</button>
          <button class="btnGhost" id="cancelBtn">İptal</button>
        </div>
        <canvas id="cameraCanvas" style="display:none;"></canvas>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const video = modal.querySelector('#cameraVideo');
    video.srcObject = stream;
    
    modal.querySelector('.closeCamera').onclick = 
    modal.querySelector('#cancelBtn').onclick = () => {
      stream.getTracks().forEach(track => track.stop());
      modal.remove();
    };
    
    modal.querySelector('#captureBtn').onclick = async () => {
      const canvas = modal.querySelector('#cameraCanvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      
      stream.getTracks().forEach(track => track.stop());
      modal.remove();
      
      toast("Görsel AI ile analiz ediliyor...", "info");
      
      try {
        const response = await fetch(`${API_URL}/kamera-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: imageData.split(',')[1],
            mime: 'image/jpeg'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            fiyatAra(data.urunTahmini || data.tespitEdilen || 'telefon');
          }
        }
      } catch (error) {
        console.error("Kamera AI hatası:", error);
        toast("AI analiz başarısız, normal arama yapılıyor", "warning");
        fiyatAra('telefon');
      }
    };
    
  } catch (error) {
    console.error("Kamera hatası:", error);
    toast("Kamera erişimi reddedildi", "error");
  }
}

// ========== FAVORİ İŞLEMLERİ ==========
function favIdFromUrl(url){
  try{
    const u = new URL(url);
    const key = (u.hostname + u.pathname + u.search).toLowerCase();
    let h=0; for (let i=0;i<key.length;i++){ h=((h<<5)-h)+key.charCodeAt(i); h|=0; }
    return "fav_" + Math.abs(h);
  }catch{
    return "fav_" + Math.random().toString(36).slice(2);
  }
}

const FAV_COLL = (uid)=> collection(db, "users", uid, "favorites");

async function loadFavorites(uid){
  if (!uid){ favCache=[]; return favCache; }
  try {
    const snap = await getDocs(FAV_COLL(uid));
    favCache = snap.docs.map(d=>({ id:d.id, ...d.data() }));
  } catch(e) {
    console.error("Favori yükleme hatası:", e);
    favCache = [];
  }
  return favCache;
}

function isFav(url){
  const id = favIdFromUrl(url);
  return favCache.some(f=>f.id===id);
}

async function toggleFavorite(uid, fav){
  if (!uid) { openLogin(); return; }
  
  const id = favIdFromUrl(fav.url);
  const ref = doc(db, "users", uid, "favorites", id);
  
  if (favCache.some(f=>f.id===id)){
    await deleteDoc(ref);
    toast("Favoriden çıkarıldı", 'info');
  } else {
    await setDoc(ref, {
      ...fav,
      createdAt: Date.now(),
    }, { merge:true });
    toast("Favorilere eklendi", 'success');
  }
  await loadFavorites(uid);
  applyFavUI();
}

function applyFavUI(){
  document.querySelectorAll("[data-fav-url]").forEach(btn=>{
    const url = btn.getAttribute("data-fav-url") || "";
    const fav = isFav(url);
    btn.classList.toggle("isFav", fav);
    btn.innerHTML = fav ? "❤️" : "🤍";
    btn.title = fav ? "Favoride" : "Favoriye ekle";
  });
}

function renderFavoritesPage(uid){
  const list = $("favList");
  if (!list) return;
  list.innerHTML = "";
  
  if (!favCache.length){
    list.innerHTML = `<div class="emptyState">Favori yok.</div>`;
    return;
  }
  
  const pageSize = 4;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedFavs = favCache.slice(startIndex, endIndex);
  const favTotalPages = Math.ceil(favCache.length / pageSize);
  
  let paginationHTML = '';
  if (favTotalPages > 1) {
    paginationHTML = `
      <div class="favPagination">
        <button class="pageBtn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changeFavPage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
          ⬅️
        </button>
        <span class="pageInfo">${currentPage}/${favTotalPages}</span>
        <button class="pageBtn ${currentPage >= favTotalPages ? 'disabled' : ''}" 
                onclick="changeFavPage(${currentPage + 1})" 
                ${currentPage >= favTotalPages ? 'disabled' : ''}>
          ➡️
        </button>
      </div>
    `;
  }
  
  list.innerHTML = paginationHTML;
  
  for (const fav of pagedFavs){
    const card = document.createElement("div");
    card.className = "cardBox favoriteCard";
    card.innerHTML = `
      <div class="favoriteHeader">
        <div class="favoriteInfo">
          <div class="favSite">${fav.siteName || "Favori"}</div>
          <div class="favQuery">${fav.query || fav.urun || ""}</div>
          ${fav.fiyat ? `<div class="favPrice">${fav.fiyat}</div>` : ''}
        </div>
        <div class="favoriteActions">
          <button class="btnGhost sm" onclick="window.open('${fav.url||""}', '_blank')">Aç</button>
          <button class="btnGhost sm btnAiComment" data-fav-id="${fav.id}">🤖 AI</button>
          <button class="btnGhost sm btnFav isFav" data-fav-url="${fav.url||""}">❤️</button>
          <button class="btnGhost sm btnCart" data-cart-url="${fav.url||""}">🛒</button>
        </div>
      </div>
    `;
    
    card.querySelector('.btnAiComment').addEventListener('click', async (event) => {
      const button = event.target;
      const originalText = button.textContent;
      
      button.disabled = true;
      button.textContent = '🤖...';
      button.style.opacity = '0.7';
      
      const originalQuery = fav.query || fav.title || fav.urun || "";
      
      toast(`🤖 "${originalQuery}" için AI analiz yapılıyor...`, "info");
      
      try {
        const aiYorum = await getAiYorumSafe({
          title: fav.title || fav.urun || originalQuery,
          price: fav.fiyat || "Fiyat bilgisi yok",
          site: fav.siteName || "Bilinmeyen site",
          originalQuery: originalQuery
        });
        
        const modal = document.createElement('div');
        modal.className = 'aiModal';
        modal.innerHTML = `
          <div class="aiModalContent">
            <div class="aiModalHeader">
              <h3>🤖 AI Analizi</h3>
              <button class="closeAiModal">✕</button>
            </div>
            <div class="aiModalBody">
              <div class="aiProduct">
                <strong>${originalQuery}</strong>
                <small>${fav.siteName || "Bilinmeyen site"}</small>
                ${fav.fiyat ? `<div class="favPrice" style="margin-top:8px;color:#36d399;">${fav.fiyat}</div>` : ''}
              </div>
              <div class="aiComment">
                ${aiYorum.replace(/\n/g, '<br>')}
              </div>
            </div>
            <div class="aiModalFooter">
              <button class="btnPrimary closeModalBtn">Tamam</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeModal = () => modal.remove();
        modal.querySelector('.closeAiModal').onclick = closeModal;
        modal.querySelector('.closeModalBtn').onclick = closeModal;
        modal.onclick = (e) => {
          if (e.target === modal) closeModal();
        };
        
      } catch (error) {
        console.error("AI yorum hatası:", error);
        toast("AI servisi geçici olarak kullanılamıyor", "error");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
        button.style.opacity = '1';
      }
    });
    
    card.querySelector('.btnFav').addEventListener('click', async () => {
      await toggleFavorite(uid, { url: fav.url, siteKey: fav.siteKey, siteName: fav.siteName, query: fav.query });
      renderFavoritesPage(uid);
    });
    
    card.querySelector('.btnCart').addEventListener('click', () => {
      addToCart({
        title: fav.query || fav.urun || "",
        price: fav.fiyat || "₺???",
        site: fav.siteName || "",
        link: fav.url || ""
      });
    });
    
    list.appendChild(card);
  }
  
  if (favTotalPages > 1) {
    list.insertAdjacentHTML('beforeend', paginationHTML);
  }
  
  applyFavUI();
  updateCartButtonStates();
}

function changeFavPage(newPage) {
  if (newPage < 1) return;
  const pageSize = 4;
  const totalPages = Math.ceil(favCache.length / pageSize);
  if (newPage > totalPages) return;
  
  currentPage = newPage;
  renderFavoritesPage(window.currentUser?.uid);
}

function addCameraButton() {
  const tabbar = document.querySelector('.tabbar');
  if (!tabbar) return;
  
  const tabs = tabbar.querySelectorAll('.tab');
  if (tabs.length < 4) return;
  
  const cameraBtn = document.createElement('button');
  cameraBtn.className = 'cameraTab';
  cameraBtn.innerHTML = `
    <span class="ico">📸</span>
    <span class="lbl">Kamera</span>
  `;
  cameraBtn.onclick = cameraAiSearch;
  
  const spacer = tabbar.querySelector('.tabSpacer');
  if (spacer) {
    spacer.replaceWith(cameraBtn);
  } else {
    const newSpacer = document.createElement('div');
    newSpacer.className = 'tabSpacer';
    tabbar.insertBefore(cameraBtn, tabs[2]);
  }
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
    html += `
      <div class="recentItem" onclick="handleRecentSearch('${query}')">
        <span>🔍</span>
        <span>${query}</span>
        <button class="recentRemove" onclick="event.stopPropagation(); removeRecentSearch('${query}')">✕</button>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function handleRecentSearch(query) {
  document.getElementById('qNormal').value = query;
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

// ========== AUTH İŞLEMLERİ ==========
window.currentUser = null;

function setAuthPane(mode){
  const loginPane = $("loginPane");
  const registerPane = $("registerPane");
  const tL = $("tabLogin");
  const tR = $("tabRegister");
  if (!loginPane || !registerPane) return;
  const isReg = mode === "register";
  loginPane.classList.toggle("hidden", isReg);
  registerPane.classList.toggle("hidden", !isReg);
  tL?.classList.toggle("isActive", !isReg);
  tR?.classList.toggle("isActive", isReg);
}

function openLogin(){
  setAuthPane('login');
  const m = $("loginModal");
  if (!m) return;
  m.classList.add("show");
  m.setAttribute("aria-hidden","false");
  document.body.classList.add("modalOpen");
}

function closeLogin(){
  const m = $("loginModal");
  if (!m) return;
  m.classList.remove("show");
  m.setAttribute("aria-hidden","true");
  document.body.classList.remove("modalOpen");
}

async function doEmailLogin(isRegister){
  const btnL = $("btnLogin");
  const btnR = $("btnRegister");
  if (btnL) btnL.disabled = true;
  if (btnR) btnR.disabled = true;

  const email = (isRegister ? ($("regEmail")?.value || "") : ($("loginEmail")?.value || "")).trim();
  const pass  = (isRegister ? ($("regPass")?.value || "") : ($("loginPass")?.value || ""));
  const pass2 = (isRegister ? ($("regPass2")?.value || "") : "");

  if (!email || !pass){
    if (btnL) btnL.disabled = false;
    if (btnR) btnR.disabled = false;
    return toast("E-posta ve şifre gir.", "error");
  }
  
  if (isRegister){
    if (pass.length < 6){
      if (btnL) btnL.disabled = false;
      if (btnR) btnR.disabled = false;
      return toast("Şifre en az 6 karakter olmalı.", "error");
    }
    if (!pass2 || pass !== pass2){
      if (btnL) btnL.disabled = false;
      if (btnR) btnR.disabled = false;
      return toast("Şifreler uyuşmuyor.", "error");
    }
  }

  toast(isRegister ? "Kayıt deneniyor..." : "Giriş deneniyor...", "info");

  try{
    if (isRegister){
      await createUserWithEmailAndPassword(auth, email, pass);
      toast("Kayıt tamam. Giriş yapıldı.", "success");
      setAuthPane("login");
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
      toast("Giriş başarılı.", "success");
    }
  }catch(e){
    console.error(e);
    const code = String(e?.code || "");
    const msg = String(e?.message || e || "");
    if (code.includes("auth/email-already-in-use")) return toast("Bu e-posta zaten kayıtlı. Giriş yap.", "error");
    if (code.includes("auth/weak-password")) return toast("Şifre çok zayıf (en az 6 karakter).", "error");
    if (code.includes("auth/invalid-email")) return toast("E-posta formatı hatalı.", "error");
    toast("Hata: " + msg.replace(/^Firebase:\s*/,""), "error");
  }finally{
    if (btnL) btnL.disabled = false;
    if (btnR) btnR.disabled = false;
  }
}

async function doGoogleLogin(){
  try{
    await signInWithPopup(auth, googleProvider);
  }catch(e){
    try{
      await signInWithRedirect(auth, googleProvider);
    }catch(e2){
      const msg = String(e2?.message || e?.message || e2 || e || "");
      if (msg.includes("auth/unauthorized-domain")){
        toast("Google giriş için domain yetkisi yok. Firebase > Authentication > Settings > Authorized domains içine siteni ekle (örn: fiyattakip.github.io).", "error");
        return;
      }
      toast("Google giriş hatası: " + msg.replace(/^Firebase:\s*/,""), "error");
    }
  }
}

// ========== MODAL İŞLEMLERİ ==========
function openAIModal(){
  const m = $("aiModal");
  if(!m) return;
  m.classList.add("show");
  m.setAttribute("aria-hidden","false");
  loadAISettings();
}

function closeAIModal(){
  const m = $("aiModal");
  if(!m) return;
  m.classList.remove("show");
  m.setAttribute("aria-hidden","true");
}

function openAPIModal(){
  const m = $("apiModal");
  if(!m) return;
  m.classList.add("show");
  m.setAttribute("aria-hidden","false");
  $("apiUrl").value = API_URL;
  checkAPIStatus();
}

function closeAPIModal(){
  const m = $("apiModal");
  if(!m) return;
  m.classList.remove("show");
  m.setAttribute("aria-hidden","true");
}

async function checkAPIStatus() {
  const statusElement = $("apiStatus");
  if (!statusElement) return;
  
  try {
    statusElement.textContent = "Bağlanıyor...";
    statusElement.className = "apiStatus checking";
    
    const response = await fetch(API_URL.replace('/api/fiyat-cek', '/health'), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      statusElement.textContent = "Çalışıyor";
      statusElement.className = "apiStatus online";
    } else {
      statusElement.textContent = "Hata";
      statusElement.className = "apiStatus error";
    }
  } catch (error) {
    statusElement.textContent = "Bağlantı yok";
    statusElement.className = "apiStatus offline";
  }
}

function saveAPISettings() {
  const url = $("apiUrl")?.value?.trim() || DEFAULT_API_URL;
  API_URL = url;
  localStorage.setItem('fiyattakip_api_url', url);
  toast("API URL kaydedildi", "success");
  closeAPIModal();
}

// ========== AI AYARLARI ==========
function loadAISettings(){
  try{
    const s=JSON.parse(localStorage.getItem("aiSettings")||"{}");
    $("aiEnabled") && ($("aiEnabled").value = s.enabled || "on");
    $("aiProvider") && ($("aiProvider").value = s.provider || "gemini");
    $("aiApiKey") && ($("aiApiKey").value = s.key || "");
  }catch(e){}
}

function saveAISettings(){
  const s={
    enabled: $("aiEnabled")?.value || "on",
    provider: $("aiProvider")?.value || "gemini",
    key: $("aiApiKey")?.value || ""
  };
  localStorage.setItem("aiSettings", JSON.stringify(s));
  toast("AI ayarları kaydedildi", "success");
  closeAIModal();
}

// ========== GÜVENLİ AI YORUM FONKSİYONU ==========
async function getAiYorumSafe(payload) {
  const API_BASE = "https://fiyattakip-api.onrender.com";
  
  const requestBody = {
    title: payload.title,
    price: payload.price,
    site: payload.site,
    originalQuery: payload.originalQuery
  };

  try {
    const response = await fetch(`${API_BASE}/ai/yorum`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) throw new Error(`API Hatası: ${response.status}`);

    const data = await response.json();
    
    if (data.success) {
      return data.yorum || `${payload.originalQuery || payload.title} için AI değerlendirmesi mevcut.`;
    } else {
      throw new Error(data.error || "AI yorumu alınamadı");
    }
    
  } catch (error) {
    return `
🤖 ${payload.originalQuery || payload.title} ürünü ${payload.site || "pazar yerinde"} incelendi.
${payload.price ? `💰 Fiyat: ${payload.price}` : "💵 Fiyat bilgisi mevcut değil"}
⭐ AI Analizi: Ürün teknik özellikleri ve kullanıcı deneyimleri ışığında değerlendirilebilir.
    `.trim();
  }
}

// ========== UYGULAMA BAŞLATMA ==========
function wireUI(){
  // Modal butonları
  $("btnAiSettings")?.addEventListener("click", openAIModal);
  $("btnApiSettings")?.addEventListener("click", openAPIModal);
  $("closeAi")?.addEventListener("click", closeAIModal);
  $("closeApi")?.addEventListener("click", closeAPIModal);
  $("aiBackdrop")?.addEventListener("click", closeAIModal);
  $("apiBackdrop")?.addEventListener("click", closeAPIModal);
  $("btnSaveAI")?.addEventListener("click", saveAISettings);
  $("btnSaveApi")?.addEventListener("click", saveAPISettings);
  $("btnTestApi")?.addEventListener("click", checkAPIStatus);

  // Temizleme butonları
  $("btnClearCache")?.addEventListener("click", clearAppCache);
  $("btnClearSearch")?.addEventListener("click", () => {
    $("normalList").innerHTML = "";
    toast("Arama temizlendi", "info");
  });

  // Login/Register
  $("tabLogin")?.addEventListener("click", ()=>setAuthPane("login"));
  $("tabRegister")?.addEventListener("click", ()=>setAuthPane("register"));
  $("btnLogin")?.addEventListener("click", ()=>doEmailLogin(false));
  $("btnRegister")?.addEventListener("click", ()=>doEmailLogin(true));
  $("btnGoogleLogin")?.addEventListener("click", ()=>doGoogleLogin());
  $("btnGoogleLogin2")?.addEventListener("click", ()=>doGoogleLogin());

  // Arama modu
  $("modeNormal")?.addEventListener("click", ()=> setSearchMode("normal"));
  $("modeFiyat")?.addEventListener("click", ()=> setSearchMode("fiyat"));
  $("modeAI")?.addEventListener("click", ()=> setSearchMode("ai"));
  setSearchMode(getSearchMode());

  // Ana arama butonu
  $("btnNormal")?.addEventListener("click", async ()=>{
    const query = ($("qNormal")?.value || "").trim();
    if (!query) return toast("Ürün adı girin", "error");
    
    const mode = getSearchMode();
    
    if (mode === "fiyat") {
      await fiyatAra(query);
    } else if (mode === "ai") {
      toast("AI ile optimize ediliyor...", "info");
      await fiyatAra(query);
    } else {
      showPage("search");
      renderSiteList($("normalList"), query);
    }
  });

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

  // Enter tuşu ile arama
  $("qNormal")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      $("btnNormal").click();
    }
  });

  // Copy butonları
  document.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.("[data-copy-url]");
    if (!btn) return;
    const url = btn.getAttribute("data-copy-url") || "";
    if (url) await copyToClipboard(url);
  });

  // Tab butonları
  document.querySelectorAll(".tab[data-page]").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });

  // Logout
  $("logoutBtn")?.addEventListener("click", async () => {
    try {
      await signOut(auth);
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

  // Graph yenileme
  $("btnGraphRefresh")?.addEventListener("click", () => {
    toast("Grafik yenileniyor...", "info");
  });

  // Sepet sistemi
  setTimeout(() => {
    addCartToUI();
    addCartButtons();
  }, 1000);
  
  setInterval(() => {
    addCartButtons();
  }, 2000);
  
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
}

function setAuthedUI(isAuthed){
  if (!isAuthed) {
    openLogin();
  } else {
    closeLogin();
  }
}

// ========== UYGULAMA BAŞLANGICI ==========
window.addEventListener("DOMContentLoaded", () => {
  wireUI();
  renderRecentSearches();
  addCameraButton();
  
  if (typeof firebaseConfigLooksInvalid === 'function' && firebaseConfigLooksInvalid()){
    toast("Firebase config eksik/yanlış. firebase.js içindeki değerleri kontrol et.", "error");
  }

  onAuthStateChanged(auth, async (user) => {
    window.currentUser = user || null;
    setAuthedUI(!!user);
    if (user){
      try{
        await loadFavorites(user.uid);
        renderFavoritesPage(user.uid);
        applyFavUI();
      }catch(e){ console.error(e); }
    }
  });
});

// ========== YARDIMCI FONKSİYONLAR ==========
async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    toast("Kopyalandı", 'success');
  }catch(e){
    const ta=document.createElement("textarea");
    ta.value=text;
    ta.style.position="fixed"; ta.style.left="-9999px";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try{ document.execCommand("copy"); toast("Kopyalandı", 'success'); }catch(_){}
    document.body.removeChild(ta);
  }
}

async function clearAppCache(){
  try{
    if (window.caches && caches.keys){
      const keys = await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
    try{ localStorage.clear(); }catch(e){}
    try{ sessionStorage.clear(); }catch(e){}
    if (indexedDB && indexedDB.databases){
      const dbs = await indexedDB.databases();
      await Promise.all((dbs||[]).map(db=>{
        if (!db || !db.name) return Promise.resolve();
        return new Promise(res=>{
          const req = indexedDB.deleteDatabase(db.name);
          req.onsuccess=req.onerror=req.onblocked=()=>res();
        });
      }));
    }
    toast("Önbellek temizlendi. Yenileniyor...", 'info');
  }catch(e){
    console.error(e);
    toast("Temizleme hatası", 'error');
  }
  setTimeout(()=>location.reload(true), 600);
}

// ========== GLOBAL FONKSİYONLAR ==========
window.doNormalSearch = (query) => {
  showPage("search");
  renderSiteList($("normalList"), query);
};

window.showPage = showPage;
window.fiyatAra = fiyatAra;
window.copyToClipboard = copyToClipboard;
window.handleRecentSearch = handleRecentSearch;
window.removeRecentSearch = removeRecentSearch;
window.changePage = changePage;
window.changeSort = changeSort;
window.changeFavPage = changeFavPage;
window.cameraAiSearch = cameraAiSearch;
window.getAiYorumSafe = getAiYorumSafe;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.checkoutCart = checkoutCart;

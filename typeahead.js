// typeahead.js - GENİŞLETİLMİŞ OTOMATİK TAMAMLAMA

(function(){
  // GENİŞ ÖNERİ VERİTABANI (PC bileşenleri + genel ürünler)
  const SUGGESTIONS = [
    // ======== CPU - AMD ========
    { label: "Ryzen 5 5600", canonical: "ryzen 5 5600" },
    { label: "Ryzen 5 5600X", canonical: "ryzen 5 5600x" },
    { label: "Ryzen 7 5800X3D", canonical: "ryzen 7 5800x3d" },
    { label: "Ryzen 5 7600", canonical: "ryzen 5 7600" },
    { label: "Ryzen 5 7600X", canonical: "ryzen 5 7600x" },
    { label: "Ryzen 7 7800X3D", canonical: "ryzen 7 7800x3d" },
    { label: "Ryzen 3 3300X", canonical: "ryzen 3 3300x" },
    { label: "Ryzen 9 7950X", canonical: "ryzen 9 7950x" },
    { label: "AMD FX-8350", canonical: "fx 8350" },
    { label: "AMD FX-6300", canonical: "fx 6300" },
    { label: "AMD Athlon 3000G", canonical: "athlon 3000g" },
    
    // ======== CPU - Intel ========
    { label: "Intel i3-12100F", canonical: "i3 12100f" },
    { label: "Intel i5-12400F", canonical: "i5 12400f" },
    { label: "Intel i5-12600K", canonical: "i5 12600k" },
    { label: "Intel i7-12700K", canonical: "i7 12700k" },
    { label: "Intel i5-13600K", canonical: "i5 13600k" },
    { label: "Intel i7-13700K", canonical: "i7 13700k" },
    { label: "Intel i9-13900K", canonical: "i9 13900k" },
    { label: "Intel i5-14600K", canonical: "i5 14600k" },
    { label: "Intel i7-9700K", canonical: "i7 9700k" },
    { label: "Intel i5-10400F", canonical: "i5 10400f" },
    { label: "Intel i7-10700K", canonical: "i7 10700k" },
    { label: "Intel i3-10100", canonical: "i3 10100" },
    { label: "Intel i5-2500K", canonical: "i5 2500k" },
    { label: "Intel i7-2600K", canonical: "i7 2600k" },
    { label: "Intel Core 2 Duo E8400", canonical: "core 2 duo e8400" },
    
    // ======== GPU - NVIDIA ========
    { label: "RTX 3060 12GB", canonical: "rtx 3060 12gb" },
    { label: "RTX 3060 Ti", canonical: "rtx 3060 ti" },
    { label: "RTX 4060", canonical: "rtx 4060" },
    { label: "RTX 4060 Ti", canonical: "rtx 4060 ti" },
    { label: "RTX 4070", canonical: "rtx 4070" },
    { label: "RTX 4070 Super", canonical: "rtx 4070 super" },
    { label: "RTX 4070 Ti", canonical: "rtx 4070 ti" },
    { label: "RTX 4080", canonical: "rtx 4080" },
    { label: "RTX 4090", canonical: "rtx 4090" },
    { label: "RTX 3080", canonical: "rtx 3080" },
    { label: "RTX 3070", canonical: "rtx 3070" },
    { label: "GTX 1050 Ti", canonical: "gtx 1050 ti" },
    { label: "GTX 1060 6GB", canonical: "gtx 1060 6gb" },
    { label: "GTX 1070", canonical: "gtx 1070" },
    { label: "GTX 1070 Ti", canonical: "gtx 1070 ti" },
    { label: "GTX 1080", canonical: "gtx 1080" },
    { label: "GTX 1080 Ti", canonical: "gtx 1080 ti" },
    { label: "GTX 1650", canonical: "gtx 1650" },
    { label: "GTX 1660", canonical: "gtx 1660" },
    { label: "GTX 1660 Super", canonical: "gtx 1660 super" },
    { label: "GTX 1660 Ti", canonical: "gtx 1660 ti" },
    { label: "RTX 2060", canonical: "rtx 2060" },
    { label: "RTX 2070", canonical: "rtx 2070" },
    { label: "RTX 2080 Ti", canonical: "rtx 2080 ti" },
    
    // ======== GPU - AMD ========
    { label: "RX 6600", canonical: "rx 6600" },
    { label: "RX 6600 XT", canonical: "rx 6600 xt" },
    { label: "RX 6700 XT", canonical: "rx 6700 xt" },
    { label: "RX 7600", canonical: "rx 7600" },
    { label: "RX 7600 XT", canonical: "rx 7600 xt" },
    { label: "RX 7700 XT", canonical: "rx 7700 xt" },
    { label: "RX 7800 XT", canonical: "rx 7800 xt" },
    { label: "RX 7900 XT", canonical: "rx 7900 xt" },
    { label: "RX 7900 XTX", canonical: "rx 7900 xtx" },
    { label: "RX 580 8GB", canonical: "rx 580 8gb" },
    { label: "RX 570 8GB", canonical: "rx 570 8gb" },
    { label: "RX 590", canonical: "rx 590" },
    { label: "RX 5500 XT", canonical: "rx 5500 xt" },
    { label: "RX 5600 XT", canonical: "rx 5600 xt" },
    { label: "RX 5700 XT", canonical: "rx 5700 xt" },
    { label: "RX 6800", canonical: "rx 6800" },
    { label: "RX 6800 XT", canonical: "rx 6800 xt" },
    { label: "RX 6900 XT", canonical: "rx 6900 xt" },
    { label: "RX 480", canonical: "rx 480" },
    { label: "RX 470", canonical: "rx 470" },
    { label: "RX 460", canonical: "rx 460" },
    { label: "HD 7970", canonical: "hd 7970" },
    { label: "R9 390", canonical: "r9 390" },
    { label: "R9 290X", canonical: "r9 290x" },
    
    // ======== RAM ========
    { label: "8GB DDR3 1600MHz", canonical: "8gb ddr3 1600" },
    { label: "16GB DDR3 1600MHz", canonical: "16gb ddr3 1600" },
    { label: "8GB DDR3 1866MHz", canonical: "8gb ddr3 1866" },
    { label: "16GB DDR3 1866MHz", canonical: "16gb ddr3 1866" },
    { label: "8GB DDR4 2400MHz", canonical: "8gb ddr4 2400" },
    { label: "16GB DDR4 2400MHz", canonical: "16gb ddr4 2400" },
    { label: "8GB DDR4 2666MHz", canonical: "8gb ddr4 2666" },
    { label: "16GB DDR4 2666MHz", canonical: "16gb ddr4 2666" },
    { label: "16GB DDR4 3200MHz", canonical: "16gb ddr4 3200" },
    { label: "32GB DDR4 3200MHz", canonical: "32gb ddr4 3200" },
    { label: "16GB DDR4 3600MHz", canonical: "16gb ddr4 3600" },
    { label: "32GB DDR4 3600MHz", canonical: "32gb ddr4 3600" },
    { label: "16GB DDR5 5200MHz", canonical: "16gb ddr5 5200" },
    { label: "32GB DDR5 5600MHz", canonical: "32gb ddr5 5600" },
    { label: "16GB DDR5 6000MHz", canonical: "16gb ddr5 6000" },
    { label: "32GB DDR5 6000MHz", canonical: "32gb ddr5 6000" },
    { label: "32GB DDR5 6400MHz", canonical: "32gb ddr5 6400" },
    
    // ======== Anakart ========
    { label: "B550 Anakart", canonical: "b550 anakart" },
    { label: "B550M Anakart", canonical: "b550m anakart" },
    { label: "X570 Anakart", canonical: "x570 anakart" },
    { label: "B450 Anakart", canonical: "b450 anakart" },
    { label: "A320 Anakart", canonical: "a320 anakart" },
    { label: "B650 Anakart", canonical: "b650 anakart" },
    { label: "B650E Anakart", canonical: "b650e anakart" },
    { label: "X670E Anakart", canonical: "x670e anakart" },
    { label: "Z690 Anakart", canonical: "z690 anakart" },
    { label: "Z790 Anakart", canonical: "z790 anakart" },
    { label: "B760 Anakart", canonical: "b760 anakart" },
    { label: "H610 Anakart", canonical: "h610 anakart" },
    { label: "Z370 Anakart", canonical: "z370 anakart" },
    { label: "B360 Anakart", canonical: "b360 anakart" },
    { label: "Z270 Anakart", canonical: "z270 anakart" },
    { label: "H270 Anakart", canonical: "h270 anakart" },
    { label: "Z170 Anakart", canonical: "z170 anakart" },
    { label: "H110 Anakart", canonical: "h110 anakart" },
    { label: "Z97 Anakart", canonical: "z97 anakart" },
    { label: "H97 Anakart", canonical: "h97 anakart" },
    { label: "Z87 Anakart", canonical: "z87 anakart" },
    { label: "H81 Anakart", canonical: "h81 anakart" },
    { label: "Z77 Anakart", canonical: "z77 anakart" },
    { label: "H77 Anakart", canonical: "h77 anakart" },
    { label: "Z68 Anakart", canonical: "z68 anakart" },
    
    // ======== PSU ========
    { label: "450W 80+ Bronze", canonical: "450w 80 plus bronze" },
    { label: "500W 80+ Bronze", canonical: "500w 80 plus bronze" },
    { label: "550W 80+ Bronze", canonical: "550w 80 plus bronze" },
    { label: "600W 80+ Bronze", canonical: "600w 80 plus bronze" },
    { label: "650W 80+ Bronze", canonical: "650w 80 plus bronze" },
    { label: "700W 80+ Bronze", canonical: "700w 80 plus bronze" },
    { label: "750W 80+ Gold", canonical: "750w 80 plus gold" },
    { label: "850W 80+ Gold", canonical: "850w 80 plus gold" },
    { label: "1000W 80+ Gold", canonical: "1000w 80 plus gold" },
    { label: "1200W 80+ Platinum", canonical: "1200w 80 plus platinum" },
    
    // ======== Depolama ========
    { label: "240GB SSD", canonical: "240gb ssd" },
    { label: "480GB SSD", canonical: "480gb ssd" },
    { label: "1TB SSD", canonical: "1tb ssd" },
    { label: "2TB SSD", canonical: "2tb ssd" },
    { label: "1TB NVMe SSD", canonical: "1tb nvme ssd" },
    { label: "2TB NVMe SSD", canonical: "2tb nvme ssd" },
    { label: "500GB HDD", canonical: "500gb hdd" },
    { label: "1TB HDD", canonical: "1tb hdd" },
    { label: "2TB HDD", canonical: "2tb hdd" },
    { label: "4TB HDD", canonical: "4tb hdd" },
    
    // ======== Soğutucu ========
    { label: "AIO 240mm Su Soğutma", canonical: "aio 240mm su soğutma" },
    { label: "AIO 360mm Su Soğutma", canonical: "aio 360mm su soğutma" },
    { label: "Hava Soğutucu", canonical: "hava soğutucu" },
    { label: "Noctua NH-D15", canonical: "noctua nh d15" },
    { label: "Cooler Master Hyper 212", canonical: "cooler master hyper 212" },
    
    // ======== Kasa ========
    { label: "Mid Tower Kasa", canonical: "mid tower kasa" },
    { label: "Full Tower Kasa", canonical: "full tower kasa" },
    { label: "Mini ITX Kasa", canonical: "mini itx kasa" },
    
    // ======== Genel Ürünler ========
    { label: "iPhone 13", canonical: "iphone 13" },
    { label: "iPhone 13 Pro", canonical: "iphone 13 pro" },
    { label: "iPhone 14", canonical: "iphone 14" },
    { label: "iPhone 15", canonical: "iphone 15" },
    { label: "Samsung Galaxy S23", canonical: "samsung galaxy s23" },
    { label: "PlayStation 5", canonical: "playstation 5" },
    { label: "PlayStation 5 Slim", canonical: "playstation 5 slim" },
    { label: "Xbox Series X", canonical: "xbox series x" },
    { label: "Xbox Series S", canonical: "xbox series s" },
    { label: "Nintendo Switch", canonical: "nintendo switch" },
    { label: "AirPods Pro", canonical: "airpods pro" },
    { label: "Samsung QLED TV", canonical: "samsung qled tv" },
    { label: "LG OLED TV", canonical: "lg oled tv" },
    { label: "MacBook Air M1", canonical: "macbook air m1" },
    { label: "MacBook Pro M2", canonical: "macbook pro m2" },
    { label: "iPad Pro", canonical: "ipad pro" },
    { label: "Samsung Tablet", canonical: "samsung tablet" }
  ];

  function getSuggestions(query, limit = 10) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase().trim();
    const results = [];
    
    // Önce tam eşleşenleri bul
    for (const item of SUGGESTIONS) {
      if (item.canonical === q) {
        return [item]; // Tam eşleşme varsa sadece onu göster
      }
    }
    
    // Kısmi eşleşmeleri bul
    for (const item of SUGGESTIONS) {
      let score = 0;
      
      // Aynı başlangıç (en yüksek puan)
      if (item.canonical.startsWith(q)) {
        score = 1000;
      }
      // İçinde geçiyor
      else if (item.canonical.includes(q)) {
        score = 500;
      }
      // Kelime bazlı eşleşme
      else {
        const queryWords = q.split(/\s+/);
        const itemWords = item.canonical.split(/\s+/);
        
        for (const qWord of queryWords) {
          for (const iWord of itemWords) {
            if (iWord.startsWith(qWord)) score += 200;
            else if (iWord.includes(qWord)) score += 50;
          }
        }
      }
      
      if (score > 0) {
        results.push({ ...item, score });
      }
    }
    
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  function createTypeaheadBox(input) {
    // Eğer zaten varsa, onu kullan
    let box = input.parentNode.querySelector('.typeaheadBox');
    if (box) return box;
    
    // Yoksa oluştur
    box = document.createElement("div");
    box.className = "typeaheadBox hidden";
    box.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      margin-top: 4px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: var(--shadow-xl);
    `;
    
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(box);
    return box;
  }

  function initTypeahead(input, onSelect) {
    if (!input) return;
    
    const box = createTypeaheadBox(input);
    let activeIndex = -1;
    let currentSuggestions = [];
    
    function hide() {
      box.classList.add("hidden");
      box.innerHTML = "";
      activeIndex = -1;
      currentSuggestions = [];
    }
    
    function render(suggestions) {
      if (!suggestions.length) {
        hide();
        return;
      }
      
      currentSuggestions = suggestions;
      box.classList.remove("hidden");
      
      box.innerHTML = suggestions.map((item, index) => `
        <div class="typeaheadItem ${index === activeIndex ? 'active' : ''}" 
             data-index="${index}"
             style="padding: 12px 16px; cursor: pointer; border-bottom: 1px solid rgba(148,163,184,0.1); transition: background 0.2s;">
          <div class="typeaheadLabel" style="font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">
            ${item.label}
          </div>
          <div class="typeaheadCanonical" style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
            ${item.canonical}
          </div>
        </div>
      `).join("");
      
      // Aktif öğeyi vurgula
      box.querySelectorAll('.typeaheadItem').forEach((item, idx) => {
        if (idx === activeIndex) {
          item.style.background = 'rgba(59, 130, 246, 0.1)';
        } else {
          item.style.background = '';
        }
        
        item.onmouseover = () => {
          box.querySelectorAll('.typeaheadItem').forEach(i => i.style.background = '');
          item.style.background = 'rgba(148, 163, 184, 0.1)';
        };
        
        item.onmouseout = () => {
          if (idx !== activeIndex) {
            item.style.background = '';
          } else {
            item.style.background = 'rgba(59, 130, 246, 0.1)';
          }
        };
      });
    }
    
    function selectItem(index) {
      if (index >= 0 && index < currentSuggestions.length) {
        const item = currentSuggestions[index];
        onSelect?.(item);
        input.value = item.canonical;
        hide();
        
        // Otomatik arama yap
        if (window.performSearch) {
          setTimeout(() => performSearch(), 300);
        }
      }
    }
    
    // Event listeners
    let lastValue = '';
    input.addEventListener("input", () => {
      if (input.value === lastValue) return;
      
      lastValue = input.value;
      const suggestions = getSuggestions(input.value);
      render(suggestions);
    });
    
    input.addEventListener("keydown", (e) => {
      if (box.classList.contains("hidden")) return;
      
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          activeIndex = (activeIndex + 1) % currentSuggestions.length;
          render(currentSuggestions);
          break;
          
        case "ArrowUp":
          e.preventDefault();
          activeIndex = activeIndex <= 0 ? currentSuggestions.length - 1 : activeIndex - 1;
          render(currentSuggestions);
          break;
          
        case "Enter":
          if (activeIndex >= 0) {
            e.preventDefault();
            selectItem(activeIndex);
          } else if (currentSuggestions.length > 0) {
            // İlk öğeyi seç
            e.preventDefault();
            selectItem(0);
          }
          break;
          
        case "Escape":
          hide();
          break;
      }
    });
    
    box.addEventListener("click", (e) => {
      const item = e.target.closest(".typeaheadItem");
      if (item) {
        const index = parseInt(item.dataset.index, 10);
        selectItem(index);
      }
    });
    
    // Dışarı tıklayınca kapat
    document.addEventListener("click", (e) => {
      if (!box.contains(e.target) && e.target !== input) {
        hide();
      }
    });
    
    // Input focus olunca göster (eğer değer varsa)
    input.addEventListener("focus", () => {
      if (input.value.length >= 2) {
        const suggestions = getSuggestions(input.value);
        render(suggestions);
      }
    });
  }

  // Global fonksiyon
  window.initTypeahead = initTypeahead;
  
  // Sayfa yüklendiğinde otomatik başlat
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('qNormal');
    if (searchInput) {
      initTypeahead(searchInput, (item) => {
        console.log('Seçilen öğe:', item);
      });
    }
  });
})();

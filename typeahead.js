// typeahead.js - OTOMATİK TAMAMLAMA

(function(){
  // Öneri veritabanı
  const SUGGESTIONS = [
    // CPU - AMD
    { label: "Ryzen 5 5600", canonical: "ryzen 5 5600" },
    { label: "Ryzen 5 5600X", canonical: "ryzen 5 5600x" },
    { label: "Ryzen 7 5800X3D", canonical: "ryzen 7 5800x3d" },
    { label: "Ryzen 5 7600", canonical: "ryzen 5 7600" },
    { label: "Ryzen 5 7600X", canonical: "ryzen 5 7600x" },
    { label: "Ryzen 7 7800X3D", canonical: "ryzen 7 7800x3d" },
    
    // CPU - Intel
    { label: "Intel i5-12400F", canonical: "i5 12400f" },
    { label: "Intel i5-12600K", canonical: "i5 12600k" },
    { label: "Intel i7-12700K", canonical: "i7 12700k" },
    { label: "Intel i5-13600K", canonical: "i5 13600k" },
    { label: "Intel i7-13700K", canonical: "i7 13700k" },
    { label: "Intel i9-13900K", canonical: "i9 13900k" },
    { label: "Intel i5-14600K", canonical: "i5 14600k" },
    
    // GPU - NVIDIA
    { label: "RTX 3060 12GB", canonical: "rtx 3060 12gb" },
    { label: "RTX 3060 Ti", canonical: "rtx 3060 ti" },
    { label: "RTX 4070", canonical: "rtx 4070" },
    { label: "RTX 4070 Super", canonical: "rtx 4070 super" },
    { label: "RTX 4070 Ti", canonical: "rtx 4070 ti" },
    { label: "RTX 4080", canonical: "rtx 4080" },
    { label: "RTX 4090", canonical: "rtx 4090" },
    { label: "RTX 5060", canonical: "rtx 5060" },
    
    // GPU - AMD
    { label: "RX 6600", canonical: "rx 6600" },
    { label: "RX 6600 XT", canonical: "rx 6600 xt" },
    { label: "RX 6700 XT", canonical: "rx 6700 xt" },
    { label: "RX 7600", canonical: "rx 7600" },
    { label: "RX 7600 XT", canonical: "rx 7600 xt" },
    { label: "RX 7700 XT", canonical: "rx 7700 xt" },
    { label: "RX 7800 XT", canonical: "rx 7800 xt" },
    { label: "RX 7900 XT", canonical: "rx 7900 xt" },
    
    // RAM
    { label: "16GB DDR4 3200MHz", canonical: "16gb ddr4 3200" },
    { label: "32GB DDR4 3200MHz", canonical: "32gb ddr4 3200" },
    { label: "16GB DDR4 3600MHz", canonical: "16gb ddr4 3600" },
    { label: "32GB DDR4 3600MHz", canonical: "32gb ddr4 3600" },
    { label: "16GB DDR5 5600MHz", canonical: "16gb ddr5 5600" },
    { label: "32GB DDR5 6000MHz", canonical: "32gb ddr5 6000" },
    { label: "32GB DDR5 6400MHz", canonical: "32gb ddr5 6400" },
    
    // Anakart
    { label: "B550 Anakart", canonical: "b550 anakart" },
    { label: "B550M Anakart", canonical: "b550m anakart" },
    { label: "X570 Anakart", canonical: "x570 anakart" },
    { label: "B650 Anakart", canonical: "b650 anakart" },
    { label: "B650E Anakart", canonical: "b650e anakart" },
    { label: "X670E Anakart", canonical: "x670e anakart" },
    { label: "B760 Anakart", canonical: "b760 anakart" },
    { label: "Z790 Anakart", canonical: "z790 anakart" },
    
    // PSU
    { label: "650W 80+ Bronze", canonical: "650w 80 plus bronze" },
    { label: "750W 80+ Gold", canonical: "750w 80 plus gold" },
    { label: "850W 80+ Gold", canonical: "850w 80 plus gold" },
    { label: "1000W 80+ Gold", canonical: "1000w 80 plus gold" },
    
    // Depolama
    { label: "1TB NVMe SSD", canonical: "1tb nvme ssd" },
    { label: "2TB NVMe SSD", canonical: "2tb nvme ssd" },
    { label: "1TB SATA SSD", canonical: "1tb sata ssd" },
    { label: "4TB HDD", canonical: "4tb hdd" },
    
    // Soğutucu
    { label: "AIO 240mm Su Soğutma", canonical: "aio 240mm su soğutma" },
    { label: "AIO 360mm Su Soğutma", canonical: "aio 360mm su soğutma" },
    { label: "Hava Soğutucu", canonical: "hava soğutucu" },
    
    // Kasa
    { label: "Mid Tower Kasa", canonical: "mid tower kasa" },
    { label: "Full Tower Kasa", canonical: "full tower kasa" },
    { label: "Mini ITX Kasa", canonical: "mini itx kasa" }
  ];

  function getSuggestions(query, limit = 10) {
    if (!query || query.length < 2) return [];
    
    const q = query.toLowerCase().trim();
    const results = [];
    
    for (const item of SUGGESTIONS) {
      const score = calculateScore(item.canonical, q);
      if (score > 0) {
        results.push({ ...item, score });
      }
    }
    
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  function calculateScore(text, query) {
    if (text === query) return 1000;
    if (text.startsWith(query)) return 800;
    if (text.includes(query)) return 500;
    
    // Kelime bazlı eşleşme
    const queryWords = query.split(/\s+/);
    const textWords = text.split(/\s+/);
    
    let wordScore = 0;
    for (const qWord of queryWords) {
      for (const tWord of textWords) {
        if (tWord.startsWith(qWord)) wordScore += 100;
        else if (tWord.includes(qWord)) wordScore += 50;
      }
    }
    
    return wordScore;
  }

  function createTypeaheadBox(input) {
    const box = document.createElement("div");
    box.className = "typeaheadBox hidden";
    input.parentNode.insertBefore(box, input.nextSibling);
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
             data-index="${index}">
          <div class="typeaheadLabel">${item.label}</div>
          <div class="typeaheadCanonical">${item.canonical}</div>
        </div>
      `).join("");
    }
    
    function selectItem(index) {
      if (index >= 0 && index < currentSuggestions.length) {
        const item = currentSuggestions[index];
        onSelect?.(item);
        input.value = item.canonical;
        hide();
        
        // Otomatik arama yap
        if (window.performSearch) {
          setTimeout(() => performSearch(), 100);
        }
      }
    }
    
    // Event listeners
    input.addEventListener("input", () => {
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
  }

  // Global fonksiyon
  window.initTypeahead = initTypeahead;
})();

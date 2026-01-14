// pc-builder.js - PC TOPLAMA MOTORU

(function(){
  const PC = {};
  
  // ========== VERİTABANI ==========
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
    
    // Intel
    "h61":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "h67":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "p67":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "z68":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
    "h77":{brand:"intel",socket:"LGA1155",ram:"DDR3"},
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

  // ========== FONKSİYONLAR ==========
  function normalizeQuery(q) {
    return (q || "").toLowerCase().trim().replace(/\s+/g, " ");
  }

  function detectPart(q) {
    const nq = normalizeQuery(q);
    
    // RAM tespit
    const ramMatch = nq.match(/\bddr(3|4|5)\b/i);
    if (ramMatch) {
      const sizeMatch = nq.match(/\b(4|8|16|32|64)\s*gb\b/i);
      const mhzMatch = nq.match(/\b(1333|1600|1866|2133|2400|2666|3000|3200|3600|4000|4800|5200|5600|6000|6400)\b/);
      return {
        type: "ram",
        data: {
          type: "DDR" + ramMatch[1],
          size: sizeMatch ? sizeMatch[1] + "GB" : null,
          mhz: mhzMatch ? mhzMatch[1] : null
        }
      };
    }
    
    // PSU tespit
    const psuMatch = nq.match(/\b(300|350|400|450|500|550|600|650|700|750|800|850|1000)\s*w\b/);
    if (psuMatch) {
      return {
        type: "psu",
        data: { watt: parseInt(psuMatch[1], 10) }
      };
    }
    
    // Chipset/Anakart tespit
    for (const [chipset, info] of Object.entries(CHIPSET_DB)) {
      if (nq.includes(chipset)) {
        return {
          type: "mobo",
          data: { ...info, chipset: chipset.toUpperCase() }
        };
      }
    }
    
    // CPU tespit
    // AMD Ryzen
    const ryzenMatch = nq.match(/\b(ryzen\s*[3579]|r[3579])\s*(\d{4})(x3d|xt|x|g)?\b/i);
    if (ryzenMatch) {
      const model = ryzenMatch[2];
      const socket = parseInt(model) >= 7000 ? "AM5" : "AM4";
      const level = ryzenMatch[1].includes("3") ? "entry" : 
                    ryzenMatch[1].includes("5") ? "mid" : "high";
      return {
        type: "cpu",
        data: {
          brand: "AMD",
          family: ryzenMatch[1].toUpperCase().replace("RYZEN ", "R"),
          model: model + (ryzenMatch[3] || "").toUpperCase(),
          socket: socket,
          ram: socket === "AM5" ? "DDR5" : "DDR4",
          level: level
        }
      };
    }
    
    // Intel Core
    const intelMatch = nq.match(/\b(i[3579])[-\s]?(\d{4,5})([a-z]{0,3})\b/i);
    if (intelMatch) {
      const model = intelMatch[2];
      const gen = model.length === 4 ? parseInt(model[0]) : parseInt(model.slice(0, 2));
      let socket = "LGA1700";
      if (gen <= 3) socket = "LGA1155";
      else if (gen <= 5) socket = "LGA1150";
      else if (gen <= 7) socket = "LGA1151";
      else if (gen <= 9) socket = "LGA1151v2";
      else if (gen <= 11) socket = "LGA1200";
      else if (gen <= 14) socket = "LGA1700";
      else socket = "LGA1851";
      
      const level = intelMatch[1] === "i3" ? "entry" : 
                    intelMatch[1] === "i5" ? "mid" : "high";
      
      return {
        type: "cpu",
        data: {
          brand: "Intel",
          family: intelMatch[1].toUpperCase(),
          model: model + (intelMatch[3] || "").toUpperCase(),
          gen: gen,
          socket: socket,
          ram: socket === "LGA1851" ? "DDR5" : 
               socket === "LGA1700" ? "DDR4/DDR5" : "DDR4",
          level: level
        }
      };
    }
    
    // GPU tespit
    // NVIDIA
    const nvidiaMatch = nq.match(/\b(rtx|gtx)\s*(\d{3,4})\s*(ti|super)?\b/i);
    if (nvidiaMatch) {
      const num = parseInt(nvidiaMatch[2], 10);
      let tier = "entry";
      if (nvidiaMatch[1].toLowerCase() === "rtx") {
        if (num >= 4070) tier = "high";
        else if (num >= 3060) tier = "mid";
      } else {
        if (num >= 1080) tier = "mid";
      }
      return {
        type: "gpu",
        data: {
          brand: "NVIDIA",
          name: `${nvidiaMatch[1].toUpperCase()} ${nvidiaMatch[2]} ${nvidiaMatch[3] || ""}`.trim(),
          tier: tier,
          minPsu: tier === "high" ? 650 : tier === "mid" ? 600 : 500
        }
      };
    }
    
    // AMD GPU
    const amdGpuMatch = nq.match(/\brx\s*(\d{3,4})\s*(xt|x)?\b/i);
    if (amdGpuMatch) {
      const num = parseInt(amdGpuMatch[1], 10);
      let tier = "entry";
      if (num >= 7800) tier = "high";
      else if (num >= 6600) tier = "mid";
      return {
        type: "gpu",
        data: {
          brand: "AMD",
          name: `RX ${amdGpuMatch[1]} ${amdGpuMatch[2] || ""}`.trim(),
          tier: tier,
          minPsu: tier === "high" ? 700 : tier === "mid" ? 600 : 500
        }
      };
    }
    
    return null;
  }

  function isPcRelated(q) {
    const nq = normalizeQuery(q);
    return /(ryzen|\bi[3579]\b|rtx|gtx|\brx\b|ddr3|ddr4|ddr5|b450|b550|x570|b650|z790|h610|psu|\b\d{3,4}\s*w\b)/i.test(nq);
  }

  function buildProfiles(part) {
    const profiles = [
      { key: "budget", label: "💸 Bütçe" },
      { key: "balanced", label: "⚖️ Dengeli" },
      { key: "performance", label: "🚀 Güçlü" }
    ];

    return profiles.map(p => {
      const profile = p.key;
      const row = { profile: p.label };

      if (part.type === "cpu") {
        row.cpu = `${part.data.brand} ${part.data.family} ${part.data.model}`;
        row.mobo = suggestMotherboard(part.data.socket, profile);
        row.ram = suggestRAM(part.data.ram, profile);
        row.gpu = suggestGPU(part.data.level, profile);
        row.psu = suggestPSU(part.data.level, profile);
      }

      if (part.type === "gpu") {
        row.gpu = part.data.name;
        row.psu = suggestPSUByWatt(part.data.minPsu, profile);
        row.cpu = suggestCPU(part.data.tier, profile);
        row.mobo = suggestMotherboardByTier(part.data.tier, profile);
        row.ram = suggestRAMByTier(part.data.tier, profile);
      }

      if (part.type === "mobo") {
        row.mobo = `${part.data.chipset} (${part.data.socket})`;
        row.cpu = suggestCPUBySocket(part.data.socket, profile);
        row.ram = suggestRAMBySocket(part.data.socket, profile);
        row.gpu = "GPU seçimine göre";
        row.psu = "650W öneri";
      }

      if (part.type === "ram") {
        row.ram = `${part.data.type}${part.data.size ? " " + part.data.size : ""}${part.data.mhz ? " " + part.data.mhz + "MHz" : ""}`;
        row.cpu = suggestCPUByRAM(part.data.type, profile);
        row.mobo = suggestMotherboardByRAM(part.data.type, profile);
        row.gpu = "GPU seçimine göre";
        row.psu = "Sisteme göre";
      }

      if (part.type === "psu") {
        row.psu = `${part.data.watt}W`;
        row.gpu = suggestGPUByPSU(part.data.watt, profile);
        row.cpu = "GPU'ya göre CPU";
        row.mobo = "CPU soketine göre";
        row.ram = "16-32GB";
      }

      row.warnings = buildWarnings(part, profile, row);
      return row;
    });
  }

  // ========== ÖNERİ FONKSİYONLARI ==========
  function suggestMotherboard(socket, profile) {
    if (socket === "AM4") {
      return profile === "budget" ? "A520 / B450" : 
             profile === "balanced" ? "B450 üst / B550" : "B550 üst / X570";
    }
    if (socket === "AM5") {
      return profile === "budget" ? "A620" : 
             profile === "balanced" ? "B650" : "B650E / X670E";
    }
    if (socket === "LGA1700") {
      return profile === "budget" ? "H610" : 
             profile === "balanced" ? "B660 / B760" : "Z690 / Z790";
    }
    return "Uyumlu anakart";
  }

  function suggestRAM(ramType, profile) {
    if (ramType.includes("DDR5")) {
      return profile === "budget" ? "16GB DDR5 5600" : 
             profile === "balanced" ? "32GB DDR5 6000" : "32GB DDR5 6400";
    }
    return profile === "budget" ? "16GB DDR4 3200" : 
           profile === "balanced" ? "16GB DDR4 3600" : "32GB DDR4 3600";
  }

  // ... diğer öneri fonksiyonları (kısaltıldı)

  function buildWarnings(part, profile, row) {
    const warns = [];
    
    if (part.type === "mobo") {
      if (part.data.socket === "AM4" && row.ram.includes("DDR5")) {
        warns.push("❌ AM4 anakart DDR5 desteklemez.");
      }
    }
    
    warns.push("🟡 Fiyatlar için sitelerde ara: kopyala-ara yapın.");
    return warns;
  }

  function renderTo(container, query, label) {
    if (!container) return;
    
    const part = detectPart(query);
    if (!part || !isPcRelated(query)) {
      container.innerHTML = `
        <div class="pcBuildCard">
          <div class="pcBuildHeader">
            <h3>PC Toplama Önerisi</h3>
            <p>Bu arama PC bileşeni içermiyor.</p>
          </div>
        </div>
      `;
      return;
    }
    
    const profiles = buildProfiles(part);
    const title = label || "PC Toplama Önerisi";
    
    container.innerHTML = `
      <div class="pcBuildCard">
        <div class="pcBuildHeader">
          <h3>${title}</h3>
          <p>Algılanan: <strong>${part.type.toUpperCase()}</strong></p>
        </div>
        
        <div class="pcBuildControls">
          <div>
            <label>Profil:</label>
            <select class="pcProfileSel">
              <option value="0">💸 Bütçe</option>
              <option value="1" selected>⚖️ Dengeli</option>
              <option value="2">🚀 Güçlü</option>
            </select>
          </div>
          <div>
            <label>Durum:</label>
            <select class="pcConditionSel">
              <option value="2el" selected>🔄 2. El</option>
              <option value="sifir">🛍️ Sıfır</option>
            </select>
          </div>
          <button class="pcCopyBtn">📋 Kopyala & Ara</button>
        </div>
        
        <div class="pcBuildBody">
          <!-- Profil içeriği buraya gelecek -->
        </div>
      </div>
    `;
    
    // Event listeners
    const profileSel = container.querySelector(".pcProfileSel");
    const conditionSel = container.querySelector(".pcConditionSel");
    const copyBtn = container.querySelector(".pcCopyBtn");
    const body = container.querySelector(".pcBuildBody");
    
    function updateProfile() {
      const profileIndex = parseInt(profileSel.value, 10);
      const profile = profiles[profileIndex];
      
      body.innerHTML = `
        <div class="pcGrid">
          <div><span>CPU</span><strong>${profile.cpu || "-"}</strong></div>
          <div><span>GPU</span><strong>${profile.gpu || "-"}</strong></div>
          <div><span>Anakart</span><strong>${profile.mobo || "-"}</strong></div>
          <div><span>RAM</span><strong>${profile.ram || "-"}</strong></div>
          <div><span>PSU</span><strong>${profile.psu || "-"}</strong></div>
        </div>
        ${profile.warnings && profile.warnings.length ? `
          <div class="pcWarn">
            ${profile.warnings.map(w => `<div>${w}</div>`).join("")}
          </div>
        ` : ""}
      `;
    }
    
    function copyToClipboard() {
      const profileIndex = parseInt(profileSel.value, 10);
      const profile = profiles[profileIndex];
      const condition = conditionSel.value === "2el" ? " ikinci el" : " sıfır";
      
      const components = [
        profile.cpu,
        profile.gpu,
        profile.mobo,
        profile.ram,
        profile.psu
      ].filter(c => c && c !== "-");
      
      const text = components.map(c => c + condition).join("\n");
      
      navigator.clipboard.writeText(text)
        .then(() => {
          if (window.toast) toast("Kopyalandı! Sitelerde arayabilirsiniz ✅", "success");
        })
        .catch(() => {
          // Fallback
          const textarea = document.createElement("textarea");
          textarea.value = text;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
          if (window.toast) toast("Kopyalandı! ✅", "success");
        });
    }
    
    profileSel.addEventListener("change", updateProfile);
    copyBtn.addEventListener("click", copyToClipboard);
    
    // İlk yükleme
    updateProfile();
  }

  // ========== EXPORT ==========
  PC.normalizeQuery = normalizeQuery;
  PC.detectPart = detectPart;
  PC.isPcRelated = isPcRelated;
  PC.renderTo = renderTo;
  
  window.PCBuilder = PC;
})();

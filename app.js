// app.js - TÜM SİTE URL'LERİ DÜZELTİLDİ (Ürünler Açılacak)

// ========== GLOBAL DEĞİŞKENLER ==========
const $ = (id) => document.getElementById(id);

// Sepet ve önbellek
let cartItems = JSON.parse(localStorage.getItem('fiyattakip_cart') || '[]');
let currentUser = null;
let currentSearchType = 'all';
// ========== PC TOPLAMA MOTORU (KURAL TABANLI) ==========
// Not: Canlı veri/scraper & AI yokmuş gibi çalışır. Sadece "tanıma + uyumluluk + öneri" üretir.
// Kullanıcı tercihi (profil + parça durumu)
const BUILD_PROFILES = [
  { key: "budget", label: "💸 Bütçe", desc: "Minimum bütçe / maksimum fiyat-performans" },
  { key: "balanced", label: "⚖️ Dengeli", desc: "En mantıklı denge" },
  { key: "performance", label: "🚀 Güçlü", desc: "Maksimum performans (mantıklı sınır)" }
];

let buildProfile = localStorage.getItem("pc_profile") || "balanced"; // budget|balanced|performance
let partCondition = localStorage.getItem("pc_condition") || "secondhand"; // secondhand|new

function setBuildProfile(key){
  if (!BUILD_PROFILES.some(p => p.key === key)) return;
  buildProfile = key;
  localStorage.setItem("pc_profile", key);
  // aktif aramayı yeniden çiz
  const q = ($("qNormal")?.value || "").trim();
  if ($("page-search")?.classList.contains("active") && q) showSearchResults(q);
}

function setPartCondition(key){
  if (!["secondhand","new"].includes(key)) return;
  partCondition = key;
  localStorage.setItem("pc_condition", key);
  const q = ($("qNormal")?.value || "").trim();
  if ($("page-search")?.classList.contains("active") && q) showSearchResults(q);
}

// --- Model veri tabanı (genişletilebilir) ---
// Kullanıcının yazdığı her şeyi bulabilmek için: (1) seri listeleri (2) regex tanıma (3) chipset/socket kuralları.
const MODEL_DB = {
  intelCpuSeries: {
    "Arrow Lake (15th Gen)": ["i9-15900K","i7-15700K","i5-15500","i3-15300"],
    "Raptor Lake (14th Gen)": ["i9-14900K","i7-14700K","i5-14600K","i3-14100"],
    "Raptor Lake (13th Gen)": ["i9-13900K","i7-13700K","i5-13600K","i3-13100"],
    "Alder Lake (12th Gen)": ["i9-12900K","i7-12700K","i5-12600K","i3-12100"],
    "Rocket Lake (11th Gen)": ["i9-11900K","i7-11700K","i5-11600K","i3-11100"],
    "Comet Lake (10th Gen)": ["i9-10900K","i7-10700K","i5-10600K","i3-10100"],
    "Coffee Lake (9th Gen)": ["i9-9900K","i7-9700K","i5-9600K","i3-9100"],
    "Coffee Lake (8th Gen)": ["i7-8700K","i5-8600K","i3-8100"],
    "Kaby Lake (7th Gen)": ["i7-7700K","i5-7600K","i3-7100"],
    "Skylake (6th Gen)": ["i7-6700K","i5-6600K","i3-6100"],
    "Haswell (4th Gen)": ["i7-4790K","i5-4690K","i3-4160"],
    "Sandy/Ivy Bridge (2nd/3rd Gen)": ["i7-2600K","i5-2500K","i3-2100"],
    "Core 2 Duo/Quad": ["Q9650","Q6600","E8400"]
  },
  amdCpuSeries: {
    "Zen 5 (Ryzen 9000)": ["R9 9950X","R9 9900X","R7 9700X","R5 9600X"],
    "Zen 4 (Ryzen 7000)": ["R9 7950X","R7 7700X","R5 7600X"],
    "Zen 3 (Ryzen 5000)": ["R9 5950X","R7 5800X3D","R5 5600X","R3 5300X"],
    "Zen 2 (Ryzen 3000)": ["R9 3950X","R7 3700X","R5 3600","R3 3300X"],
    "Zen+ (Ryzen 2000)": ["R7 2700X","R5 2600","R3 2200G"],
    "Zen 1 (Ryzen 1000)": ["R7 1800X","R5 1600","R3 1200"],
    "FX Series": ["FX-9590","FX-8350","FX-6300"],
    "Phenom II/Athlon": ["Phenom II X6","Phenom II X4","Athlon II X4"]
  },
  nvidiaGpuSeries: {
    "RTX 50 Series": ["RTX 5090","RTX 5080","RTX 5070 Ti","RTX 5070","RTX 5060 Ti","RTX 5060"],
    "RTX 40 Series": ["RTX 4090","RTX 4080 Super","RTX 4070 Ti Super","RTX 4070 Super","RTX 4060 Ti","RTX 4060"],
    "RTX 30 Series": ["RTX 3090 Ti","RTX 3080 Ti","RTX 3070 Ti","RTX 3060 Ti","RTX 3050"],
    "RTX 20 Series": ["RTX 2080 Ti","RTX 2080 Super","RTX 2070 Super","RTX 2060 Super"],
    "GTX 16 Series": ["GTX 1660 Ti","GTX 1660 Super","GTX 1650 Super"],
    "GTX 10 Series": ["GTX 1080 Ti","GTX 1080","GTX 1070 Ti","GTX 1060 6GB","GTX 1050 Ti"],
    "GTX 900 Series": ["GTX 980 Ti","GTX 980","GTX 970","GTX 960"],
    "GTX 700 Series": ["GTX 780 Ti","GTX 780","GTX 770","GTX 760"],
    "GTX 600 Series": ["GTX 680","GTX 670","GTX 660 Ti"],
    "GTX 500 Series": ["GTX 580","GTX 570","GTX 560 Ti"]
  },
  amdGpuSeries: {
    "RDNA 4 (RX 8000)": ["RX 8900 XT","RX 8800 XT","RX 8700 XT","RX 8600 XT"],
    "RDNA 3 (RX 7000)": ["RX 7900 XTX","RX 7900 XT","RX 7800 XT","RX 7700 XT","RX 7600 XT","RX 7600"],
    "RDNA 2 (RX 6000)": ["RX 6950 XT","RX 6900 XT","RX 6800 XT","RX 6700 XT","RX 6600 XT","RX 6600"],
    "RDNA 1 (RX 5000)": ["RX 5700 XT","RX 5700","RX 5600 XT"],
    "RX 500 (Polaris)": ["RX 590","RX 580","RX 570","RX 560","RX 550"],
    "RX 400 (Polaris)": ["RX 480","RX 470","RX 460"],
    "R9/R7 300": ["R9 390X","R9 390","R9 380X","R9 380"],
    "R9/R7 200": ["R9 290X","R9 290","R9 280X","R7 270X"],
    "HD 7000": ["HD 7970","HD 7950","HD 7870"],
    "HD 6000": ["HD 6970","HD 6950","HD 6870"]
  },
  sockets: {
    intel: {
      "LGA1851": { chipsets: ["Z890","B860","H810"], ram: "DDR5", years: "2024-2026" },
      "LGA1700": { chipsets: ["Z790","B760","H770","Z690","B660","H610"], ram: "DDR4/DDR5", years: "2021-2024" },
      "LGA1200": { chipsets: ["Z590","B560","H570","Z490","B460","H410"], ram: "DDR4", years: "2020-2021" },
      "LGA1151v2": { chipsets: ["Z390","B365","H370","Z370","B360","H310"], ram: "DDR4", years: "2018-2019" },
      "LGA1151": { chipsets: ["Z270","B250","H270","Z170","B150","H110"], ram: "DDR4", years: "2015-2017" },
      "LGA1150": { chipsets: ["Z97","H97","Z87","H87"], ram: "DDR3", years: "2013-2015" },
      "LGA1155": { chipsets: ["Z77","H77","Z68","P67"], ram: "DDR3", years: "2011-2013" }
    },
    amd: {
      "AM5": { chipsets: ["X670E","X670","B650E","B650","A620"], ram: "DDR5", years: "2022-2026" },
      "AM4": { chipsets: ["X570","B550","A520","X470","B450","A320"], ram: "DDR4", years: "2017-2022" },
      "AM3+": { chipsets: ["990FX","990X","970"], ram: "DDR3", years: "2011-2014" }
    }
  }
};

// --- yardımcılar ---
function norm(s){
  return (s||"")
    .toLowerCase()
    .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
    .replace(/[^a-z0-9\+\.\-\s]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// Seviye sınıflandırması (basit ama işe yarar)
function perfClassFromGpu(model){
  const q = norm(model);
  // Çok kaba sınıf: entry / mid / high / extreme
  if (q.includes("5090") || q.includes("4090") || q.includes("7900 xtx") || q.includes("5080")) return "extreme";
  if (q.includes("4080") || q.includes("5070 ti") || q.includes("7900 xt") || q.includes("7800 xt")) return "high";
  if (q.includes("4070") || q.includes("7700 xt") || q.includes("6800") || q.includes("3060 ti") || q.includes("6700 xt")) return "mid";
  if (q.includes("4060") || q.includes("7600") || q.includes("6600") || q.includes("3050") || q.includes("1660") || q.includes("580") ) return "entry";
  return "mid";
}

// CPU sınıfını kabaca çıkar
function perfClassFromCpu(model){
  const q = norm(model);
  if (q.includes("i9") || q.includes("r9") || q.includes("9950") || q.includes("7950") || q.includes("5950")) return "high";
  if (q.includes("i7") || q.includes("r7") || q.includes("9900") || q.includes("5800") || q.includes("7700")) return "mid";
  if (q.includes("i5") || q.includes("r5") || q.includes("5600") || q.includes("3600") || q.includes("14600") || q.includes("13600")) return "mid";
  if (q.includes("i3") || q.includes("r3") || q.includes("12100") || q.includes("13100") || q.includes("3300") ) return "entry";
  return "mid";
}

function detectPart(query){
  const q = norm(query);

  // PSU
  const psuMatch = q.match(/\b(\d{3,4})\s*w\b/);
  if (psuMatch){
    const w = parseInt(psuMatch[1],10);
    return { type:"psu", model: query, watts:w };
  }

  // RAM
  if (q.includes("ddr")){
    const ddr = (q.match(/\bddr\s*([2345])\b/)||[])[1] || (q.match(/\bddr([2345])\b/)||[])[1];
    const size = (q.match(/\b(\d{1,3})\s*gb\b/)||[])[1];
    const mhz = (q.match(/\b(\d{3,5})\s*mhz\b/)||[])[1] || (q.match(/\b(\d{4,5})\b/)||[])[1];
    return { type:"ram", model: query, ddr: ddr ? `DDR${ddr}` : null, size: size?parseInt(size,10):null, mhz: mhz?parseInt(mhz,10):null };
  }

  // Motherboard (chipset tabanlı)
  const mbChip = q.match(/\b(b\d{3}|h\d{3}|z\d{3}|x\d{3,4}|a\d{3}|x670e|b650e)\b/);
  const looksLikeBoard = mbChip || q.includes("mobo") || q.includes("anakart") || q.includes("motherboard");
  if (looksLikeBoard){
    const chip = mbChip ? mbChip[1].toUpperCase() : null;
    return { type:"motherboard", model: query, chipset: chip };
  }

  // GPU
  const gpuN = q.match(/\b(rtx|gtx)\s*([0-9]{3,4})(\s*ti\s*super|\s*ti|\s*super)?\b/);
  const gpuA = q.match(/\brx\s*([0-9]{3,4})(\s*xtx|\s*xt)?\b/);
  if (gpuN){
    const series = gpuN[2];
    const suffix = (gpuN[3]||"").trim().toUpperCase();
    const model = `${gpuN[1].toUpperCase()} ${series}${suffix?(" "+suffix.replace(/\s+/g," ")): ""}`.trim();
    return { type:"gpu", brand:"nvidia", model };
  }
  if (gpuA){
    const series = gpuA[1];
    const suffix = (gpuA[2]||"").trim().toUpperCase();
    const model = `RX ${series}${suffix?(" "+suffix): ""}`.trim();
    return { type:"gpu", brand:"amd", model };
  }

  // CPU
  const intel = q.match(/\b(i[3579])[\-\s]*([0-9]{4,5})([a-z]{0,3})\b/);
  const ryzen = q.match(/\b(r[3579])[\-\s]*([0-9]{4,5})(x3d|x|g)?\b/);
  const fx = q.match(/\bfx[\-\s]*([0-9]{4})\b/);
  if (intel){
    return { type:"cpu", brand:"intel", model: `${intel[1].toUpperCase()}-${intel[2]}${(intel[3]||"").toUpperCase()}` };
  }
  if (ryzen){
    return { type:"cpu", brand:"amd", model: `Ryzen ${ryzen[1].toUpperCase().replace("R","")} ${ryzen[2]}${(ryzen[3]||"").toUpperCase()}`.replace(/\s+/g," ").trim() };
  }
  if (fx){
    return { type:"cpu", brand:"amd", model: `FX-${fx[1]}` };
  }

  // fallback: bileşen türü belirsiz
  return { type:"unknown", model: query };
}

function platformFromChipset(chipset){
  const c = (chipset||"").toUpperCase();
  if (!c) return null;

  // AMD
  if (c.startsWith("B4") || c.startsWith("X4") || ["X570","B550","B450","A520","A320"].includes(c)){
    return { socket:"AM4", ram:"DDR4", level: c==="A320" ? "entry" : (c==="B450"||c==="A520" ? "entry" : "mid") };
  }
  if (["B650","B650E","X670","X670E","A620"].includes(c)){
    return { socket:"AM5", ram:"DDR5", level: c==="A620" ? "entry" : "mid" };
  }

  // Intel
  if (["H610","B660","Z690","B760","Z790","H770"].includes(c)){
    return { socket:"LGA1700", ram:"DDR4/DDR5", level: c.startsWith("H") ? "entry" : (c.startsWith("B") ? "mid" : "high") };
  }
  if (["H410","B460","Z490","B560","Z590","H570"].includes(c)){
    return { socket:"LGA1200", ram:"DDR4", level: c.startsWith("H") ? "entry" : (c.startsWith("B") ? "mid" : "high") };
  }
  if (["H310","B360","B365","Z370","Z390","H370"].includes(c)){
    return { socket:"LGA1151v2", ram:"DDR4", level: c.startsWith("H") ? "entry" : (c.startsWith("B") ? "mid" : "high") };
  }
  if (["H110","B150","Z170","B250","Z270","H270"].includes(c)){
    return { socket:"LGA1151", ram:"DDR4", level: c.startsWith("H") ? "entry" : (c.startsWith("B") ? "mid" : "high") };
  }
  if (["H87","Z87","H97","Z97"].includes(c)){
    return { socket:"LGA1150", ram:"DDR3", level: c.startsWith("H") ? "entry" : "mid" };
  }
  if (["H77","Z77","Z68","P67"].includes(c)){
    return { socket:"LGA1155", ram:"DDR3", level: c.startsWith("H") ? "entry" : "mid" };
  }

  return null;
}

function recommendBuild(input){
  // Çıktı: { recognizedTitle, infoLines[], warnings[], profiles: {budget:{...}, balanced:{...}, performance:{...}} }
  const base = {
    recognizedTitle: "",
    infoLines: [],
    warnings: [],
    profiles: {}
  };

  const profileKeys = ["budget","balanced","performance"];

  function mkProfile(cpu, mobo, ram, gpu, psu){
    return { cpu, mobo, ram, gpu, psu };
  }

  const type = input.type;

  if (type === "motherboard"){
    const p = platformFromChipset(input.chipset) || { socket:"(Bilinmiyor)", ram:"(Bilinmiyor)", level:"mid" };
    base.recognizedTitle = `🧩 Anakart Tanındı: ${input.model}`;
    base.infoLines.push(`• Chipset: ${input.chipset || "Bilinmiyor"}`);
    base.infoLines.push(`• Soket: ${p.socket}`);
    base.infoLines.push(`• RAM: ${p.ram}`);
    base.infoLines.push(`• Seviye: ${p.level === "entry" ? "Giriş" : p.level === "mid" ? "Orta" : "Üst"}`);

    // VRM/Seviye uyarıları (chipset tabanlı kaba)
    if (p.level === "entry"){
      base.warnings.push("⚠️ Giriş seviye anakart: çok güçlü CPU'lar (Ryzen 9 / i9) verimsiz olabilir (VRM/ısı).");
    }

    // Profil önerileri
    base.profiles.budget = mkProfile(
      p.socket.startsWith("AM") ? "Ryzen 5 3600 / Ryzen 5 5600" : "i5-10400 / i3-12100F",
      input.model,
      p.ram.includes("DDR5") ? "16GB DDR5 6000 (2x8)" : p.ram.includes("DDR4") ? "16GB DDR4 3200 (2x8)" : "16GB DDR3 1600 (2x8)",
      p.level==="entry" ? "RX 580 / GTX 1660S" : "RX 6600 / RTX 3060",
      p.level==="entry" ? "550W 80+ Bronze" : "650W 80+ Bronze"
    );
    base.profiles.balanced = mkProfile(
      p.socket.startsWith("AM") ? (p.socket==="AM5" ? "Ryzen 5 7600" : "Ryzen 5 5600") : (p.socket==="LGA1700" ? "i5-12400F / i5-13400F" : "i5-10400F"),
      input.model,
      p.ram.includes("DDR5") ? "32GB DDR5 6000 (2x16)" : p.ram.includes("DDR4") ? "32GB DDR4 3200 (2x16)" : "16GB DDR3 1600 (2x8)",
      p.socket==="AM5" ? "RX 7700 XT / RTX 4070" : "RX 6700 XT / RTX 3060 Ti",
      "650W 80+ Gold"
    );
    base.profiles.performance = mkProfile(
      p.socket.startsWith("AM") ? (p.socket==="AM5" ? "Ryzen 7 7800X3D" : "Ryzen 7 5800X3D") : (p.socket==="LGA1700" ? "i7-14700K" : "i7-9700K"),
      input.model,
      p.ram.includes("DDR5") ? "32GB DDR5 6000 CL30" : p.ram.includes("DDR4") ? "32GB DDR4 3600" : "16GB DDR3 1866",
      p.socket==="AM5" ? "RTX 4080 Super / RX 7900 XT" : "RTX 4070 Super / RX 7800 XT",
      "750W 80+ Gold"
    );

    // Uyumsuzluk açıklaması
    if (input.chipset && input.chipset.toUpperCase()==="B450"){
      base.warnings.push("❌ DDR5 takılamaz (AM4 = DDR4).");
      base.warnings.push("⚠️ RTX 4070+ takılır ama 'mantıksız' olabilir: PCIe 3.0 + eski platform dengesi.");
    }

    return base;
  }

  if (type === "cpu"){
    base.recognizedTitle = `🧠 CPU Tanındı: ${input.model}`;
    const cls = perfClassFromCpu(input.model);
    base.infoLines.push(`• Sınıf: ${cls === "entry" ? "Giriş" : cls === "mid" ? "Orta" : "Üst"}`);
    // Socket tahmini (çok kaba)
    const q = norm(input.model);
    let platformHint = null;
    if (q.includes("i3-12") || q.includes("i5-12") || q.includes("i7-12") || q.includes("i9-12") || q.includes("i3-13") || q.includes("i5-13") || q.includes("i7-13") || q.includes("i9-13") || q.includes("i3-14") || q.includes("i5-14") || q.includes("i7-14") || q.includes("i9-14")){
      platformHint = { socket:"LGA1700", mobo: cls==="entry" ? "H610/B660" : cls==="mid" ? "B660/B760" : "Z690/Z790", ram:"DDR4/DDR5" };
    } else if (q.includes("i5-10") || q.includes("i7-10") || q.includes("i9-10") || q.includes("i5-11") || q.includes("i7-11") || q.includes("i9-11")){
      platformHint = { socket:"LGA1200", mobo: cls==="entry" ? "B460/H410" : "B560/Z590", ram:"DDR4" };
    } else if (q.includes("2600") || q.includes("2500") || q.includes("2100")){
      platformHint = { socket:"LGA1155", mobo:"Z77/H77/P67", ram:"DDR3" };
    } else if (q.includes("ryzen")){
      if (q.match(/\b(7|8|9)\d{3,4}\b/) || q.includes("7600") || q.includes("7700") || q.includes("7950") || q.includes("9700") || q.includes("9950")){
        platformHint = { socket:"AM5", mobo:"B650/X670", ram:"DDR5" };
      } else {
        platformHint = { socket:"AM4", mobo:"B450/B550/X570", ram:"DDR4" };
      }
    } else if (q.includes("fx-")){
      platformHint = { socket:"AM3+", mobo:"970/990FX", ram:"DDR3" };
    }

    if (platformHint){
      base.infoLines.push(`• Soket Tahmini: ${platformHint.socket}`);
      base.infoLines.push(`• Önerilen Chipset: ${platformHint.mobo}`);
      base.infoLines.push(`• RAM: ${platformHint.ram}`);
    }

    // Profil önerileri (GPU + PSU)
    base.profiles.budget = mkProfile(
      input.model,
      platformHint ? platformHint.mobo : "Uygun chipset",
      platformHint?.ram?.includes("DDR5") ? "16GB DDR5 6000" : platformHint?.ram?.includes("DDR4") ? "16GB DDR4 3200" : "16GB DDR3 1600",
      cls==="entry" ? "RX 580 / GTX 1660S" : "RX 6600 / RTX 3060",
      cls==="entry" ? "550W Bronze" : "650W Bronze"
    );
    base.profiles.balanced = mkProfile(
      input.model,
      platformHint ? platformHint.mobo : "Uygun chipset",
      platformHint?.ram?.includes("DDR5") ? "32GB DDR5 6000" : platformHint?.ram?.includes("DDR4") ? "32GB DDR4 3200" : "16GB DDR3 1600",
      cls==="high" ? "RTX 4070 Super / RX 7800 XT" : "RX 6700 XT / RTX 3060 Ti",
      "650W Gold"
    );
    base.profiles.performance = mkProfile(
      input.model,
      platformHint ? platformHint.mobo : "Uygun chipset",
      platformHint?.ram?.includes("DDR5") ? "32GB DDR5 6000 CL30" : platformHint?.ram?.includes("DDR4") ? "32GB DDR4 3600" : "16GB DDR3 1866",
      cls==="high" ? "RTX 4080 Super / RX 7900 XT" : "RTX 4070 / RX 7800 XT",
      "750W Gold"
    );

    // Uyumsuzluk / darboğaz uyarısı
    if (q.includes("i7-2600") || q.includes("i5-2500") || q.includes("i3-2100")){
      base.warnings.push("⚠️ Çok eski platform: modern ekran kartlarında ciddi darboğaz olabilir.");
      base.warnings.push("❌ DDR4/DDR5 uymaz (LGA1155 = DDR3).");
    }
    return base;
  }

  if (type === "gpu"){
    base.recognizedTitle = `🎮 GPU Tanındı: ${input.model}`;
    const cls = perfClassFromGpu(input.model);
    base.infoLines.push(`• Sınıf: ${cls === "entry" ? "Giriş" : cls === "mid" ? "Orta" : cls === "high" ? "Üst" : "Extreme"}`);

    // CPU önerileri (sınıfa göre)
    const cpuBudget = cls==="entry" ? "i3-12100F / Ryzen 5 3600" : cls==="mid" ? "Ryzen 5 5600 / i5-12400F" : "Ryzen 7 7800X3D / i7-14700K";
    const cpuBalanced = cls==="entry" ? "Ryzen 5 5600 / i5-12400F" : cls==="mid" ? "Ryzen 7 5700X / i5-13400F" : "Ryzen 7 7800X3D / i7-14700K";
    const cpuPerf = cls==="entry" ? "Ryzen 5 7600 / i5-13600K" : cls==="mid" ? "Ryzen 7 7800X3D / i5-14600K" : "Ryzen 9 7950X / i9-14900K";

    // Platform önerisi (DDR4/DDR5)
    const moboBudget = (cls==="entry"||cls==="mid") ? "B450/B550 (AM4) veya H610/B660 (LGA1700)" : "B650 (AM5) veya Z790 (LGA1700)";
    const ramBudget = (cls==="entry"||cls==="mid") ? "16GB DDR4 3200 (2x8)" : "32GB DDR5 6000 (2x16)";

    // PSU önerisi
    let psu = "650W 80+ Bronze";
    if (cls==="entry") psu = "550W 80+ Bronze";
    if (cls==="high") psu = "750W 80+ Gold";
    if (cls==="extreme") psu = "850W+ 80+ Gold";

    base.profiles.budget = mkProfile(cpuBudget, moboBudget, ramBudget, input.model, psu);
    base.profiles.balanced = mkProfile(cpuBalanced, moboBudget, cls==="entry" ? "32GB DDR4 3200" : "32GB DDR5 6000", input.model, psu);
    base.profiles.performance = mkProfile(cpuPerf, "B650E/X670E veya Z790 (kaliteli VRM)", "32GB DDR5 6000 CL30", input.model, psu);

    // Uyarılar
    if (cls==="high" || cls==="extreme"){
      base.warnings.push("⚠️ Güçlü GPU: zayıf CPU ile darboğaz olur. CPU'yu da yükselt.");
      base.warnings.push("⚠️ PSU kalitesi önemli (80+ Gold + bilinen marka önerilir).");
    }
    return base;
  }

  if (type === "ram"){
    base.recognizedTitle = `💾 RAM Tanındı: ${input.model}`;
    base.infoLines.push(`• Tip: ${input.ddr || "DDR?"}`);
    if (input.size) base.infoLines.push(`• Kapasite: ${input.size}GB`);
    if (input.mhz) base.infoLines.push(`• Hız: ${input.mhz} MHz (yaklaşık)`);
    const ddr = input.ddr || "DDR4";

    // Platform önerisi
    let plat = ddr==="DDR5" ? "AM5 (B650/X670) veya LGA1700 (B760/Z790 DDR5)" :
               ddr==="DDR4" ? "AM4 (B450/B550) veya LGA1700 (H610/B660 DDR4)" :
               ddr==="DDR3" ? "LGA1155/LGA1150 veya AM3+ (eski sistem)" : "Eski sistem";

    base.profiles.budget = mkProfile(
      ddr==="DDR5" ? "Ryzen 5 7600" : ddr==="DDR4" ? "Ryzen 5 5600 / i3-12100F" : "i7-2600 / i5-4570",
      plat,
      ddr==="DDR5" ? "16GB DDR5 6000" : ddr==="DDR4" ? "16GB DDR4 3200" : "16GB DDR3 1600",
      ddr==="DDR5" ? "RX 7700 XT" : "RX 6600",
      ddr==="DDR5" ? "650W Gold" : "550W Bronze"
    );
    base.profiles.balanced = mkProfile(
      ddr==="DDR5" ? "Ryzen 7 7800X3D / i5-14600K" : ddr==="DDR4" ? "Ryzen 5 5600 / i5-12400F" : "i7-4790K",
      plat,
      ddr==="DDR5" ? "32GB DDR5 6000" : ddr==="DDR4" ? "32GB DDR4 3200" : "16GB DDR3 1600",
      ddr==="DDR5" ? "RTX 4070 Super" : "RX 6700 XT",
      "650W Gold"
    );
    base.profiles.performance = mkProfile(
      ddr==="DDR5" ? "Ryzen 9 7950X / i9-14900K" : ddr==="DDR4" ? "Ryzen 7 5800X3D / i7-13700K" : "i7-4790K",
      ddr==="DDR5" ? "X670E/Z790" : ddr==="DDR4" ? "B550/X570 veya Z790 DDR4" : "Z97",
      ddr==="DDR5" ? "32GB DDR5 6000 CL30" : ddr==="DDR4" ? "32GB DDR4 3600" : "16GB DDR3 1866",
      ddr==="DDR5" ? "RTX 4080 Super" : "RTX 4070",
      "750W Gold"
    );

    if (ddr==="DDR3"){
      base.warnings.push("⚠️ DDR3 platform eski: sıfır almak mantıksız, 2. el daha mantıklı.");
    }
    if (ddr==="DDR5"){
      base.warnings.push("❌ DDR5, AM4/B450 gibi DDR4 platformlarda çalışmaz.");
    }
    return base;
  }

  if (type === "psu"){
    base.recognizedTitle = `⚡ PSU Tanındı: ${input.model}`;
    base.infoLines.push(`• Güç: ${input.watts}W`);
    if (input.watts < 500) base.warnings.push("⚠️ 500W altı: ekran kartı yükseltmede çok sınırlayıcı olabilir.");

    const w = input.watts;
    const maxCls = w < 550 ? "entry" : w < 650 ? "mid" : w < 750 ? "high" : "extreme";
    base.infoLines.push(`• Yaklaşık GPU Sınırı: ${maxCls === "entry" ? "Giriş" : maxCls === "mid" ? "Orta" : maxCls === "high" ? "Üst" : "Extreme"}`);

    base.profiles.budget = mkProfile("Ryzen 5 5600 / i3-12100F","B450/B550 veya H610","16GB DDR4 3200", maxCls==="entry" ? "RX 580 / GTX 1660S" : "RX 6600", `${Math.max(450,w)}W 80+ Bronze`);
    base.profiles.balanced = mkProfile("Ryzen 5 7600 / i5-12400F","B650/B760","32GB DDR5 6000", maxCls==="mid" ? "RX 6700 XT / RTX 3060 Ti" : "RTX 4070", `${Math.max(650,w)}W 80+ Gold`);
    base.profiles.performance = mkProfile("Ryzen 7 7800X3D / i7-14700K","X670E/Z790","32GB DDR5 6000 CL30", maxCls==="high" ? "RTX 4080 Super / RX 7900 XT" : "RTX 4090 / RX 7900 XTX", `${Math.max(750,w)}W 80+ Gold`);
    return base;
  }

  // unknown
  base.recognizedTitle = `ℹ️ Parça Tanınamadı: ${input.model}`;
  base.infoLines.push("• Yine de bu arama terimiyle sitelerde arama yapabilirsiniz.");
  base.warnings.push("İpucu: CPU/GPU/anakart/RAM/PSU modelini biraz daha net yaz (örn: 'i5 12400f', 'rx 6700 xt', 'b450', '16gb ddr4 3200', '650w psu').");
  return base;
}

function buildSearchQueriesFor(part, profilePack){
  // Kullanıcı için: kopyala-ara listesi (2.el/sıfır seçimine göre)
  const which = partCondition === "secondhand" ? "ikinci el" : "sıfır";
  const cpuQ = `${profilePack.cpu} ${which}`;
  const mbQ = `${profilePack.mobo} anakart ${which}`;
  const ramQ = `${profilePack.ram} ram ${which}`;
  const gpuQ = `${profilePack.gpu} ekran karti ${which}`;
  const psuQ = `${profilePack.psu} psu ${which}`;
  return [cpuQ, mbQ, ramQ, gpuQ, psuQ];
}

function renderBuildCard(query){
  const detected = detectPart(query);
  const rec = recommendBuild(detected);

  // Profil seçimi
  const activeProfile = BUILD_PROFILES.find(p => p.key === buildProfile) || BUILD_PROFILES[1];
  const pack = rec.profiles[activeProfile.key] || rec.profiles.balanced;

  const queries = pack ? buildSearchQueriesFor(detected, pack) : [];

  const chipsHtml = `
    <div class="pcChipsRow">
      <div class="pcChipGroup">
        ${BUILD_PROFILES.map(p => `
          <button class="pcChip ${p.key===activeProfile.key ? 'active' : ''}" onclick="setBuildProfile('${p.key}')">${p.label}</button>
        `).join("")}
      </div>
      <div class="pcChipGroup">
        <button class="pcChip ${partCondition==='secondhand' ? 'active' : ''}" onclick="setPartCondition('secondhand')">🔄 2. El</button>
        <button class="pcChip ${partCondition==='new' ? 'active' : ''}" onclick="setPartCondition('new')">🛍️ Sıfır</button>
      </div>
    </div>
  `;

  const why = rec.warnings && rec.warnings.length ? `
    <div class="pcWarn">
      ${rec.warnings.map(w => `<div class="pcWarnItem">${escapeHtml(w)}</div>`).join("")}
    </div>
  ` : "";

  const info = rec.infoLines && rec.infoLines.length ? `
    <div class="pcMeta">
      ${rec.infoLines.map(l => `<div class="pcMetaLine">${escapeHtml(l)}</div>`).join("")}
    </div>
  ` : "";

  const build = pack ? `
    <div class="pcBuildGrid">
      <div class="pcBuildItem"><span class="k">CPU</span><span class="v">${escapeHtml(pack.cpu)}</span></div>
      <div class="pcBuildItem"><span class="k">Anakart</span><span class="v">${escapeHtml(pack.mobo)}</span></div>
      <div class="pcBuildItem"><span class="k">RAM</span><span class="v">${escapeHtml(pack.ram)}</span></div>
      <div class="pcBuildItem"><span class="k">GPU</span><span class="v">${escapeHtml(pack.gpu)}</span></div>
      <div class="pcBuildItem"><span class="k">PSU</span><span class="v">${escapeHtml(pack.psu)}</span></div>
    </div>
  ` : "";

  const copyBlock = queries.length ? `
    <div class="pcCopyWrap">
      <div class="pcCopyTitle">📋 Kopyala & Ara (${partCondition==='secondhand' ? '2. el' : 'sıfır'})</div>
      <div class="pcCopyList">
        ${queries.map(q => `
          <div class="pcCopyRow">
            <div class="pcCopyText">${escapeHtml(q)}</div>
            <button class="pcCopyBtn" onclick="copyToClipboard('${escapeJs(q)}')">⧉</button>
          </div>
        `).join("")}
      </div>
    </div>
  ` : "";

  return `
    <div class="siteCard buildCard">
      <div class="buildHeader">
        <div class="buildTitle">${escapeHtml(rec.recognizedTitle || "PC Toplama Önerisi")}</div>
        <div class="buildSub">Kural tabanlı uyumluluk + 3 profil (AI yok)</div>
      </div>
      ${chipsHtml}
      ${info}
      ${build}
      ${why}
      ${copyBlock}
    </div>
  `;
}

function escapeHtml(s){
  return String(s||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}
function escapeJs(s){
  return String(s||"")
    .replace(/\\/g,"\\\\")
    .replace(/'/g,"\\'")
    .replace(/\n/g," ");
}
// global
window.setBuildProfile = setBuildProfile;
window.setPartCondition = setPartCondition;


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
  let html = renderBuildCard(query) || '';
  // Site kartları aşağıya eklenecek

  
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

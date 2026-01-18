/* fps-engine.js — FULL OFFLINE FPS ENGINE (Expanded, 2025–2026)
   - Global: window.FPSEngine.calculateFPS(params)
   - params: {gpu, cpu, ramGB, mbTag, psuTag}
*/
(function(){
  const GPU_FPS = {
    // DDR3 GPU'lar EKLENDİ
    "GTX 1050 Ti": { "1080p": 35, "1440p": 22, "4k": 12 },
    "GTX 1060 3GB": { "1080p": 45, "1440p": 28, "4k": 15 },
    "GTX 1060 6GB": { "1080p": 55, "1440p": 35, "4k": 18 },
    "GTX 1070": { "1080p": 70, "1440p": 45, "4k": 24 },
    "GTX 1080": { "1080p": 80, "1440p": 52, "4k": 28 },
    "GTX 1080 Ti": { "1080p": 95, "1440p": 65, "4k": 35 },
    
    "GTX 1650": { "1080p": 50, "1440p": 30, "4k": 15 },
    "GTX 1650 Super": { "1080p": 55, "1440p": 33, "4k": 17 },
    "GTX 1660": { "1080p": 65, "1440p": 42, "4k": 22 },
    "GTX 1660 Super": { "1080p": 70, "1440p": 45, "4k": 24 },
    "GTX 1660 Ti": { "1080p": 72, "1440p": 46, "4k": 25 },

    "RTX 2060": { "1080p": 75, "1440p": 50, "4k": 28 },
    "RTX 2060 Super": { "1080p": 82, "1440p": 55, "4k": 30 },
    "RTX 2070": { "1080p": 85, "1440p": 58, "4k": 32 },
    "RTX 2070 Super": { "1080p": 92, "1440p": 62, "4k": 35 },
    "RTX 2080": { "1080p": 98, "1440p": 68, "4k": 38 },
    "RTX 2080 Super": { "1080p": 105,"1440p": 72, "4k": 40 },
    "RTX 2080 Ti": { "1080p": 112,"1440p": 78, "4k": 44 },

    "RTX 3050": { "1080p": 70, "1440p": 45, "4k": 25 },
    "RTX 3060": { "1080p": 90, "1440p": 60, "4k": 34 },
    "RTX 3060 Ti": { "1080p": 110,"1440p": 75, "4k": 43 },
    "RTX 3070": { "1080p": 120,"1440p": 85, "4k": 50 },
    "RTX 3070 Ti": { "1080p": 128,"1440p": 90, "4k": 53 },
    "RTX 3080": { "1080p": 145,"1440p": 105,"4k": 62 },
    "RTX 3080 Ti": { "1080p": 155,"1440p": 112,"4k": 68 },
    "RTX 3090": { "1080p": 160,"1440p": 115,"4k": 70 },
    "RTX 3090 Ti": { "1080p": 170,"1440p": 122,"4k": 74 },

    "RTX 4060": { "1080p": 105,"1440p": 70, "4k": 40 },
    "RTX 4060 Ti": { "1080p": 120,"1440p": 82, "4k": 48 },
    "RTX 4070": { "1080p": 150,"1440p": 110,"4k": 65 },
    "RTX 4070 Super": { "1080p": 160,"1440p": 118,"4k": 70 },
    "RTX 4070 Ti": { "1080p": 175,"1440p": 130,"4k": 78 },
    "RTX 4070 Ti Super": { "1080p": 185,"1440p": 138,"4k": 82 },
    "RTX 4080": { "1080p": 205,"1440p": 155,"4k": 92 },
    "RTX 4080 Super": { "1080p": 212,"1440p": 160,"4k": 95 },
    "RTX 4090": { "1080p": 240,"1440p": 185,"4k": 115 },

    // AMD DDR3 GPU'lar EKLENDİ
    "RX 550": { "1080p": 25, "1440p": 15, "4k": 8 },
    "RX 560": { "1080p": 35, "1440p": 22, "4k": 12 },
    "RX 570": { "1080p": 48, "1440p": 30, "4k": 15 },
    "RX 580": { "1080p": 55, "1440p": 35, "4k": 18 },
    "RX 590": { "1080p": 58, "1440p": 37, "4k": 19 },
    
    "HD 7870": { "1080p": 30, "1440p": 18, "4k": 10 },
    "HD 7950": { "1080p": 35, "1440p": 22, "4k": 12 },
    "HD 7970": { "1080p": 40, "1440p": 25, "4k": 13 },
    
    "R7 370": { "1080p": 28, "1440p": 17, "4k": 9 },
    "R9 380": { "1080p": 45, "1440p": 28, "4k": 15 },
    "R9 380X": { "1080p": 48, "1440p": 30, "4k": 16 },
    "R9 390": { "1080p": 55, "1440p": 35, "4k": 18 },
    "R9 390X": { "1080p": 60, "1440p": 38, "4k": 20 },

    "Vega 56": { "1080p": 78, "1440p": 52, "4k": 28 },
    "Vega 64": { "1080p": 85, "1440p": 58, "4k": 32 },

    "RX 5500 XT": { "1080p": 60, "1440p": 38, "4k": 20 },
    "RX 5600 XT": { "1080p": 85, "1440p": 55, "4k": 30 },
    "RX 5700": { "1080p": 95, "1440p": 65, "4k": 36 },
    "RX 5700 XT": { "1080p": 105,"1440p": 72, "4k": 40 },

    "RX 6400": { "1080p": 52, "1440p": 30, "4k": 15 },
    "RX 6500 XT": { "1080p": 55, "1440p": 32, "4k": 16 },
    "RX 6600": { "1080p": 95, "1440p": 65, "4k": 35 },
    "RX 6600 XT": { "1080p": 108,"1440p": 75, "4k": 42 },
    "RX 6650 XT": { "1080p": 112,"1440p": 78, "4k": 44 },
    "RX 6700 XT": { "1080p": 130,"1440p": 90, "4k": 55 },
    "RX 6750 XT": { "1080p": 138,"1440p": 95, "4k": 58 },
    "RX 6800": { "1080p": 150,"1440p": 108,"4k": 66 },
    "RX 6800 XT": { "1080p": 165,"1440p": 120,"4k": 74 },
    "RX 6900 XT": { "1080p": 175,"1440p": 128,"4k": 78 },
    "RX 6950 XT": { "1080p": 182,"1440p": 134,"4k": 82 },

    "RX 7600": { "1080p": 105,"1440p": 70, "4k": 40 },
    "RX 7700 XT": { "1080p": 150,"1440p": 108,"4k": 66 },
    "RX 7800 XT": { "1080p": 170,"1440p": 125,"4k": 78 },
    "RX 7900 XT": { "1080p": 205,"1440p": 155,"4k": 95 },
    "RX 7900 XTX": { "1080p": 225,"1440p": 170,"4k": 105 }
  };

  const CPU_SCALING = {
    // DDR3 CPU'lar EKLENDİ
    "i3-2100": 0.60,
    "i3-3220": 0.65,
    "i3-4160": 0.70,
    
    "i5-2400": 0.65,
    "i5-2500K": 0.68,
    "i5-3470": 0.70,
    "i5-3570K": 0.72,
    "i5-4570": 0.75,
    "i5-4590": 0.76,
    "i5-4670K": 0.78,
    "i5-4690K": 0.80,
    
    "i7-2600K": 0.70,
    "i7-2700K": 0.72,
    "i7-3770K": 0.75,
    "i7-4770K": 0.78,
    "i7-4790K": 0.82,
    
    "FX-4300": 0.55,
    "FX-6300": 0.60,
    "FX-8320": 0.65,
    "FX-8350": 0.68,
    "FX-9370": 0.70,
    "FX-9590": 0.72,
    
    "Phenom II X4 955": 0.50,
    "Phenom II X6 1090T": 0.55,
    "Athlon II X4 640": 0.48,
    
    // Modern CPU'lar
    "i3-8100": 0.82, "i5-8400": 0.88, "i7-8700": 0.92,
    "i3-9100F": 0.84,"i5-9400F": 0.90,"i7-9700K": 0.96,
    "i3-10100": 0.90,"i5-10400F": 0.95,"i5-10600K": 0.97,"i7-10700K": 1.00,
    "i3-10100F": 0.90,
    "i5-10400": 0.95,
    "i3-12100F": 1.00, "i5-12400F": 1.05, "i5-13400F": 1.08, "i5-13600K": 1.12,
    "i3-12100": 1.00,
    "i5-14400F": 1.07, "i5-14600K": 1.13,
    "i7-12700K": 1.12, "i7-13700K": 1.16, "i7-14700K": 1.18,
    "i9-12900K": 1.15, "i9-13900K": 1.20, "i9-14900K": 1.22,

    "Ryzen 5 2600": 0.88, "Ryzen 5 3600": 0.95, "Ryzen 7 3700X": 0.98,
    "Ryzen 3 3300X": 0.94,
    "Ryzen 5 5600": 1.05, "Ryzen 5 5600X": 1.06, "Ryzen 7 5700X": 1.08,
    "Ryzen 7 5800X3D": 1.15, "Ryzen 9 5900X": 1.12,
    "Ryzen 5 7600": 1.12, "Ryzen 7 7700": 1.14, "Ryzen 7 7800X3D": 1.20,
    "Ryzen 9 7900": 1.16, "Ryzen 9 7950X": 1.20
  };

  const RAM_SCALING = { 4: 0.80, 8: 0.90, 12: 0.95, 16: 1.00, 24: 1.01, 32: 1.02, 64: 1.03 };
  const MB_PENALTY = { ok: 0.0, pcie3_limit: -0.05, weak_vrm: -0.08 };
  const PSU_PENALTY = { good: 0.0, borderline: -0.07, insufficient: -0.15 };

  function firstToken(s){
    if(!s) return null;
    return String(s).split("/")[0].trim();
  }
  function simp(s){
    return firstToken(s).toLowerCase().replace(/\s+/g," ").replace(/™/g,"").trim();
  }

  const GPU_ALIASES = {
    // DDR3 GPU Alias'ları EKLENDİ
    "gtx1050ti":"GTX 1050 Ti", "gtx 1050ti":"GTX 1050 Ti", "gtx 1050 ti":"GTX 1050 Ti",
    "gtx1060":"GTX 1060 6GB", "gtx 1060":"GTX 1060 6GB", "gtx1060 6gb":"GTX 1060 6GB", "gtx 1060 6gb":"GTX 1060 6GB",
    "gtx1060 3gb":"GTX 1060 3GB", "gtx 1060 3gb":"GTX 1060 3GB",
    "gtx1070":"GTX 1070", "gtx 1070":"GTX 1070",
    "gtx1080":"GTX 1080", "gtx 1080":"GTX 1080",
    "gtx1080ti":"GTX 1080 Ti", "gtx 1080ti":"GTX 1080 Ti", "gtx 1080 ti":"GTX 1080 Ti",
    
    "rx580":"RX 580", "rx 580":"RX 580",
    "rx570":"RX 570", "rx 570":"RX 570",
    "rx560":"RX 560", "rx 560":"RX 560",
    "rx550":"RX 550", "rx 550":"RX 550",
    
    "hd7970":"HD 7970", "hd 7970":"HD 7970",
    "hd7950":"HD 7950", "hd 7950":"HD 7950",
    "hd7870":"HD 7870", "hd 7870":"HD 7870",
    
    "r9 380":"R9 380", "r9380":"R9 380",
    "r9 390":"R9 390", "r9390":"R9 390",
    
    // Modern GPU'lar
    "rtx3060ti":"RTX 3060 Ti", "rtx 3060ti":"RTX 3060 Ti", "rtx 3060 ti":"RTX 3060 Ti",
    "rtx3070ti":"RTX 3070 Ti", "rtx 3070ti":"RTX 3070 Ti",
    "rtx4060ti":"RTX 4060 Ti", "rtx 4060ti":"RTX 4060 Ti",
    "rtx4070super":"RTX 4070 Super", "rtx 4070 super":"RTX 4070 Super",
    "rtx4080super":"RTX 4080 Super", "rtx 4080 super":"RTX 4080 Super",
    "rx6600xt":"RX 6600 XT", "rx 6600xt":"RX 6600 XT",
    "rx6650xt":"RX 6650 XT", "rx 6650xt":"RX 6650 XT",
    "rx6750xt":"RX 6750 XT", "rx 6750xt":"RX 6750 XT",
    "rx6800xt":"RX 6800 XT", "rx 6800xt":"RX 6800 XT",
    "rx7900xtx":"RX 7900 XTX", "rx 7900xtx":"RX 7900 XTX"
  };

  function resolveGPU(label){
    const raw = firstToken(label);
    if(!raw) return null;
    
    // Önce aliases kontrolü
    const s = simp(raw);
    if(GPU_ALIASES[s]) return GPU_ALIASES[s];
    
    // GPU_FPS'te direkt var mı?
    if(GPU_FPS[raw]) return raw;
    
    // DDR3 GPU'lar için özel eşleme
    if(s.includes("gtx 1050 ti") || s.includes("1050ti")) return "GTX 1050 Ti";
    if(s.includes("gtx 1060") && s.includes("3gb")) return "GTX 1060 3GB";
    if(s.includes("gtx 1060")) return "GTX 1060 6GB";
    if(s.includes("gtx 1070")) return "GTX 1070";
    if(s.includes("gtx 1080 ti") || s.includes("1080ti")) return "GTX 1080 Ti";
    if(s.includes("gtx 1080")) return "GTX 1080";
    
    if(s.includes("rx 580")) return "RX 580";
    if(s.includes("rx 570")) return "RX 570";
    if(s.includes("rx 560")) return "RX 560";
    if(s.includes("rx 550")) return "RX 550";
    
    if(s.includes("hd 7970")) return "HD 7970";
    if(s.includes("hd 7950")) return "HD 7950";
    if(s.includes("hd 7870")) return "HD 7870";
    
    if(s.includes("r9 380")) return "R9 380";
    if(s.includes("r9 390")) return "R9 390";
    
    const m1 = s.match(/rtx\s*(\d{4})(\s*ti\s*super|\s*ti|\s*super)?/);
    if(m1){
      const num = m1[1];
      const suf = (m1[2]||"").replace(/\s+/g," ").trim();
      let name = `RTX ${num}`;
      if(suf === "ti") name += " Ti";
      else if(suf === "super") name += " Super";
      else if(suf === "ti super") name += " Ti Super";
      if(GPU_FPS[name]) return name;
    }

    const m2 = s.match(/rx\s*(\d{4,5})(\s*xtx|\s*xt)?/);
    if(m2){
      const num = m2[1];
      const suf = (m2[2]||"").replace(/\s+/g," ").trim();
      let name = `RX ${num}`;
      if(suf === "xt") name += " XT";
      else if(suf === "xtx") name += " XTX";
      if(GPU_FPS[name]) return name;
    }

    // fallback heuristics
    if(s.includes("4090")) return "RTX 4090";
    if(s.includes("4080")) return "RTX 4080";
    if(s.includes("4070")) return "RTX 4070";
    if(s.includes("4060")) return "RTX 4060";
    if(s.includes("3090")) return "RTX 3090";
    if(s.includes("3080")) return "RTX 3080";
    if(s.includes("3070")) return "RTX 3070";
    if(s.includes("3060")) return "RTX 3060";
    if(s.includes("3050")) return "RTX 3050";
    if(s.includes("2080")) return "RTX 2080";
    if(s.includes("2070")) return "RTX 2070";
    if(s.includes("2060")) return "RTX 2060";
    if(s.includes("1660")) return "GTX 1660 Super";
    if(s.includes("1650")) return "GTX 1650";
    if(s.includes("580")) return "RX 580";
    if(s.includes("570")) return "RX 570";

    if(s.includes("7900")) return "RX 7900 XT";
    if(s.includes("7800")) return "RX 7800 XT";
    if(s.includes("7700")) return "RX 7700 XT";
    if(s.includes("7600")) return "RX 7600";
    if(s.includes("6950")) return "RX 6950 XT";
    if(s.includes("6900")) return "RX 6900 XT";
    if(s.includes("6800")) return "RX 6800";
    if(s.includes("6750")) return "RX 6750 XT";
    if(s.includes("6700")) return "RX 6700 XT";
    if(s.includes("6650")) return "RX 6650 XT";
    if(s.includes("6600")) return "RX 6600";
    if(s.includes("6500")) return "RX 6500 XT";
    if(s.includes("5700")) return "RX 5700 XT";
    if(s.includes("5600")) return "RX 5600 XT";
    if(s.includes("5500")) return "RX 5500 XT";

    return null;
  }

  function resolveCPU(label){
    const raw = firstToken(label);
    if(!raw) return null;
    
    // DDR3 CPU'lar için özel eşleme
    const s = simp(raw);
    
    if(s.includes("i3-2100")) return "i3-2100";
    if(s.includes("i3-3220")) return "i3-3220";
    if(s.includes("i3-4160")) return "i3-4160";
    
    if(s.includes("i5-2400")) return "i5-2400";
    if(s.includes("i5-2500k") || s.includes("i5-2500")) return "i5-2500K";
    if(s.includes("i5-3470")) return "i5-3470";
    if(s.includes("i5-3570k") || s.includes("i5-3570")) return "i5-3570K";
    if(s.includes("i5-4570")) return "i5-4570";
    if(s.includes("i5-4590")) return "i5-4590";
    if(s.includes("i5-4670k") || s.includes("i5-4670")) return "i5-4670K";
    if(s.includes("i5-4690k") || s.includes("i5-4690")) return "i5-4690K";
    
    if(s.includes("i7-2600k") || s.includes("i7-2600")) return "i7-2600K";
    if(s.includes("i7-2700k") || s.includes("i7-2700")) return "i7-2700K";
    if(s.includes("i7-3770k") || s.includes("i7-3770")) return "i7-3770K";
    if(s.includes("i7-4770k") || s.includes("i7-4770")) return "i7-4770K";
    if(s.includes("i7-4790k") || s.includes("i7-4790")) return "i7-4790K";
    
    if(s.includes("fx-4300")) return "FX-4300";
    if(s.includes("fx-6300")) return "FX-6300";
    if(s.includes("fx-8320")) return "FX-8320";
    if(s.includes("fx-8350")) return "FX-8350";
    if(s.includes("fx-9370")) return "FX-9370";
    if(s.includes("fx-9590")) return "FX-9590";
    
    if(s.includes("phenom ii x4 955") || s.includes("phenom ii x4")) return "Phenom II X4 955";
    if(s.includes("phenom ii x6 1090t") || s.includes("phenom ii x6")) return "Phenom II X6 1090T";
    if(s.includes("athlon ii x4 640") || s.includes("athlon ii x4")) return "Athlon II X4 640";
    
    if(CPU_SCALING[raw]) return raw;
    
    const im = s.match(/\b(i[3579])\s*[- ]?\s*(\d{4,5})\s*([a-z]{0,2})\b/);
    if(im){
      const fam = im[1];
      const num = im[2];
      const suf = (im[3]||"").toUpperCase();
      const cand = `${fam}-${num}${suf}`.replace(/\s+/g,"");
      const v1 = cand.replace(/^i/,"i");
      if(CPU_SCALING[v1]) return v1;
      const v2 = v1.replace(/K$/,"K");
      if(CPU_SCALING[v2]) return v2;
      const v3 = v1.replace(/F$/,"F");
      if(CPU_SCALING[v3]) return v3;
    }

    const rm = s.match(/\bryzen\s*(\d)\s*(\d{4,5})\s*(x3d|x)?\b/);
    if(rm){
      const tier = rm[1];
      const num = rm[2];
      const suf = (rm[3]||"").toUpperCase();
      let name = `Ryzen ${tier} ${num}`;
      if(suf === "X") name += "X";
      if(suf === "X3D") name += "X3D";
      if(CPU_SCALING[name]) return name;
    }

    // fallback
    if(s.includes("10400")) return "i5-10400F";
    if(s.includes("10100")) return "i3-10100";
    if(s.includes("12400")) return "i5-12400F";
    if(s.includes("12100")) return "i3-12100F";
    if(s.includes("13400")) return "i5-13400F";
    if(s.includes("13600")) return "i5-13600K";
    if(s.includes("14700")) return "i7-14700K";
    if(s.includes("13900")) return "i9-13900K";
    if(s.includes("14900")) return "i9-14900K";
    if(s.includes("5800x3d")) return "Ryzen 7 5800X3D";
    if(s.includes("5600x")) return "Ryzen 5 5600X";
    if(s.includes("5600")) return "Ryzen 5 5600";
    if(s.includes("7600")) return "Ryzen 5 7600";
    if(s.includes("7800x3d")) return "Ryzen 7 7800X3D";

    return raw || null;
  }

  function parseRamGB(input){
    if(input == null) return 16;
    if(typeof input === "number") return input;
    const s = String(input).toLowerCase();
    
    // DDR3 için 8GB default
    if(s.includes("ddr3")) return 8;
    
    let m = s.match(/(\d+)\s*(x|\*)\s*(\d+)\s*gb/);
    if(m){
      const a = parseInt(m[1],10);
      const b = parseInt(m[3],10);
      if(Number.isFinite(a) && Number.isFinite(b)) return a*b;
    }
    
    m = s.match(/(\d+)\s*gb/);
    if(m){
      const n = parseInt(m[1],10);
      if(Number.isFinite(n)) return n;
    }
    return 16;
  }

  function clampPenalty(map, key){
    return map[key] ?? 0.0;
  }

  function calc(params){
    const gpuR = resolveGPU(params?.gpu);
    const cpuR = resolveCPU(params?.cpu);
    
    console.log("FPS Engine - Resolved:", { gpuR, cpuR, params });
    
    if(!gpuR || !cpuR) {
      console.warn("FPS Engine - Missing GPU or CPU:", { gpuR, cpuR });
      return null;
    }
    
    const ramGB = parseRamGB(params?.ramGB ?? params?.ram);
    const ramMul = RAM_SCALING[ramGB] ?? (ramGB >= 32 ? 1.02 : (ramGB >= 16 ? 1.00 : 0.90));
    const mbMul = 1 + clampPenalty(MB_PENALTY, params?.mbTag || "ok");
    const psuMul = 1 + clampPenalty(PSU_PENALTY, params?.psuTag || "good");
    
    const base = GPU_FPS[gpuR];
    if(!base) {
      console.warn("FPS Engine - GPU not found in DB:", gpuR);
      return null;
    }
    
    const cpuMul = CPU_SCALING[cpuR] ?? 1.0;
    
    const result = {
      gpuResolved: gpuR,
      cpuResolved: cpuR,
      ramGB,
      "1080p": Math.max(5, Math.round(base["1080p"] * cpuMul * ramMul * mbMul * psuMul)),
      "1440p": Math.max(5, Math.round(base["1440p"] * cpuMul * ramMul * mbMul * psuMul)),
      "4k":    Math.max(5, Math.round(base["4k"]    * cpuMul * ramMul * mbMul * psuMul))
    };
    
    console.log("FPS Engine - Calculated:", result);
    return result;
  }

  window.FPSEngine = {
    calculateFPS: calc,
    _debug: { GPU_FPS, CPU_SCALING }
  };
  
  console.log("✅ FPS Engine loaded successfully");
})();

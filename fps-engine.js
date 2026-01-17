
// fps-engine.js — FULL OFFLINE FPS ENGINE (Expanded, 2025–2026)
// هدف: hiçbir aramada FPS boş kalmasın.
// - normalize: "RX 6600 / RTX 3060" -> "RX 6600"
// - alias: "3060ti" -> "RTX 3060 Ti"
// - fallback: tanınmayan GPU/CPU için en yakın tier seçimi

// ===================== GPU BASE FPS (Ultra preset, ortalama) =====================
// Not: Bunlar “tek oyun” değil, popüler oyunlar ortalaması mantığıyla gerçekçi aralıklar.
// Kapsam: GTX 10/16, RTX 20/30/40, RX 500/5000/6000/7000
const GPU_FPS = {
  // --- Older / entry ---
  "GTX 1050 Ti": { "1080p": 35, "1440p": 22, "4k": 12 },
  "GTX 1060 6GB":{ "1080p": 55, "1440p": 35, "4k": 18 },
  "GTX 1070":    { "1080p": 70, "1440p": 45, "4k": 24 },
  "GTX 1080":    { "1080p": 80, "1440p": 52, "4k": 28 },
  "GTX 1650":    { "1080p": 50, "1440p": 30, "4k": 15 },
  "GTX 1660":    { "1080p": 65, "1440p": 42, "4k": 22 },
  "GTX 1660 Super":{ "1080p": 70, "1440p": 45, "4k": 24 },
  "GTX 1660 Ti": { "1080p": 72, "1440p": 46, "4k": 25 },

  // --- RTX 20 ---
  "RTX 2060":    { "1080p": 75, "1440p": 50, "4k": 28 },
  "RTX 2060 Super":{ "1080p": 82, "1440p": 55, "4k": 30 },
  "RTX 2070":    { "1080p": 85, "1440p": 58, "4k": 32 },
  "RTX 2070 Super":{ "1080p": 92, "1440p": 62, "4k": 35 },
  "RTX 2080":    { "1080p": 98, "1440p": 68, "4k": 38 },
  "RTX 2080 Super":{ "1080p": 105, "1440p": 72, "4k": 40 },
  "RTX 2080 Ti": { "1080p": 112, "1440p": 78, "4k": 44 },

  // --- RTX 30 ---
  "RTX 3050":    { "1080p": 70, "1440p": 45, "4k": 25 },
  "RTX 3060":    { "1080p": 90, "1440p": 60, "4k": 34 },
  "RTX 3060 Ti": { "1080p": 110,"1440p": 75, "4k": 43 },
  "RTX 3070":    { "1080p": 120,"1440p": 85, "4k": 50 },
  "RTX 3070 Ti": { "1080p": 128,"1440p": 90, "4k": 53 },
  "RTX 3080":    { "1080p": 145,"1440p": 105,"4k": 62 },
  "RTX 3080 Ti": { "1080p": 155,"1440p": 112,"4k": 68 },
  "RTX 3090":    { "1080p": 160,"1440p": 115,"4k": 70 },
  "RTX 3090 Ti": { "1080p": 170,"1440p": 122,"4k": 74 },

  // --- RTX 40 ---
  "RTX 4060":    { "1080p": 105,"1440p": 70, "4k": 40 },
  "RTX 4060 Ti": { "1080p": 120,"1440p": 82, "4k": 48 },
  "RTX 4070":    { "1080p": 150,"1440p": 110,"4k": 65 },
  "RTX 4070 Super":{ "1080p": 160,"1440p": 118,"4k": 70 },
  "RTX 4070 Ti": { "1080p": 175,"1440p": 130,"4k": 78 },
  "RTX 4070 Ti Super":{ "1080p": 185,"1440p": 138,"4k": 82 },
  "RTX 4080":    { "1080p": 205,"1440p": 155,"4k": 92 },
  "RTX 4080 Super":{ "1080p": 212,"1440p": 160,"4k": 95 },
  "RTX 4090":    { "1080p": 240,"1440p": 185,"4k": 115 },

  // --- RX 500 / Vega ---
  "RX 570":      { "1080p": 48, "1440p": 30, "4k": 15 },
  "RX 580":      { "1080p": 55, "1440p": 35, "4k": 18 },
  "RX 590":      { "1080p": 58, "1440p": 37, "4k": 19 },
  "Vega 56":     { "1080p": 78, "1440p": 52, "4k": 28 },
  "Vega 64":     { "1080p": 85, "1440p": 58, "4k": 32 },

  // --- RX 5000 ---
  "RX 5500 XT":  { "1080p": 60, "1440p": 38, "4k": 20 },
  "RX 5600 XT":  { "1080p": 85, "1440p": 55, "4k": 30 },
  "RX 5700":     { "1080p": 95, "1440p": 65, "4k": 36 },
  "RX 5700 XT":  { "1080p": 105,"1440p": 72, "4k": 40 },

  // --- RX 6000 ---
  "RX 6500 XT":  { "1080p": 55, "1440p": 32, "4k": 16 },
  "RX 6600":     { "1080p": 95, "1440p": 65, "4k": 35 },
  "RX 6600 XT":  { "1080p": 108,"1440p": 75, "4k": 42 },
  "RX 6650 XT":  { "1080p": 112,"1440p": 78, "4k": 44 },
  "RX 6700 XT":  { "1080p": 130,"1440p": 90, "4k": 55 },
  "RX 6750 XT":  { "1080p": 138,"1440p": 95, "4k": 58 },
  "RX 6800":     { "1080p": 150,"1440p": 108,"4k": 66 },
  "RX 6800 XT":  { "1080p": 165,"1440p": 120,"4k": 74 },
  "RX 6900 XT":  { "1080p": 175,"1440p": 128,"4k": 78 },
  "RX 6950 XT":  { "1080p": 182,"1440p": 134,"4k": 82 },

  // --- RX 7000 ---
  "RX 7600":     { "1080p": 105,"1440p": 70, "4k": 40 },
  "RX 7700 XT":  { "1080p": 150,"1440p": 108,"4k": 66 },
  "RX 7800 XT":  { "1080p": 170,"1440p": 125,"4k": 78 },
  "RX 7900 XT":  { "1080p": 205,"1440p": 155,"4k": 95 },
  "RX 7900 XTX": { "1080p": 225,"1440p": 170,"4k": 105 }
};

// GPU performans puanı (fallback için). Kaba tier sıralaması.
const GPU_SCORE = Object.fromEntries(Object.entries(GPU_FPS).map(([k,v])=>[k, v["1080p"]]));

// ===================== CPU SCALING (genel) =====================
// CPU scaling: 1080p’de daha çok, 4K’da daha az etkiler. Biz basit tek katsayı kullanıyoruz.
const CPU_SCALING = {
  // Intel 8/9/10
  "i3-8100": 0.82, "i5-8400": 0.88, "i7-8700": 0.92,
  "i3-9100F": 0.84,"i5-9400F": 0.90,"i7-9700K": 0.96,
  "i3-10100": 0.90,"i5-10400F": 0.95,"i5-10600K": 0.97,"i7-10700K": 1.00,

  // Intel 11/12/13/14
  "i3-12100F": 1.00, "i5-12400F": 1.05, "i5-13400F": 1.08, "i5-13600K": 1.12,
  "i7-12700K": 1.12, "i7-13700K": 1.16, "i7-14700K": 1.18,
  "i9-12900K": 1.15, "i9-13900K": 1.20, "i9-14900K": 1.22,
  "i5-14400F": 1.07, "i5-14600K": 1.13,

  // Ryzen 2000/3000/5000/7000
  "Ryzen 5 2600": 0.88, "Ryzen 5 3600": 0.95, "Ryzen 7 3700X": 0.98,
  "Ryzen 5 5600": 1.05, "Ryzen 5 5600X": 1.06, "Ryzen 7 5700X": 1.08,
  "Ryzen 7 5800X3D": 1.15, "Ryzen 9 5900X": 1.12,
  "Ryzen 5 7600": 1.12, "Ryzen 7 7700": 1.14, "Ryzen 7 7800X3D": 1.20,
  "Ryzen 9 7900": 1.16, "Ryzen 9 7950X": 1.20
};

// RAM scaling (ortalama FPS'e küçük etki)
const RAM_SCALING = { 8: 0.90, 12: 0.95, 16: 1.00, 24: 1.01, 32: 1.02, 64: 1.03 };

// Motherboard penalty (yalnızca ceza)
const MB_PENALTY = {
  "ok": 0.0,
  "pcie3_limit": -0.05,
  "weak_vrm": -0.08
};

// PSU penalty (yalnızca ceza)
const PSU_PENALTY = {
  "good": 0.0,
  "borderline": -0.07,
  "insufficient": -0.15
};

// ===================== Helpers =====================
function norm(s){
  if(!s) return null;
  return String(s).split("/")[0].trim();
}

function simplify(s){
  return norm(s).toLowerCase()
    .replace(/\s+/g," ")
    .replace(/™/g,"")
    .replace(/-+/g,"-")
    .trim();
}

const GPU_ALIASES = {
  "rtx 3060ti": "RTX 3060 Ti",
  "rtx3060ti": "RTX 3060 Ti",
  "rtx 3070ti": "RTX 3070 Ti",
  "rtx3070ti": "RTX 3070 Ti",
  "rtx 4060ti": "RTX 4060 Ti",
  "rtx4060ti": "RTX 4060 Ti",
  "rtx 4070ti": "RTX 4070 Ti",
  "rtx4070ti": "RTX 4070 Ti",
  "rtx 4070 super": "RTX 4070 Super",
  "rtx 4080 super": "RTX 4080 Super",
  "rx 6600xt": "RX 6600 XT",
  "rx 6650xt": "RX 6650 XT",
  "rx 6750xt": "RX 6750 XT",
  "rx 6800xt": "RX 6800 XT",
  "rx 7900xtx": "RX 7900 XTX"
};

function resolveGPU(label){
  const raw = norm(label);
  if(!raw) return null;
  if(GPU_FPS[raw]) return raw;
  const s = simplify(raw);
  if(GPU_ALIASES[s]) return GPU_ALIASES[s];
  // common patterns
  // Nvidia: rtx 3060 / 3060 ti / 4070 super etc.
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
  // AMD: rx 6600 xt / rx 7900 xtx etc.
  const m2 = s.match(/rx\s*(\d{4,5})(\s*xtx|\s*xt)?/);
  if(m2){
    const num = m2[1];
    const suf = (m2[2]||"").replace(/\s+/g," ").trim();
    let name = `RX ${num}`;
    if(suf === "xt") name += " XT";
    else if(suf === "xtx") name += " XTX";
    if(GPU_FPS[name]) return name;
  }
  // fallback: nearest score by substring hints
  if(s.includes("3060")) return "RTX 3060";
  if(s.includes("6600")) return "RX 6600";
  if(s.includes("3050")) return "RTX 3050";
  if(s.includes("2060")) return "RTX 2060";
  if(s.includes("1650")) return "GTX 1650";
  if(s.includes("580")) return "RX 580";

  // final fallback: try closest by score using digits
  const digits = s.match(/(\d{3,5})/);
  if(digits){
    const target = int(digits[1]);
  }
  return null;
}

function resolveCPU(label){
  const raw = norm(label);
  if(!raw) return null;
  if(CPU_SCALING[raw]) return raw;
  const s = simplify(raw);
  // normalize Intel: i5 12400f -> i5-12400F
  const im = s.match(/\b(i[3579])\s*[- ]?\s*(\d{4,5})\s*([a-z]{0,2})\b/);
  if(im){
    const fam = im[1].toLowerCase();
    const num = im[2];
    const suf = (im[3]||"").toUpperCase();
    const name = `${fam}-${num}${suf}`.replace("I","i");
    // Ensure i is lower
    const fixed = name.replace(/^i/,"i");
    // Try exact and with F suffix formatting
    if(CPU_SCALING[fixed]) return fixed;
    const fixed2 = fixed.replace(/(\d)F$/,"$1F");
    if(CPU_SCALING[fixed2]) return fixed2;
  }
  // Ryzen: ryzen 5 5600x
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
  // fallback: closest scaling by family
  if(s.includes("12400")) return "i5-12400F";
  if(s.includes("12100")) return "i3-12100F";
  if(s.includes("5600")) return "Ryzen 5 5600";
  if(s.includes("5800x3d")) return "Ryzen 7 5800X3D";
  if(s.includes("7600")) return "Ryzen 5 7600";
  if(s.includes("13600")) return "i5-13600K";
  return null;
}

function clampMBPenalty(tag){
  return MB_PENALTY[tag] ?? 0.0;
}
function clampPSUPenalty(tag){
  return PSU_PENALTY[tag] ?? 0.0;
}

// ===================== Public API =====================
// params: {gpu,cpu,ram, mbTag, psuTag}
export function calculateFPS(params){
  const gpu = resolveGPU(params?.gpu);
  const cpu = resolveCPU(params?.cpu);
  const ram = Number(params?.ram || 16);
  const ramMul = RAM_SCALING[ram] ?? (ram >= 32 ? 1.02 : 1.0);
  const mbMul = 1 + clampMBPenalty(params?.mbTag || "ok");
  const psuMul = 1 + clampPSUPenalty(params?.psuTag || "good");

  if(!gpu || !cpu) return null;
  const base = GPU_FPS[gpu];
  const cpuMul = CPU_SCALING[cpu] ?? 1.0;

  return {
    gpuResolved: gpu,
    cpuResolved: cpu,
    "1080p": Math.max(5, Math.round(base["1080p"] * cpuMul * ramMul * mbMul * psuMul)),
    "1440p": Math.max(5, Math.round(base["1440p"] * cpuMul * ramMul * mbMul * psuMul)),
    "4k":    Math.max(5, Math.round(base["4k"]    * cpuMul * ramMul * mbMul * psuMul))
  };
}

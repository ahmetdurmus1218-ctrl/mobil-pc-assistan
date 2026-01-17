/*
  FPS ENGINE (offline / free)

  Base GPU FPS values are taken from Tom's Hardware "GPU Benchmarks Hierarchy 2026"
  rasterization table (1080p Ultra / 1440p Ultra / 4K Ultra FPS shown in parentheses).

  This is an estimator, not a guarantee.
*/

(function(){
  "use strict";

  // Base FPS geometric mean @ Ultra presets.
  // (1080p Ultra, 1440p Ultra, 4K Ultra)
  const GPU_DB = {
    "RTX 4060":         { fps1080: 46.5, fps1440: 29.4, fps4k: 12.8, vram: 8, recoPSU: 450 },
    "RTX 3060 12GB":    { fps1080: 42.7, fps1440: 28.5, fps4k: 14.6, vram: 12, recoPSU: 550 },
    "RTX 4060 Ti 8GB":  { fps1080: 59.3, fps1440: 38.3, fps4k: 15.9, vram: 8, recoPSU: 550 },
    "RTX 5060":         { fps1080: 55.8, fps1440: 32.8, fps4k: 12.6, vram: 8, recoPSU: 500 },
    "RTX 5060 Ti 8GB":  { fps1080: 66.1, fps1440: 37.6, fps4k: 14.5, vram: 8, recoPSU: 550 },
    "RX 7600":          { fps1080: 28.7, fps1440: 16.2, fps4k: 8.1,  vram: 8, recoPSU: 450 },
    "RX 7600 XT":       { fps1080: 40.6, fps1440: 26.9, fps4k: 13.3, vram: 16, recoPSU: 550 },
    "RX 6600":          { fps1080: 27.5, fps1440: 14.5, fps4k: 7.0,  vram: 8, recoPSU: 450 },
    "Arc A770 16GB":    { fps1080: 45.1, fps1440: 32.5, fps4k: 17.3, vram: 16, recoPSU: 650 },
    "Arc A750":         { fps1080: 38.7, fps1440: 26.3, fps4k: 10.8, vram: 8,  recoPSU: 650 },
    "Arc B580":         { fps1080: 58.1, fps1440: 41.0, fps4k: 21.1, vram: 12, recoPSU: 600 },
    "RX 7700 XT":       { fps1080: 64.6, fps1440: 44.6, fps4k: 21.3, vram: 12, recoPSU: 650 }
  };

  // CPU tiers -> index. 1.00 = modern mid-tier baseline.
  const CPU_INDEX = {
    "R7 9800X3D": 1.08,
    "R9 9950X3D": 1.07,
    "R7 7800X3D": 1.06,
    "i9-14900K":  1.05,
    "i7-14700K":  1.03,
    "R7 9700X":   1.02,
    "R5 9600X":   1.00,
    "R5 7600":    0.99,
    "R5 5600":    0.92,
    "i5-12400F":  0.92,
    "i3-12100F":  0.86
  };

  function norm(s){
    return String(s||"").toLowerCase().replace(/\s+/g," ").trim();
  }

  function matchGPU(name){
    const n = norm(name);
    if (!n) return null;
    // direct
    for (const k of Object.keys(GPU_DB)) {
      if (n === norm(k)) return k;
    }
    // contains
    for (const k of Object.keys(GPU_DB)) {
      if (n.includes(norm(k))) return k;
    }
    // loose patterns
    if (n.includes("rtx") && n.includes("4060") && n.includes("ti")) return "RTX 4060 Ti 8GB";
    if (n.includes("rtx") && n.includes("4060")) return "RTX 4060";
    if (n.includes("rtx") && n.includes("3060")) return "RTX 3060 12GB";
    if (n.includes("rx") && n.includes("7700") && n.includes("xt")) return "RX 7700 XT";
    if (n.includes("rx") && n.includes("7600") && n.includes("xt")) return "RX 7600 XT";
    if (n.includes("rx") && n.includes("7600")) return "RX 7600";
    if (n.includes("rx") && n.includes("6600")) return "RX 6600";
    if (n.includes("a770")) return "Arc A770 16GB";
    if (n.includes("a750")) return "Arc A750";
    if (n.includes("b580")) return "Arc B580";
    return null;
  }

  function matchCPU(name){
    const n = norm(name);
    if (!n) return { key: null, index: 0.95 };
    const hit = Object.keys(CPU_INDEX).find(k => n.includes(norm(k)));
    if (hit) return { key: hit, index: CPU_INDEX[hit] };

    // heuristics
    if (n.includes("x3d")) return { key: null, index: 1.05 };
    if (n.match(/i9\-|i9 /)) return { key: null, index: 1.04 };
    if (n.match(/i7\-|i7 /)) return { key: null, index: 1.02 };
    if (n.match(/i5\-|i5 /)) return { key: null, index: 0.96 };
    if (n.match(/ryzen 7|r7/)) return { key: null, index: 1.01 };
    if (n.match(/ryzen 5|r5/)) return { key: null, index: 0.96 };
    return { key: null, index: 0.92 };
  }

  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }

  function cpuFactor(idx, res){
    // more CPU-bound at 1080p, less at 4K
    const w = res === "1080" ? 0.70 : (res === "1440" ? 0.45 : 0.25);
    return (1 - w) + (idx * w);
  }

  function ramFactor(ramGB, ramType){
    const w = [];
    let f = 1.0;
    const gb = Number(ramGB || 0);
    if (gb && gb < 16) { f *= 0.85; w.push("8GB RAM bazı oyunlarda takılma/min FPS düşüşü yapabilir; 16GB önerilir."); }
    if (gb && gb >= 32) f *= 1.02;
    const t = norm(ramType);
    if (t.includes("ddr5")) f *= 1.02;
    return { f, w };
  }

  function psuFactor(psuW, gpuKey){
    const w = [];
    let f = 1.0;
    const need = GPU_DB[gpuKey]?.recoPSU || 450;
    const watt = Number(psuW || 0);
    if (watt && watt < need) {
      f *= 0.70;
      w.push(`PSU ${watt}W, önerilen ${need}W altında: güç limiti/kararsızlık riski.`);
    } else if (watt && watt < need + 50) {
      f *= 0.95;
      w.push(`PSU ${watt}W sınırda; kaliteli model ve pay bırakmak daha iyi.`);
    }
    return { f, w, need };
  }

  function moboFactor(tier){
    const t = norm(tier);
    if (t.includes("high")) return 1.01;
    if (t.includes("mid")) return 1.00;
    if (t.includes("budget")) return 0.98;
    return 1.0;
  }

  function round1(x){ return Math.round(x * 10) / 10; }

  function estimate(build){
    const warnings = [];
    const gpuKey = matchGPU(build?.gpu);
    if (!gpuKey) {
      return {
        ok: false,
        fps1080: null,
        fps1440: null,
        fps4k: null,
        warnings: ["GPU tanınamadı; FPS tahmini için bilinen bir GPU modeli seçin."],
        matched: { gpu: null, cpu: null }
      };
    }

    const base = GPU_DB[gpuKey];
    const cpu = matchCPU(build?.cpu);

    const rf = ramFactor(build?.ramGB, build?.ramType);
    warnings.push(...rf.w);

    const pf = psuFactor(build?.psuWatt, gpuKey);
    warnings.push(...pf.w);

    const mf = moboFactor(build?.moboTier);

    // combine
    const f1080 = cpuFactor(cpu.index, "1080") * rf.f * pf.f * mf;
    const f1440 = cpuFactor(cpu.index, "1440") * rf.f * pf.f * mf;
    const f4k = cpuFactor(cpu.index, "4k") * rf.f * pf.f * mf;

    // VRAM soft warning
    if (base.vram && base.vram <= 8) {
      warnings.push("8GB VRAM yeni oyunlarda 2K/4K'da doku ayarlarında sınıra dayanabilir.");
    }

    return {
      ok: true,
      fps1080: round1(base.fps1080 * f1080),
      fps1440: round1(base.fps1440 * f1440),
      fps4k: round1(base.fps4k * f4k),
      warnings,
      matched: { gpu: gpuKey, cpu: cpu.key }
    };
  }

  window.FPSEngine = { estimate, matchGPU };
})();

// fps-engine.js
// Offline FPS Engine (2025/2026) - Ultra preset ortalama
// Not: Bu motor "tahmini" FPS verir. Canli veri / ucretli API yoktur.

(function(){
  const GPU_FPS = {
    // Eski / giris
    "RX 580":     { "1080p": 55,  "1440p": 35, "4k": 18 },
    "GTX 1650":   { "1080p": 50,  "1440p": 30, "4k": 15 },

    // Orta
    "RX 6600":    { "1080p": 95,  "1440p": 65, "4k": 35 },
    "RTX 3060":   { "1080p": 90,  "1440p": 60, "4k": 34 },

    // Ust
    "RX 6700 XT": { "1080p": 130, "1440p": 90, "4k": 55 },
    "RTX 4070":   { "1080p": 150, "1440p": 110,"4k": 65 }
  };

  // CPU scaling: 1080p en cok etkilenir, 4K en az
  const CPU_SCALING = {
    "Ryzen 3 3300X": 0.95,
    "i3-12100F": 1.00,
    "Ryzen 5 5600": 1.05,
    "i5-12400F": 1.05,
    "Ryzen 7 5800X3D": 1.10,
    "i5-13600K": 1.10
  };

  // RAM scaling: 8GB ceza (min FPS / stutter), 16 ideal
  const RAM_SCALING = {
    8: 0.90,
    16: 1.00,
    32: 1.02
  };

  // Anakart cezasi (dolayli): zayif VRM / pcie limit vb.
  function motherboardPenalty(moboStr, gpuStr){
    const m = (moboStr || "").toLowerCase();
    const g = (gpuStr || "").toLowerCase();

    // H610 gibi giris chipset + guclu GPU'larda minik ceza
    if (m.includes("h610") && (g.includes("4070") || g.includes("6700"))) return -0.04;

    // Eski B450 + guclu GPU -> PCIe/VRM mix
    if (m.includes("b450") && (g.includes("4070") || g.includes("6700"))) return -0.03;

    // Default: ceza yok
    return 0;
  }

  // PSU cezasi: yetersiz watt / sinirda watt
  function psuPenalty(psuWatts, gpuStr){
    const w = Number(psuWatts || 0);
    const g = (gpuStr || "").toLowerCase();

    // GPU sinifina gore tahmini min PSU (tahmini)
    let need = 500;
    if (g.includes("1650") || g.includes("580")) need = 450;
    if (g.includes("6600") || g.includes("3060")) need = 550;
    if (g.includes("6700") || g.includes("4070")) need = 650;

    if (w <= 0) return 0;
    if (w < need) return -0.15;
    if (w < need + 50) return -0.07;
    return 0;
  }

  function clampFloor(v){
    // Koruma: null/NaN vs.
    if (!isFinite(v)) return null;
    return Math.max(1, Math.round(v * 10) / 10);
  }

  function calcResolution(cpuMul, ramMul, mbPen, psuPen, base){
    const mult = cpuMul * ramMul * (1 + mbPen) * (1 + psuPen);
    return clampFloor(base * mult);
  }

  function calculate({ gpu, cpu, ramGB, motherboard, psuWatts }){
    if (!gpu || !cpu) return null;
    if (!GPU_FPS[gpu] || !CPU_SCALING[cpu]) return null;

    const ram = Number(ramGB) || 16;
    const ramMul = RAM_SCALING[ram] || 1.0;

    // CPU mul: 1080p > 1440p > 4k
    const cpuMul1080 = CPU_SCALING[cpu];
    const cpuMul1440 = 1 + (CPU_SCALING[cpu] - 1) * 0.6;
    const cpuMul4k   = 1 + (CPU_SCALING[cpu] - 1) * 0.3;

    const mbPen = motherboardPenalty(motherboard, gpu);
    const psuPen = psuPenalty(psuWatts, gpu);

    return {
      "1080p": calcResolution(cpuMul1080, ramMul, mbPen, psuPen, GPU_FPS[gpu]["1080p"]),
      "1440p": calcResolution(cpuMul1440, ramMul, mbPen, psuPen, GPU_FPS[gpu]["1440p"]),
      "4k":    calcResolution(cpuMul4k,   ramMul, mbPen, psuPen, GPU_FPS[gpu]["4k"]),
      meta: {
        gpu, cpu, ramGB: ram,
        motherboard: motherboard || "",
        psuWatts: Number(psuWatts) || 0,
        penalties: { motherboard: mbPen, psu: psuPen }
      }
    };
  }

  // Global export (classic script)
  window.FPSEngine = {
    GPU_FPS,
    CPU_SCALING,
    RAM_SCALING,
    calculate
  };
})();

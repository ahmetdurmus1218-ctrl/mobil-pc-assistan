// Tüm bileşenlerden FPS parametreleri oluştur - BASİT VERSİYON
function createFPSParamsFromBuild(buildProfile) {
  if (!buildProfile) return null;
  
  console.log("createFPSParamsFromBuild - Input:", buildProfile);
  
  const params = {
    cpu: buildProfile.cpu || '',
    gpu: buildProfile.gpu || '',
    ramGB: 16,
    mbTag: 'ok',
    psuTag: 'good'
  };
  
  // RAM boyutu
  if (buildProfile.ram) {
    const ramText = buildProfile.ram.toLowerCase();
    const ramMatch = ramText.match(/(\d+)\s*gb/i);
    if (ramMatch) {
      params.ramGB = parseInt(ramMatch[1], 10);
    }
  }
  
  // Anakart tipi
  if (buildProfile.mobo) {
    const moboText = buildProfile.mobo.toLowerCase();
    if (moboText.includes('z77') || moboText.includes('z97') || 
        moboText.includes('990fx') || moboText.includes('970')) {
      params.mbTag = 'pcie3_limit';
    }
  }
  
  // PSU tipi
  if (buildProfile.psu) {
    const psuText = buildProfile.psu.toLowerCase();
    if (psuText.includes('450w') || psuText.includes('500w') || 
        psuText.includes('550w') || psuText.includes('bronze')) {
      params.psuTag = 'borderline';
    }
  }
  
  console.log("createFPSParamsFromBuild - Output:", params);
  return params;
}

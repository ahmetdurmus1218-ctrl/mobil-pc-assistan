// typeahead.js - GENİŞLETİLMİŞ OTOMATİK TAMAMLAMA (ENTER DÜZELTMESİ) - TAM VERSİYON

(function(){
  // GENİŞ ÖNERİ VERİTABANI (PC bileşenleri + genel ürünler) - TÜM SERİLER EKLENDİ
  const SUGGESTIONS = [
    // ======== CPU - AMD (TÜM SERİLER) ========
    { label: "Ryzen 3 1200", canonical: "ryzen 3 1200" },
    { label: "Ryzen 3 1300X", canonical: "ryzen 3 1300x" },
    { label: "Ryzen 3 2200G", canonical: "ryzen 3 2200g" },
    { label: "Ryzen 3 3200G", canonical: "ryzen 3 3200g" },
    { label: "Ryzen 3 3300X", canonical: "ryzen 3 3300x" },
    { label: "Ryzen 3 4100", canonical: "ryzen 3 4100" },
    { label: "Ryzen 3 4300G", canonical: "ryzen 3 4300g" },
    { label: "Ryzen 3 5300G", canonical: "ryzen 3 5300g" },
    
    { label: "Ryzen 5 1400", canonical: "ryzen 5 1400" },
    { label: "Ryzen 5 1500X", canonical: "ryzen 5 1500x" },
    { label: "Ryzen 5 1600", canonical: "ryzen 5 1600" },
    { label: "Ryzen 5 1600X", canonical: "ryzen 5 1600x" },
    { label: "Ryzen 5 2400G", canonical: "ryzen 5 2400g" },
    { label: "Ryzen 5 2600", canonical: "ryzen 5 2600" },
    { label: "Ryzen 5 2600X", canonical: "ryzen 5 2600x" },
    { label: "Ryzen 5 3400G", canonical: "ryzen 5 3400g" },
    { label: "Ryzen 5 3500", canonical: "ryzen 5 3500" },
    { label: "Ryzen 5 3500X", canonical: "ryzen 5 3500x" },
    { label: "Ryzen 5 3600", canonical: "ryzen 5 3600" },
    { label: "Ryzen 5 3600X", canonical: "ryzen 5 3600x" },
    { label: "Ryzen 5 5600", canonical: "ryzen 5 5600" },
    { label: "Ryzen 5 5600X", canonical: "ryzen 5 5600x" },
    { label: "Ryzen 5 5600G", canonical: "ryzen 5 5600g" },
    { label: "Ryzen 5 7600", canonical: "ryzen 5 7600" },
    { label: "Ryzen 5 7600X", canonical: "ryzen 5 7600x" },
    
    { label: "Ryzen 7 1700", canonical: "ryzen 7 1700" },
    { label: "Ryzen 7 1700X", canonical: "ryzen 7 1700x" },
    { label: "Ryzen 7 1800X", canonical: "ryzen 7 1800x" },
    { label: "Ryzen 7 2700", canonical: "ryzen 7 2700" },
    { label: "Ryzen 7 2700X", canonical: "ryzen 7 2700x" },
    { label: "Ryzen 7 3700X", canonical: "ryzen 7 3700x" },
    { label: "Ryzen 7 3800X", canonical: "ryzen 7 3800x" },
    { label: "Ryzen 7 5700X", canonical: "ryzen 7 5700x" },
    { label: "Ryzen 7 5800X", canonical: "ryzen 7 5800x" },
    { label: "Ryzen 7 5800X3D", canonical: "ryzen 7 5800x3d" },
    { label: "Ryzen 7 7700", canonical: "ryzen 7 7700" },
    { label: "Ryzen 7 7700X", canonical: "ryzen 7 7700x" },
    { label: "Ryzen 7 7800X3D", canonical: "ryzen 7 7800x3d" },
    
    { label: "Ryzen 9 3900X", canonical: "ryzen 9 3900x" },
    { label: "Ryzen 9 3950X", canonical: "ryzen 9 3950x" },
    { label: "Ryzen 9 5900X", canonical: "ryzen 9 5900x" },
    { label: "Ryzen 9 5950X", canonical: "ryzen 9 5950x" },
    { label: "Ryzen 9 7900", canonical: "ryzen 9 7900" },
    { label: "Ryzen 9 7900X", canonical: "ryzen 9 7900x" },
    { label: "Ryzen 9 7950X", canonical: "ryzen 9 7950x" },
    { label: "Ryzen 9 7950X3D", canonical: "ryzen 9 7950x3d" },
    
    { label: "AMD FX-4100", canonical: "fx 4100" },
    { label: "AMD FX-4300", canonical: "fx 4300" },
    { label: "AMD FX-6300", canonical: "fx 6300" },
    { label: "AMD FX-8320", canonical: "fx 8320" },
    { label: "AMD FX-8350", canonical: "fx 8350" },
    { label: "AMD FX-9370", canonical: "fx 9370" },
    { label: "AMD FX-9590", canonical: "fx 9590" },
    { label: "AMD Athlon 200GE", canonical: "athlon 200ge" },
    { label: "AMD Athlon 3000G", canonical: "athlon 3000g" },
    
    // ======== CPU - Intel ========
    { label: "Intel Celeron G5900", canonical: "celeron g5900" },
    { label: "Intel Pentium Gold G6400", canonical: "pentium gold g6400" },
    { label: "Intel i3-10100", canonical: "i3 10100" },
    { label: "Intel i3-10100F", canonical: "i3 10100f" },
    { label: "Intel i3-12100", canonical: "i3 12100" },
    { label: "Intel i3-12100F", canonical: "i3 12100f" },
    { label: "Intel i3-13100", canonical: "i3 13100" },
    { label: "Intel i3-13100F", canonical: "i3 13100f" },
    { label: "Intel i3-14100", canonical: "i3 14100" },
    
    { label: "Intel i5-10400", canonical: "i5 10400" },
    { label: "Intel i5-10400F", canonical: "i5 10400f" },
    { label: "Intel i5-11400", canonical: "i5 11400" },
    { label: "Intel i5-11400F", canonical: "i5 11400f" },
    { label: "Intel i5-12400", canonical: "i5 12400" },
    { label: "Intel i5-12400F", canonical: "i5 12400f" },
    { label: "Intel i5-12500", canonical: "i5 12500" },
    { label: "Intel i5-12600K", canonical: "i5 12600k" },
    { label: "Intel i5-13400", canonical: "i5 13400" },
    { label: "Intel i5-13400F", canonical: "i5 13400f" },
    { label: "Intel i5-13500", canonical: "i5 13500" },
    { label: "Intel i5-13600K", canonical: "i5 13600k" },
    { label: "Intel i5-14400", canonical: "i5 14400" },
    { label: "Intel i5-14500", canonical: "i5 14500" },
    { label: "Intel i5-14600K", canonical: "i5 14600k" },
    
    { label: "Intel i7-10700", canonical: "i7 10700" },
    { label: "Intel i7-10700K", canonical: "i7 10700k" },
    { label: "Intel i7-11700", canonical: "i7 11700" },
    { label: "Intel i7-11700K", canonical: "i7 11700k" },
    { label: "Intel i7-12700", canonical: "i7 12700" },
    { label: "Intel i7-12700K", canonical: "i7 12700k" },
    { label: "Intel i7-13700", canonical: "i7 13700" },
    { label: "Intel i7-13700K", canonical: "i7 13700k" },
    { label: "Intel i7-14700", canonical: "i7 14700" },
    { label: "Intel i7-14700K", canonical: "i7 14700k" },
    
    { label: "Intel i9-10900K", canonical: "i9 10900k" },
    { label: "Intel i9-11900K", canonical: "i9 11900k" },
    { label: "Intel i9-12900K", canonical: "i9 12900k" },
    { label: "Intel i9-13900K", canonical: "i9 13900k" },
    { label: "Intel i9-14900K", canonical: "i9 14900k" },
    
    // Eski CPU'lar
    { label: "Intel i5-2500K", canonical: "i5 2500k" },
    { label: "Intel i5-3470", canonical: "i5 3470" },
    { label: "Intel i5-3570K", canonical: "i5 3570k" },
    { label: "Intel i5-4460", canonical: "i5 4460" },
    { label: "Intel i5-4590", canonical: "i5 4590" },
    { label: "Intel i5-4670K", canonical: "i5 4670k" },
    { label: "Intel i5-4690K", canonical: "i5 4690k" },
    { label: "Intel i7-2600K", canonical: "i7 2600k" },
    { label: "Intel i7-3770K", canonical: "i7 3770k" },
    { label: "Intel i7-4770K", canonical: "i7 4770k" },
    { label: "Intel i7-4790K", canonical: "i7 4790k" },
    { label: "Intel i7-6700K", canonical: "i7 6700k" },
    { label: "Intel i7-7700K", canonical: "i7 7700k" },
    { label: "Intel i7-8700K", canonical: "i7 8700k" },
    { label: "Intel i7-9700K", canonical: "i7 9700k" },
    { label: "Intel Core 2 Duo E8400", canonical: "core 2 duo e8400" },
    { label: "Intel Core 2 Quad Q6600", canonical: "core 2 quad q6600" },
    
    // ======== GPU - NVIDIA ========
    { label: "RTX 3050 8GB", canonical: "rtx 3050" },
    { label: "RTX 3060 12GB", canonical: "rtx 3060" },
    { label: "RTX 3060 Ti", canonical: "rtx 3060 ti" },
    { label: "RTX 4060 8GB", canonical: "rtx 4060" },
    { label: "RTX 4060 Ti 8GB", canonical: "rtx 4060 ti" },
    { label: "RTX 4060 Ti 16GB", canonical: "rtx 4060 ti 16gb" },
    { label: "RTX 4070 12GB", canonical: "rtx 4070" },
    { label: "RTX 4070 Super 12GB", canonical: "rtx 4070 super" },
    { label: "RTX 4070 Ti 12GB", canonical: "rtx 4070 ti" },
    { label: "RTX 4070 Ti Super 16GB", canonical: "rtx 4070 ti super" },
    { label: "RTX 4080 16GB", canonical: "rtx 4080" },
    { label: "RTX 4080 Super 16GB", canonical: "rtx 4080 super" },
    { label: "RTX 4090 24GB", canonical: "rtx 4090" },
    
    { label: "GTX 1050 2GB", canonical: "gtx 1050" },
    { label: "GTX 1050 Ti 4GB", canonical: "gtx 1050 ti" },
    { label: "GTX 1060 3GB", canonical: "gtx 1060 3gb" },
    { label: "GTX 1060 6GB", canonical: "gtx 1060 6gb" },
    { label: "GTX 1070 8GB", canonical: "gtx 1070" },
    { label: "GTX 1070 Ti 8GB", canonical: "gtx 1070 ti" },
    { label: "GTX 1080 8GB", canonical: "gtx 1080" },
    { label: "GTX 1080 Ti 11GB", canonical: "gtx 1080 ti" },
    
    { label: "GTX 1650 4GB", canonical: "gtx 1650" },
    { label: "GTX 1650 Super 4GB", canonical: "gtx 1650 super" },
    { label: "GTX 1660 6GB", canonical: "gtx 1660" },
    { label: "GTX 1660 Super 6GB", canonical: "gtx 1660 super" },
    { label: "GTX 1660 Ti 6GB", canonical: "gtx 1660 ti" },
    
    { label: "RTX 2060 6GB", canonical: "rtx 2060" },
    { label: "RTX 2060 Super 8GB", canonical: "rtx 2060 super" },
    { label: "RTX 2070 8GB", canonical: "rtx 2070" },
    { label: "RTX 2070 Super 8GB", canonical: "rtx 2070 super" },
    { label: "RTX 2080 8GB", canonical: "rtx 2080" },
    { label: "RTX 2080 Super 8GB", canonical: "rtx 2080 super" },
    { label: "RTX 2080 Ti 11GB", canonical: "rtx 2080 ti" },
    
    { label: "RTX 3070 8GB", canonical: "rtx 3070" },
    { label: "RTX 3070 Ti 8GB", canonical: "rtx 3070 ti" },
    { label: "RTX 3080 10GB", canonical: "rtx 3080" },
    { label: "RTX 3080 12GB", canonical: "rtx 3080 12gb" },
    { label: "RTX 3080 Ti 12GB", canonical: "rtx 3080 ti" },
    { label: "RTX 3090 24GB", canonical: "rtx 3090" },
    { label: "RTX 3090 Ti 24GB", canonical: "rtx 3090 ti" },
    
    // ======== GPU - AMD ========
    { label: "RX 6400 4GB", canonical: "rx 6400" },
    { label: "RX 6500 XT 4GB", canonical: "rx 6500 xt" },
    { label: "RX 6600 8GB", canonical: "rx 6600" },
    { label: "RX 6600 XT 8GB", canonical: "rx 6600 xt" },
    { label: "RX 6650 XT 8GB", canonical: "rx 6650 xt" },
    { label: "RX 6700 XT 12GB", canonical: "rx 6700 xt" },
    { label: "RX 6750 XT 12GB", canonical: "rx 6750 xt" },
    { label: "RX 6800 16GB", canonical: "rx 6800" },
    { label: "RX 6800 XT 16GB", canonical: "rx 6800 xt" },
    { label: "RX 6900 XT 16GB", canonical: "rx 6900 xt" },
    { label: "RX 6950 XT 16GB", canonical: "rx 6950 xt" },
    
    { label: "RX 7600 8GB", canonical: "rx 7600" },
    { label: "RX 7600 XT 16GB", canonical: "rx 7600 xt" },
    { label: "RX 7700 XT 12GB", canonical: "rx 7700 xt" },
    { label: "RX 7800 XT 16GB", canonical: "rx 7800 xt" },
    { label: "RX 7900 GRE 16GB", canonical: "rx 7900 gre" },
    { label: "RX 7900 XT 20GB", canonical: "rx 7900 xt" },
    { label: "RX 7900 XTX 24GB", canonical: "rx 7900 xtx" },
    
    { label: "RX 570 4GB", canonical: "rx 570 4gb" },
    { label: "RX 570 8GB", canonical: "rx 570 8gb" },
    { label: "RX 580 4GB", canonical: "rx 580 4gb" },
    { label: "RX 580 8GB", canonical: "rx 580 8gb" },
    { label: "RX 590 8GB", canonical: "rx 590" },
    
    { label: "RX 5500 XT 4GB", canonical: "rx 5500 xt" },
    { label: "RX 5500 XT 8GB", canonical: "rx 5500 xt 8gb" },
    { label: "RX 5600 XT 6GB", canonical: "rx 5600 xt" },
    { label: "RX 5700 8GB", canonical: "rx 5700" },
    { label: "RX 5700 XT 8GB", canonical: "rx 5700 xt" },
    
    { label: "R9 270 2GB", canonical: "r9 270" },
    { label: "R9 270X 2GB", canonical: "r9 270x" },
    { label: "R9 280 3GB", canonical: "r9 280" },
    { label: "R9 280X 3GB", canonical: "r9 280x" },
    { label: "R9 290 4GB", canonical: "r9 290" },
    { label: "R9 290X 4GB", canonical: "r9 290x" },
    { label: "R9 380 2GB", canonical: "r9 380" },
    { label: "R9 380 4GB", canonical: "r9 380 4gb" },
    { label: "R9 390 8GB", canonical: "r9 390" },
    { label: "R9 390X 8GB", canonical: "r9 390x" },
    
    { label: "HD 7850 2GB", canonical: "hd 7850" },
    { label: "HD 7870 2GB", canonical: "hd 7870" },
    { label: "HD 7950 3GB", canonical: "hd 7950" },
    { label: "HD 7970 3GB", canonical: "hd 7970" },
    
    // ======== RAM - ÇOK GENİŞLETİLDİ ========
    // DDR3 RAM'ler
    { label: "2GB DDR3 1333MHz", canonical: "2gb ddr3 1333" },
    { label: "4GB DDR3 1333MHz", canonical: "4gb ddr3 1333" },
    { label: "8GB DDR3 1333MHz", canonical: "8gb ddr3 1333" },
    
    { label: "2GB DDR3 1600MHz", canonical: "2gb ddr3 1600" },
    { label: "4GB DDR3 1600MHz", canonical: "4gb ddr3 1600" },
    { label: "8GB DDR3 1600MHz", canonical: "8gb ddr3 1600" },
    { label: "16GB DDR3 1600MHz", canonical: "16gb ddr3 1600" },
    
    { label: "4GB DDR3 1866MHz", canonical: "4gb ddr3 1866" },
    { label: "8GB DDR3 1866MHz", canonical: "8gb ddr3 1866" },
    { label: "16GB DDR3 1866MHz", canonical: "16gb ddr3 1866" },
    
    // DDR4 RAM'ler
    { label: "4GB DDR4 2133MHz", canonical: "4gb ddr4 2133" },
    { label: "8GB DDR4 2133MHz", canonical: "8gb ddr4 2133" },
    { label: "16GB DDR4 2133MHz", canonical: "16gb ddr4 2133" },
    
    { label: "4GB DDR4 2400MHz", canonical: "4gb ddr4 2400" },
    { label: "8GB DDR4 2400MHz", canonical: "8gb ddr4 2400" },
    { label: "16GB DDR4 2400MHz", canonical: "16gb ddr4 2400" },
    { label: "32GB DDR4 2400MHz", canonical: "32gb ddr4 2400" },
    
    { label: "4GB DDR4 2666MHz", canonical: "4gb ddr4 2666" },
    { label: "8GB DDR4 2666MHz", canonical: "8gb ddr4 2666" },
    { label: "16GB DDR4 2666MHz", canonical: "16gb ddr4 2666" },
    { label: "32GB DDR4 2666MHz", canonical: "32gb ddr4 2666" },
    
    { label: "4GB DDR4 2933MHz", canonical: "4gb ddr4 2933" },
    { label: "8GB DDR4 2933MHz", canonical: "8gb ddr4 2933" },
    { label: "16GB DDR4 2933MHz", canonical: "16gb ddr4 2933" },
    
    { label: "4GB DDR4 3000MHz", canonical: "4gb ddr4 3000" },
    { label: "8GB DDR4 3000MHz", canonical: "8gb ddr4 3000" },
    { label: "16GB DDR4 3000MHz", canonical: "16gb ddr4 3000" },
    { label: "32GB DDR4 3000MHz", canonical: "32gb ddr4 3000" },
    
    { label: "8GB DDR4 3200MHz", canonical: "8gb ddr4 3200" },
    { label: "16GB DDR4 3200MHz", canonical: "16gb ddr4 3200" },
    { label: "32GB DDR4 3200MHz", canonical: "32gb ddr4 3200" },
    { label: "64GB DDR4 3200MHz", canonical: "64gb ddr4 3200" },
    
    { label: "16GB DDR4 3600MHz", canonical: "16gb ddr4 3600" },
    { label: "32GB DDR4 3600MHz", canonical: "32gb ddr4 3600" },
    { label: "64GB DDR4 3600MHz", canonical: "64gb ddr4 3600" },
    
    { label: "16GB DDR4 4000MHz", canonical: "16gb ddr4 4000" },
    { label: "32GB DDR4 4000MHz", canonical: "32gb ddr4 4000" },
    
    // DDR5 RAM'ler
    { label: "16GB DDR5 4800MHz", canonical: "16gb ddr5 4800" },
    { label: "32GB DDR5 4800MHz", canonical: "32gb ddr5 4800" },
    
    { label: "16GB DDR5 5200MHz", canonical: "16gb ddr5 5200" },
    { label: "32GB DDR5 5200MHz", canonical: "32gb ddr5 5200" },
    { label: "64GB DDR5 5200MHz", canonical: "64gb ddr5 5200" },
    
    { label: "16GB DDR5 5600MHz", canonical: "16gb ddr5 5600" },
    { label: "32GB DDR5 5600MHz", canonical: "32gb ddr5 5600" },
    { label: "64GB DDR5 5600MHz", canonical: "64gb ddr5 5600" },
    
    { label: "16GB DDR5 6000MHz", canonical: "16gb ddr5 6000" },
    { label: "32GB DDR5 6000MHz", canonical: "32gb ddr5 6000" },
    { label: "64GB DDR5 6000MHz", canonical: "64gb ddr5 6000" },
    
    { label: "32GB DDR5 6400MHz", canonical: "32gb ddr5 6400" },
    { label: "64GB DDR5 6400MHz", canonical: "64gb ddr5 6400" },
    
    { label: "32GB DDR5 7200MHz", canonical: "32gb ddr5 7200" },
    { label: "64GB DDR5 7200MHz", canonical: "64gb ddr5 7200" },
    
    // ======== Anakart ========
    { label: "A320 Anakart", canonical: "a320 anakart" },
    { label: "B350 Anakart", canonical: "b350 anakart" },
    { label: "B450 Anakart", canonical: "b450 anakart" },
    { label: "B550 Anakart", canonical: "b550 anakart" },
    { label: "X370 Anakart", canonical: "x370 anakart" },
    { label: "X470 Anakart", canonical: "x470 anakart" },
    { label: "X570 Anakart", canonical: "x570 anakart" },
    
    { label: "A620 Anakart", canonical: "a620 anakart" },
    { label: "B650 Anakart", canonical: "b650 anakart" },
    { label: "B650E Anakart", canonical: "b650e anakart" },
    { label: "X670 Anakart", canonical: "x670 anakart" },
    { label: "X670E Anakart", canonical: "x670e anakart" },
    
    { label: "H610 Anakart", canonical: "h610 anakart" },
    { label: "B660 Anakart", canonical: "b660 anakart" },
    { label: "B760 Anakart", canonical: "b760 anakart" },
    { label: "Z690 Anakart", canonical: "z690 anakart" },
    { label: "Z790 Anakart", canonical: "z790 anakart" },
    
    { label: "Z97 Anakart", canonical: "z97 anakart" },
    { label: "H97 Anakart", canonical: "h97 anakart" },
    { label: "Z87 Anakart", canonical: "z87 anakart" },
    { label: "H87 Anakart", canonical: "h87 anakart" },
    
    { label: "Z77 Anakart", canonical: "z77 anakart" },
    { label: "H77 Anakart", canonical: "h77 anakart" },
    { label: "Z68 Anakart", canonical: "z68 anakart" },
    { label: "P67 Anakart", canonical: "p67 anakart" },
    
    { label: "990FX Anakart", canonical: "990fx anakart" },
    { label: "970 Anakart", canonical: "970 anakart" },
    
    // ======== PSU ========
    { label: "350W 80+ PSU", canonical: "350w psu" },
    { label: "400W 80+ PSU", canonical: "400w psu" },
    { label: "450W 80+ Bronze", canonical: "450w bronze" },
    { label: "500W 80+ Bronze", canonical: "500w bronze" },
    { label: "550W 80+ Bronze", canonical: "550w bronze" },
    { label: "600W 80+ Bronze", canonical: "600w bronze" },
    { label: "650W 80+ Bronze", canonical: "650w bronze" },
    { label: "700W 80+ Bronze", canonical: "700w bronze" },
    { label: "750W 80+ Gold", canonical: "750w gold" },
    { label: "800W 80+ Gold", canonical: "800w gold" },
    { label: "850W 80+ Gold", canonical: "850w gold" },
    { label: "1000W 80+ Gold", canonical: "1000w gold" },
    { label: "1200W 80+ Platinum", canonical: "1200w platinum" },
    { label: "1600W 80+ Platinum", canonical: "1600w platinum" },
    
    // ======== Depolama ========
    { label: "120GB SSD", canonical: "120gb ssd" },
    { label: "240GB SSD", canonical: "240gb ssd" },
    { label: "480GB SSD", canonical: "480gb ssd" },
    { label: "500GB SSD", canonical: "500gb ssd" },
    { label: "1TB SSD", canonical: "1tb ssd" },
    { label: "2TB SSD", canonical: "2tb ssd" },
    { label: "4TB SSD", canonical: "4tb ssd" },
    
    { label: "250GB NVMe SSD", canonical: "250gb nvme" },
    { label: "500GB NVMe SSD", canonical: "500gb nvme" },
    { label: "1TB NVMe SSD", canonical: "1tb nvme" },
    { label: "2TB NVMe SSD", canonical: "2tb nvme" },
    { label: "4TB NVMe SSD", canonical: "4tb nvme" },
    
    { label: "500GB HDD", canonical: "500gb hdd" },
    { label: "1TB HDD", canonical: "1tb hdd" },
    { label: "2TB HDD", canonical: "2tb hdd" },
    { label: "4TB HDD", canonical: "4tb hdd" },
    { label: "8TB HDD", canonical: "8tb hdd" },
    { label: "10TB HDD", canonical: "10tb hdd" },
    { label: "16TB HDD", canonical: "16tb hdd" },
    
    // ======== Soğutucu ========
    { label: "Intel Stock Soğutucu", canonical: "intel stock soğutucu" },
    { label: "AMD Wraith Soğutucu", canonical: "amd wraith soğutucu" },
    { label: "Cooler Master Hyper 212", canonical: "cooler master hyper 212" },
    { label: "Noctua NH-U12S", canonical: "noctua nh u12s" },
    { label: "Noctua NH-D15", canonical: "noctua nh d15" },
    { label: "be quiet! Dark Rock 4", canonical: "be quiet dark rock 4" },
    { label: "AIO 120mm", canonical: "aio 120mm" },
    { label: "AIO 240mm", canonical: "aio 240mm" },
    { label: "AIO 280mm", canonical: "aio 280mm" },
    { label: "AIO 360mm", canonical: "aio 360mm" },
    
    // ======== Kasa ========
    { label: "Mini ITX Kasa", canonical: "mini itx kasa" },
    { label: "Micro ATX Kasa", canonical: "micro atx kasa" },
    { label: "Mid Tower Kasa", canonical: "mid tower kasa" },
    { label: "Full Tower Kasa", canonical: "full tower kasa" },
    { label: "Gaming Kasa", canonical: "gaming kasa" },
    { label: "RGB Kasa", canonical: "rgb kasa" },
    
    // ======== Genel Ürünler ========
    { label: "iPhone 13", canonical: "iphone 13" },
    { label: "iPhone 14", canonical: "iphone 14" },
    { label: "iPhone 15", canonical: "iphone 15" },
    { label: "Samsung Galaxy S23", canonical: "samsung galaxy s23" },
    { label: "PlayStation 5", canonical: "playstation 5" },
    { label: "Xbox Series X", canonical: "xbox series x" },
    { label: "Nintendo Switch", canonical: "nintendo switch" },
    { label: "MacBook Air M1", canonical: "macbook air m1" },
    { label: "iPad Pro", canonical: "ipad pro" }
  ];

  let typeaheadSelectionLabel = '';

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
          activeIndex = idx;
        };
        
        item.onmouseout = () => {
          if (idx !== activeIndex) {
            item.style.background = '';
          } else {
            item.style.background = 'rgba(59, 130, 246, 0.1)';
          }
        };
        
        item.onclick = () => {
          selectItem(idx);
        };
      });
    }
    
    function selectItem(index) {
      if (index >= 0 && index < currentSuggestions.length) {
        const item = currentSuggestions[index];
        typeaheadSelectionLabel = item.label; // Seçilen label'i sakla
        
        // App.js'deki fonksiyonu çağır
        if (window.setTypeaheadSelection) {
          window.setTypeaheadSelection(true, item.canonical, item.label);
        }
        
        // Callback'i çağır
        onSelect?.(item);
        
        // Input'u güncelle
        input.value = item.label;
        hide();
        
        // Hemen arama yap
        setTimeout(() => {
          if (window.performSearch) {
            window.performSearch();
          }
        }, 50);
      }
    }
    
    // Event listeners
    let lastValue = '';
    input.addEventListener("input", () => {
      if (input.value === lastValue) return;
      
      lastValue = input.value;
      
      // Kullanıcı yazmaya başladı, typeahead seçimini sıfırla
      if (window.setTypeaheadSelection) {
        window.setTypeaheadSelection(false, '', '');
      }
      
      const suggestions = getSuggestions(input.value);
      render(suggestions);
    });
    
    // ENTER tuşu işlemi
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        // Eğer typeahead açıksa ve aktif öğe varsa
        if (!box.classList.contains("hidden") && activeIndex >= 0) {
          e.preventDefault();
          selectItem(activeIndex);
        }
        // Typeahead kapalıysa veya aktif öğe yoksa, normal ENTER davranışı
      }
      
      // Diğer tuşlar (ok tuşları, Escape)
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
          
        case "Escape":
          hide();
          break;
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
    
    // Input blur olunca (odak kaybolunca)
    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (!box.contains(document.activeElement)) {
          hide();
        }
      }, 200);
    });
  }

  // Global fonksiyonlar
  window.initTypeahead = initTypeahead;
  window.getTypeaheadSelectionLabel = () => typeaheadSelectionLabel;
  
  // Sayfa yüklendiğinde otomatik başlat
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('qNormal');
    if (searchInput) {
      initTypeahead(searchInput, (item) => {
        console.log('Typeahead seçildi:', item.label);
      });
    }
  });
})();

/**
 * Growth Algorithm untuk Bamboo Tracking
 * Mengira ketinggian dan CO2 absorption berdasarkan hari sejak penanaman
 */

export interface GrowthData {
  height: number; // dalam meter
  diameter: number; // dalam cm
  co2Absorbed: number; // dalam kg
  daysSincePlanting: number;
  growthStage: 'seedling' | 'juvenile' | 'mature' | 'full-grown';
}

export interface GrowthRecord {
  daysSincePlanting: number;
  height: number;
  diameter: number;
  co2Absorbed: number;
  notes: string;
  growthStage: string;
}

/**
 * Mengira pertumbuhan bambu berdasarkan hari sejak penanaman
 * Formula berdasarkan kajian pertumbuhan Bambusa vulgaris
 */
export function calculateBambooGrowth(daysSincePlanting: number): GrowthData {
  // Konstanta pertumbuhan bambu
  const INITIAL_HEIGHT = 0.1; // 10cm ketinggian awal
  const MAX_HEIGHT = 25; // 25m ketinggian maksimum
  const GROWTH_RATE_PEAK = 90; // hari ke-90 pertumbuhan terpantas
  const MATURITY_DAYS = 365; // 1 tahun untuk matang
  
  // Formula pertumbuhan menggunakan sigmoid curve
  // Pertumbuhan pantas pada bulan pertama, kemudian perlahan
  let height: number;
  
  if (daysSincePlanting <= 0) {
    height = INITIAL_HEIGHT;
  } else if (daysSincePlanting <= 30) {
    // Bulan pertama: pertumbuhan linear pantas (0.3m/hari)
    height = INITIAL_HEIGHT + (daysSincePlanting * 0.3);
  } else if (daysSincePlanting <= 90) {
    // Bulan 2-3: pertumbuhan sederhana (0.15m/hari)
    height = 9.1 + ((daysSincePlanting - 30) * 0.15);
  } else if (daysSincePlanting <= 180) {
    // Bulan 4-6: pertumbuhan perlahan (0.08m/hari)
    height = 18.1 + ((daysSincePlanting - 90) * 0.08);
  } else if (daysSincePlanting <= 365) {
    // Bulan 7-12: pertumbuhan sangat perlahan (0.03m/hari)
    height = 25.3 + ((daysSincePlanting - 180) * 0.03);
  } else {
    // Selepas 1 tahun: pertumbuhan minimal (0.01m/hari)
    height = 30.85 + ((daysSincePlanting - 365) * 0.01);
  }
  
  // Cap maksimum ketinggian
  height = Math.min(height, MAX_HEIGHT);
  
  // Kira diameter berdasarkan ketinggian (diameter = height * 0.8 + 2)
  const diameter = Math.max(2, height * 0.8 + 2);
  
  // Kira CO2 absorption berdasarkan biomass
  // Formula: CO2 = height^1.5 * diameter * 0.47 * 3.67
  // 0.47 = carbon content factor, 3.67 = CO2/carbon ratio
  const co2Absorbed = Math.pow(height, 1.5) * diameter * 0.47 * 3.67;
  
  // Tentukan growth stage
  let growthStage: 'seedling' | 'juvenile' | 'mature' | 'full-grown';
  if (daysSincePlanting <= 30) {
    growthStage = 'seedling';
  } else if (daysSincePlanting <= 180) {
    growthStage = 'juvenile';
  } else if (daysSincePlanting <= 365) {
    growthStage = 'mature';
  } else {
    growthStage = 'full-grown';
  }
  
  return {
    height: Math.round(height * 100) / 100, // 2 decimal places
    diameter: Math.round(diameter * 100) / 100,
    co2Absorbed: Math.round(co2Absorbed * 100) / 100,
    daysSincePlanting,
    growthStage
  };
}

/**
 * Generate growth records untuk timeline
 * Membuat rekod pertumbuhan setiap 7 hari (mingguan)
 */
export function generateGrowthTimeline(daysSincePlanting: number): GrowthRecord[] {
  const records: GrowthRecord[] = [];
  
  // Generate rekod setiap 7 hari
  for (let day = 7; day <= daysSincePlanting; day += 7) {
    const growth = calculateBambooGrowth(day);
    
    records.push({
      daysSincePlanting: day,
      height: growth.height,
      diameter: growth.diameter,
      co2Absorbed: growth.co2Absorbed,
      notes: getGrowthNotes(day, growth.growthStage),
      growthStage: growth.growthStage
    });
  }
  
  // Tambah rekod terkini jika bukan kelipatan 7
  if (daysSincePlanting % 7 !== 0 && daysSincePlanting > 0) {
    const currentGrowth = calculateBambooGrowth(daysSincePlanting);
    records.push({
      daysSincePlanting,
      height: currentGrowth.height,
      diameter: currentGrowth.diameter,
      co2Absorbed: currentGrowth.co2Absorbed,
      notes: getGrowthNotes(daysSincePlanting, currentGrowth.growthStage),
      growthStage: currentGrowth.growthStage
    });
  }
  
  return records;
}

/**
 * Generate catatan automatik berdasarkan stage pertumbuhan
 */
function getGrowthNotes(days: number, stage: string): string {
  const notes = {
    seedling: [
      'Tunas baru muncul dengan daun hijau segar',
      'Pertumbuhan akar yang kuat',
      'Batang muda mulai mengeras',
      'Daun pertama berkembang sempurna'
    ],
    juvenile: [
      'Pertumbuhan pesat dengan batang yang semakin tinggi',
      'Sistem akar semakin meluas',
      'Daun baru tumbuh dengan lebat',
      'Batang mulai menunjukkan segmen bambu',
      'Warna hijau semakin pekat'
    ],
    mature: [
      'Bambu mencapai ketinggian yang stabil',
      'Batang semakin keras dan kuat',
      'Daun dewasa dengan warna hijau tua',
      'Sistem akar telah matang',
      'Mulai menunjukkan ciri-ciri bambu dewasa'
    ],
    'full-grown': [
      'Bambu telah mencapai kematangan penuh',
      'Batang sangat kuat dan keras',
      'Daun lebat dan hijau pekat',
      'Siap untuk penuaian berkelanjutan',
      'Penyerapan CO2 pada tahap optimum'
    ]
  };
  
  const stageNotes = notes[stage as keyof typeof notes] || notes.seedling;
  const randomIndex = Math.floor(Math.random() * stageNotes.length);
  
  return `Hari ${days}: ${stageNotes[randomIndex]}`;
}

/**
 * Kira projected growth untuk masa depan
 */
export function getProjectedGrowth(currentDays: number, projectionDays: number): GrowthData {
  return calculateBambooGrowth(currentDays + projectionDays);
}

/**
 * Kira average growth rate per hari
 */
export function getGrowthRate(daysSincePlanting: number): {
  heightPerDay: number;
  co2PerDay: number;
} {
  if (daysSincePlanting <= 0) {
    return { heightPerDay: 0, co2PerDay: 0 };
  }
  
  const currentGrowth = calculateBambooGrowth(daysSincePlanting);
  
  return {
    heightPerDay: Math.round((currentGrowth.height / daysSincePlanting) * 1000) / 1000,
    co2PerDay: Math.round((currentGrowth.co2Absorbed / daysSincePlanting) * 1000) / 1000
  };
}
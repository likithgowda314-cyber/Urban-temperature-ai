// Define Center coordinates for cities
export const CITY_COORDINATES = {
  delhi: [28.6139, 77.2090],
  bengaluru: [12.9716, 77.5946],
  ahmedabad: [23.0225, 72.5714]
};

// Map city keys to display names
export const CITY_NAMES = {
  delhi: 'Delhi NCT',
  bengaluru: 'Bengaluru (Silicon Valley)',
  ahmedabad: 'Ahmedabad Industrial'
};

// Map city keys to descriptions
export const CITY_DESCRIPTIONS = {
  delhi: 'National Capital Territory. Characterized by severe surface warming, heavy commercial density, and low green cover leading to severe heat domes.',
  bengaluru: 'The Garden City of India. Undergoing rapid vertical development and lake depletion, expanding urban heat islands into tech hubs.',
  ahmedabad: 'Western industrial center. Historically vulnerable to high temperatures. Implementing targeted cool-roof policies to mitigate heat risk.'
};

// Tailored Interventions options
export const INTERVENTIONS = [
  {
    key: 'cool_roof',
    name: 'High-Albedo Cool Roof Coating',
    lstImpact: 1.8,
    ndviImpact: 0.02,
    budgetTier: 'Low',
    cost: '₹2.5 Lakh / ward block',
    details: 'Applies reflective paint to concrete roof slabs to maximize solar reflectance (SRI > 78).'
  },
  {
    key: 'miyazaki',
    name: 'Miyawaki Urban Afforestation',
    lstImpact: 3.5,
    ndviImpact: 0.45,
    budgetTier: 'High',
    cost: '₹12.0 Lakh / ward block',
    details: 'Establishes rapid-growth multi-layered native forests to build shaded cooling micro-canopies.'
  },
  {
    key: 'green_roof',
    name: 'Green Vegetated Roofs',
    lstImpact: 2.5,
    ndviImpact: 0.22,
    budgetTier: 'Medium',
    cost: '₹7.5 Lakh / ward block',
    details: 'Installs soil substrate and drought-tolerant sedum plants on flat roofs to absorb thermal load.'
  },
  {
    key: 'wetland',
    name: 'Wetland & Water Body Revival',
    lstImpact: 4.2,
    ndviImpact: 0.10,
    budgetTier: 'High',
    cost: '₹22.0 Lakh / ward block',
    details: 'Restores silted municipal ponds, constructing surrounding bio-filters to promote evaporative cooling.'
  }
];

// Generate deterministic cell grids for Delhi, Bengaluru, and Ahmedabad
export const generateGridData = (cityCenter, cityKey) => {
  const [centerLat, centerLng] = cityCenter;
  const cellSize = 0.0055; // Creates reasonable size blocks for Leaflet
  const data = [];
  
  const wards = {
    delhi: ["Connaught Place", "Chanakyapuri", "Vasant Vihar", "Lajpat Nagar", "Karol Bagh", "Rohini", "Dwarka", "Okhla", "Shahdara", "Saket"],
    bengaluru: ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "Malleshwaram", "Yelahanka", "HSR Layout", "Electronic City", "Marathahalli", "BTM Layout"],
    ahmedabad: ["Kalupur", "Satellite", "Navrangpura", "Maninagar", "Vastrapur", "Sabarmati", "Ghatlodia", "Bapunagar", "Paldi", "Asarwa"],
    custom: ["North District", "Central Business District", "South District", "East Zone", "West Zone", "Uptown", "Downtown", "Industrial Park", "Suburbs", "Riverside"]
  };

  const currentWards = wards[cityKey] || wards.delhi;
  const lulcs = ["Commercial", "Residential High-Density", "Industrial Area", "Urban Forest", "Water Body", "Open Soil"];

  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 20; c++) {
      const id = `${cityKey.toUpperCase().substring(0, 2)}-R${r}-C${c}`;
      
      const minLat = centerLat + (r - 10) * cellSize;
      const maxLat = minLat + cellSize;
      const minLng = centerLng + (c - 10) * cellSize;
      const maxLng = minLng + cellSize;
      const bounds = [[minLat, minLng], [maxLat, maxLng]];

      // Deterministic randomness
      const hash = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
      const randomVal = hash - Math.floor(hash);

      const ward = currentWards[Math.floor(randomVal * currentWards.length)];
      const lulc = lulcs[Math.floor(randomVal * lulcs.length)];
      
      let baseLST = 35.0;
      let ndvi = 0.15;
      let density = 75;

      if (lulc === "Water Body") {
        baseLST = 27.5;
        ndvi = 0.08;
        density = 5;
      } else if (lulc === "Urban Forest") {
        baseLST = 29.5;
        ndvi = 0.68;
        density = 8;
      } else if (lulc === "Commercial") {
        baseLST = 41.2;
        ndvi = 0.04;
        density = 94;
      } else if (lulc === "Industrial Area") {
        baseLST = 42.8;
        ndvi = 0.03;
        density = 88;
      } else if (lulc === "Residential High-Density") {
        baseLST = 38.2;
        ndvi = 0.11;
        density = 82;
      } else {
        baseLST = 36.5;
        ndvi = 0.18;
        density = 20;
      }

      // Add spatial variance waves
      const variance = Math.cos(r * Math.PI / 4) * 2.2 + Math.sin(c * Math.PI / 4) * 2.2;
      let lst = baseLST + variance;

      // Adjust based on city baseline
      if (cityKey === 'bengaluru') {
        lst -= 6.2;
        ndvi += 0.09;
      } else if (cityKey === 'ahmedabad') {
        lst += 1.8;
      }

      const popExposure = Math.floor(randomVal * 60) + 15; // 15,000 to 75,000 people

      let severity = "Low";
      if (lst >= 40.0) severity = "Severe";
      else if (lst >= 36.0) severity = "High";
      else if (lst >= 32.0) severity = "Moderate";

      data.push({
        id,
        row: r,
        col: c,
        bounds,
        lst,
        originalLst: lst,
        ndvi,
        originalNdvi: ndvi,
        density,
        lulc,
        ward,
        popExposure,
        severity,
        originalSeverity: severity,
        mitigated: false,
        appliedIntervention: null
      });
    }
  }

  return data;
};

// Seasonal analytics trends mock data
export const generateSeasonalTrends = (cityKey) => {
  const multipliers = {
    delhi: { lstAdd: 0, ndviMul: 1.0 },
    bengaluru: { lstAdd: -6.5, ndviMul: 1.35 },
    ahmedabad: { lstAdd: 1.5, ndviMul: 0.85 }
  };

  const mult = multipliers[cityKey] || multipliers.delhi;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseLST = [21.5, 24.8, 30.5, 36.8, 41.5, 39.2, 33.8, 32.2, 33.1, 31.8, 27.2, 22.0];
  const baseNDVI = [0.42, 0.40, 0.35, 0.26, 0.18, 0.22, 0.32, 0.38, 0.37, 0.39, 0.41, 0.43];

  return months.map((m, idx) => ({
    month: m,
    LST: parseFloat((baseLST[idx] + mult.lstAdd).toFixed(1)),
    NDVI: parseFloat((baseNDVI[idx] * mult.ndviMul).toFixed(2))
  }));
};

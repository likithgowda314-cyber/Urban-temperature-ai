import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, Menu, Select, Table, Card, Row, Col, Statistic, Progress, 
  Steps, Timeline, Button, Drawer, Tag, Slider, InputNumber, Badge, Alert, 
  Tooltip, message, Space
} from 'antd';
import { 
  Map as MapIcon, Calendar, BarChart3, Database, Thermometer, Leaf, 
  Building2, Layers, Cpu, Sparkles, RefreshCw, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, Legend, Line, ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import L from 'leaflet';
import 'leaflet.heat';

const { Header, Content, Sider } = Layout;

// Define Center coordinates for cities
const CITY_COORDINATES = {
  delhi: [28.6139, 77.2090],
  bengaluru: [12.9716, 77.5946],
  ahmedabad: [23.0225, 72.5714]
};

// Map city keys to display names
const CITY_NAMES = {
  delhi: 'Delhi NCT',
  bengaluru: 'Bengaluru (Silicon Valley)',
  ahmedabad: 'Ahmedabad Industrial'
};

// Map city keys to descriptions
const CITY_DESCRIPTIONS = {
  delhi: 'National Capital Territory. Characterized by severe surface warming, heavy commercial density, and low green cover leading to severe heat domes.',
  bengaluru: 'The Garden City of India. Undergoing rapid vertical development and lake depletion, expanding urban heat islands into tech hubs.',
  ahmedabad: 'Western industrial center. Historically vulnerable to high temperatures. Implementing targeted cool-roof policies to mitigate heat risk.'
};

// Tailored Interventions options
const INTERVENTIONS = [
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

// Leaflet custom map component using direct ref for React 19 compatibility
function LeafletMap({ cityCenter, gridData, selectedCell, onSelectCell }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const gridGroupRef = useRef(null);

  const heatLayerRef = useRef(null);

  // Initialize Map and Layer Group
  useEffect(() => {
    if (!mapRef.current) return;

    // Create Leaflet instance
    const map = L.map(mapRef.current, {
      center: cityCenter,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // Add Premium Dark basemap from CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;
    
    // Feature group to hold all cell rectangles
    const gridGroup = L.featureGroup().addTo(map);
    gridGroupRef.current = gridGroup;

    // Pan map when city changes
    map.setView(cityCenter, 12);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      gridGroupRef.current = null;
      heatLayerRef.current = null;
    };
  }, [cityCenter]);

  // Redraw grid rectangles when data or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const gridGroup = gridGroupRef.current;
    if (!map || !gridGroup) return;

    gridGroup.clearLayers();
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    const heatPoints = [];

    gridData.forEach((cell) => {
      const { bounds, severity, lst, mitigated, id, ward, lulc } = cell;

      const lat = (bounds[0][0] + bounds[1][0]) / 2;
      const lng = (bounds[0][1] + bounds[1][1]) / 2;
      
      // Calculate heat intensity 0.0 to 1.0 (Assume range 25 to 45 C)
      let intensity = (lst - 25) / 20;
      if (intensity < 0) intensity = 0;
      if (intensity > 1) intensity = 1;
      heatPoints.push([lat, lng, intensity]);

      const isSelected = selectedCell && selectedCell.id === id;

      // Color based on severity for tooltip/labels
      let color = '#10b981'; // Low: Emerald-500
      if (severity === 'Moderate') color = '#eab308'; // Moderate: Yellow-500
      else if (severity === 'High') color = '#f97316'; // High: Orange-500
      else if (severity === 'Severe') color = '#ef4444'; // Severe: Red-500

      // Create Leaflet rectangle (Invisible mostly, just for clicking and hovering)
      const rect = L.rectangle(bounds, {
        color: isSelected ? '#38bdf8' : '#334155', // highlight selected with sky-400
        weight: isSelected ? 3 : 0.4,
        fillColor: 'transparent',
        fillOpacity: 0,
        dashArray: mitigated ? '4, 4' : null
      });

      // Simple HTML tooltip
      rect.bindTooltip(
        `<div style="font-family: Inter, sans-serif; color: #f8fafc; font-size: 11px; padding: 2px;">
          <div style="font-weight: 700; border-bottom: 1px solid #475569; padding-bottom: 2px; margin-bottom: 4px;">Cell ${id}</div>
          <strong>Ward:</strong> ${ward}<br/>
          <strong>LST:</strong> ${lst.toFixed(1)}°C ${mitigated ? '<span style="color: #38bdf8;">(Mitigated)</span>' : ''}<br/>
          <strong>NDVI:</strong> ${cell.ndvi.toFixed(2)}<br/>
          <strong>LULC:</strong> ${lulc}<br/>
          <strong>Severity:</strong> <span style="font-weight:700; color: ${color};">${severity}</span>
        </div>`,
        { sticky: true, className: 'custom-map-tooltip' }
      );

      rect.on('click', () => {
        onSelectCell(cell);
      });

      gridGroup.addLayer(rect);
    });

    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius: 40,
      blur: 25,
      maxZoom: 12,
      gradient: { 0.3: '#10b981', 0.5: '#eab308', 0.7: '#f97316', 1.0: '#ef4444' }
    }).addTo(map);

  }, [gridData, selectedCell, onSelectCell]);

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-2xl group">
      {/* Radar scanning animation layer */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden opacity-30 rounded-2xl">
        <div className="w-full h-[5px] bg-sky-400 absolute top-0 left-0 animate-radar-scan shadow-[0_0_20px_5px_rgba(56,189,248,0.7)]" />
      </div>
      
      <div ref={mapRef} className="absolute inset-0 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl z-0" />
      {/* Visual map legend overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800/80 rounded-lg p-3 shadow-xl backdrop-blur-sm z-10 font-sans text-xs">
        <h4 className="font-semibold text-slate-200 mb-2 font-display">UHI Severity Index</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500 opacity-70 border border-slate-700" />
            <span className="text-slate-300">Low (&lt; 32°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-yellow-500 opacity-70 border border-slate-700" />
            <span className="text-slate-300">Moderate (32°C - 36°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500 opacity-70 border border-slate-700" />
            <span className="text-slate-300">High (36°C - 40°C)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-red-500 opacity-70 border border-slate-700" />
            <span className="text-slate-300">Severe (&gt; 40°C)</span>
          </div>
          <div className="flex items-center gap-2 border-t border-slate-800 pt-1.5 mt-1">
            <span className="w-3 h-3 rounded border border-dashed border-sky-400 bg-slate-800/50" />
            <span className="text-slate-300">Simulated / Mitigated</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate deterministic cell grids for Delhi, Bengaluru, and Ahmedabad
const generateGridData = (cityCenter, cityKey) => {
  const [centerLat, centerLng] = cityCenter;
  const cellSize = 0.011; // Creates reasonable size blocks for Leaflet
  const data = [];
  
  const wards = {
    delhi: ["Connaught Place", "Karol Bagh", "Dwarka", "Okhla", "Rohini", "Chandni Chowk", "Vasant Kunj", "Saket", "Mayur Vihar", "Rajouri Garden"],
    bengaluru: ["Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "Malleshwaram", "Yelahanka", "HSR Layout", "Electronic City", "Marathahalli", "BTM Layout"],
    ahmedabad: ["Kalupur", "Satellite", "Navrangpura", "Maninagar", "Vastrapur", "Sabarmati", "Ghatlodia", "Bapunagar", "Paldi", "Asarwa"]
  };

  const currentWards = wards[cityKey] || wards.delhi;
  const lulcs = ["Commercial", "Residential High-Density", "Industrial Area", "Urban Forest", "Water Body", "Open Soil"];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const id = `${cityKey.toUpperCase().substring(0, 2)}-R${r}-C${c}`;
      
      const minLat = centerLat + (r - 5) * cellSize;
      const maxLat = minLat + cellSize;
      const minLng = centerLng + (c - 5) * cellSize;
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
const generateSeasonalTrends = (cityKey) => {
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedCity, setSelectedCity] = useState('delhi');
  
  // Grids state
  const [grids, setGrids] = useState({
    delhi: [],
    bengaluru: [],
    ahmedabad: []
  });

  // Compute average temperature for each city dynamically
  const cityAverages = useMemo(() => {
    const avgs = {};
    const keys = ['delhi', 'bengaluru', 'ahmedabad'];
    keys.forEach(key => {
      const data = grids[key] || [];
      if (data.length > 0) {
        const sum = data.reduce((acc, c) => acc + c.lst, 0);
        avgs[key] = (sum / data.length).toFixed(1);
      } else {
        // Fallback default values
        avgs[key] = key === 'delhi' ? '36.8' : (key === 'bengaluru' ? '30.6' : '38.6');
      }
    });
    return avgs;
  }, [grids]);

  // Selected cell detail drawer state
  const [selectedCell, setSelectedCell] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Intervention Planner filters
  const [filterSeverity, setFilterSeverity] = useState([]);
  const [filterMinPop, setFilterMinPop] = useState(0);
  const [filterLulc, setFilterLulc] = useState('All');

  // Pipeline Simulator state
  const [pipelineState, setPipelineState] = useState('idle'); // idle, running, success
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Seasonal trends state
  const [trends, setTrends] = useState([]);

  // Fetch grids from FastAPI API, falling back to local mock data if offline
  const fetchCityGrids = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/cities/delhi/grid`);
      if (res.ok) {
        const [dl, blr, ahmed] = await Promise.all([
          fetch(`${API_BASE}/api/cities/delhi/grid`).then(r => r.json()),
          fetch(`${API_BASE}/api/cities/bengaluru/grid`).then(r => r.json()),
          fetch(`${API_BASE}/api/cities/ahmedabad/grid`).then(r => r.json())
        ]);
        setGrids({ delhi: dl, bengaluru: blr, ahmedabad: ahmed });
        console.log("Telemetry grid synced with FastAPI server.");
        return;
      }
    } catch (err) {
      console.warn("FastAPI offline. Defaulting to client sandbox mode.");
    }

    setGrids({
      delhi: generateGridData(CITY_COORDINATES.delhi, 'delhi'),
      bengaluru: generateGridData(CITY_COORDINATES.bengaluru, 'bengaluru'),
      ahmedabad: generateGridData(CITY_COORDINATES.ahmedabad, 'ahmedabad')
    });
  };

  // Initialize grids on load
  useEffect(() => {
    fetchCityGrids();
  }, []);

  // Fetch seasonal trends from API, falling back to client generation
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cities/${selectedCity}/trends`);
        if (res.ok) {
          const data = await res.json();
          setTrends(data);
          return;
        }
      } catch (err) {
        // ignore offline
      }
      setTrends(generateSeasonalTrends(selectedCity));
    };
    fetchTrends();
  }, [selectedCity]);

  // Sync state selection of active grid
  const activeGridData = useMemo(() => {
    return grids[selectedCity] || [];
  }, [grids, selectedCity]);

  // Sync drawer cell object ref when grids change
  const activeSelectedCell = useMemo(() => {
    if (!selectedCell) return null;
    return activeGridData.find(c => c.id === selectedCell.id) || null;
  }, [activeGridData, selectedCell]);

  // Handle cell click selection
  const handleSelectCell = (cell) => {
    setSelectedCell(cell);
    setDrawerVisible(true);
  };

  // City center position
  const cityCenter = useMemo(() => {
    return CITY_COORDINATES[selectedCity] || CITY_COORDINATES.delhi;
  }, [selectedCity]);

  // Filtered hotspots/locations for Intervention Planner
  const plannerHotspots = useMemo(() => {
    return activeGridData.filter(cell => {
      // Filter by Severity checkbox selectors
      if (filterSeverity.length > 0) {
        if (!filterSeverity.includes(cell.severity)) return false;
      }

      // Filter by population slider
      if (cell.popExposure < filterMinPop) return false;

      // Filter by LULC dropdown
      if (filterLulc !== 'All' && cell.lulc !== filterLulc) return false;

      return true;
    });
  }, [activeGridData, filterSeverity, filterMinPop, filterLulc]);

  // Handle Deploy Simulation from Map Drawer or Planner Table
  const handleDeploySimulation = async (cellId, interventionKey) => {
    const intervention = INTERVENTIONS.find(item => item.key === interventionKey);
    if (!intervention) return;

    try {
      const res = await fetch(`${API_BASE}/api/cells/${cellId}/mitigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervention_key: interventionKey })
      });
      if (res.ok) {
        const updatedCell = await res.json();
        setGrids(prev => {
          const updatedCityGrid = prev[selectedCity].map(cell => {
            if (cell.id !== cellId) return cell;
            return updatedCell;
          });
          return { ...prev, [selectedCity]: updatedCityGrid };
        });
        message.success({
          content: `Cooling Simulation Deployed (ML Model): ${intervention.name} successfully applied to cell ${cellId}.`,
          style: { marginTop: '50px' }
        });
        return;
      }
    } catch (err) {
      console.warn("FastAPI offline. Deploying client fallback simulation.");
    }

    // Client-side fallback
    setGrids(prev => {
      const updatedCityGrid = prev[selectedCity].map(cell => {
        if (cell.id !== cellId) return cell;

        // Apply simulated impact
        const newLst = cell.originalLst - intervention.lstImpact;
        const newNdvi = Math.min(1.0, cell.originalNdvi + intervention.ndviImpact);

        // Recalculate severity
        let newSeverity = "Low";
        if (newLst >= 40.0) newSeverity = "Severe";
        else if (newLst >= 36.0) newSeverity = "High";
        else if (newLst >= 32.0) newSeverity = "Moderate";

        return {
          ...cell,
          mitigated: true,
          lst: newLst,
          ndvi: newNdvi,
          severity: newSeverity,
          appliedIntervention: intervention
        };
      });

      return {
        ...prev,
        [selectedCity]: updatedCityGrid
      };
    });

    message.success({
      content: `Cooling Simulation Deployed (Local): ${intervention.name} successfully applied to cell ${cellId}.`,
      style: { marginTop: '50px' }
    });
  };

  // Reset Simulation for a cell
  const handleResetSimulation = async (cellId) => {
    try {
      const res = await fetch(`${API_BASE}/api/cells/${cellId}/reset`, {
        method: 'POST'
      });
      if (res.ok) {
        const updatedCell = await res.json();
        setGrids(prev => {
          const updatedCityGrid = prev[selectedCity].map(cell => {
            if (cell.id !== cellId) return cell;
            return updatedCell;
          });
          return { ...prev, [selectedCity]: updatedCityGrid };
        });
        message.info(`Simulation reset for cell ${cellId}.`);
        return;
      }
    } catch (err) {
      console.warn("FastAPI offline. Resetting client-side fallback simulation.");
    }

    setGrids(prev => {
      const updatedCityGrid = prev[selectedCity].map(cell => {
        if (cell.id !== cellId) return cell;
        return {
          ...cell,
          mitigated: false,
          lst: cell.originalLst,
          ndvi: cell.originalNdvi,
          severity: cell.originalSeverity,
          appliedIntervention: null
        };
      });

      return {
        ...prev,
        [selectedCity]: updatedCityGrid
      };
    });

    message.info(`Simulation reset for cell ${cellId}.`);
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    if (activeGridData.length === 0) return { avgLst: 0, criticalCount: 0, projectionTarget: 0 };
    
    let totalLst = 0;
    let criticalCount = 0;
    let totalOriginalLst = 0;
    let mitigatedZonesCount = 0;
    let totalMitigationReduction = 0;

    activeGridData.forEach(cell => {
      totalLst += cell.lst;
      totalOriginalLst += cell.originalLst;
      if (cell.severity === 'Severe' || cell.severity === 'High') {
        criticalCount++;
      }
      if (cell.mitigated && cell.appliedIntervention) {
        mitigatedZonesCount++;
        totalMitigationReduction += cell.appliedIntervention.lstImpact;
      }
    });

    const avgLst = totalLst / activeGridData.length;
    const avgOriginalLst = totalOriginalLst / activeGridData.length;
    const averageCoolingAchieved = avgOriginalLst - avgLst;

    // Simulated projection target calculation: target is to reach at least 1.5C reduction in average temperature in mitigated hotspots
    return {
      avgLst: parseFloat(avgLst.toFixed(2)),
      criticalCount,
      projectionTarget: parseFloat(averageCoolingAchieved.toFixed(2)),
      mitigatedZonesCount
    };
  }, [activeGridData]);

  // Donut chart distribution calculations
  const severityDistributionData = useMemo(() => {
    const counts = { Low: 0, Moderate: 0, High: 0, Severe: 0 };
    activeGridData.forEach(cell => {
      counts[cell.severity] = (counts[cell.severity] || 0) + 1;
    });

    return [
      { name: 'Low', value: counts.Low, color: '#10b981' },
      { name: 'Moderate', value: counts.Moderate, color: '#eab308' },
      { name: 'High', value: counts.High, color: '#f97316' },
      { name: 'Severe', value: counts.Severe, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [activeGridData]);

  // Seasonal trends data
  const seasonalTrendsData = useMemo(() => {
    return trends.length > 0 ? trends : generateSeasonalTrends(selectedCity);
  }, [trends, selectedCity]);

  // Run the data pipeline syncing simulation
  const runDataPipelineSync = () => {
    setPipelineState('running');
    setPipelineStep(0);
    setPipelineProgress(5);
    setPipelineLogs([`[${new Date().toLocaleTimeString()}] Initializing connection to ISRO MOSDAC FTP API portal...`]);

    const steps = [
      {
        progress: 30,
        log: `[${new Date().toLocaleTimeString()}] Connected. Querrying CartoSat-3 and Resourcesat-2A AWiFS bands for coordinates ${cityCenter.join(', ')}...`
      },
      {
        progress: 60,
        log: `[${new Date().toLocaleTimeString()}] Metada match found. Fetching GeoTIFF raster bundles (LST thermal band 10, NDVI red/NIR bands)...`
      },
      {
        progress: 85,
        log: `[${new Date().toLocaleTimeString()}] Raster extraction complete. Running raster parsing, projection alignment, and grid extraction (100 blocks)...`
      },
      {
        progress: 100,
        log: `[${new Date().toLocaleTimeString()}] Executing XGBoost thermal severity predictive model. ML inference runtime: 42ms. Updated severity bounds. Sync success.`
      }
    ];

    let currentStepIdx = 0;
    
    const interval = setInterval(async () => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setPipelineStep(currentStepIdx);
        setPipelineProgress(step.progress);
        setPipelineLogs(prev => [...prev, step.log]);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setPipelineState('success');
        setLastSyncTime(new Date().toLocaleTimeString());
        
        // Refresh cells from backend on successful sync
        try {
          const res = await fetch(`${API_BASE}/api/cities/${selectedCity}/grid`);
          if (res.ok) {
            const freshGrid = await res.json();
            setGrids(prev => ({ ...prev, [selectedCity]: freshGrid }));
            message.success("MOSDAC Pipeline sync complete. Synced metrics from FastAPI.");
            return;
          }
        } catch (err) {
          console.warn("FastAPI offline. Applying client-side environmental drift.");
        }

        // Slightly fluctuate LST in current grid as fallback
        setGrids(prev => {
          const updated = prev[selectedCity].map(cell => {
            const shift = (Math.sin(cell.row) * 0.15) - (Math.cos(cell.col) * 0.15); // tiny environmental drift
            const newOriginalLst = parseFloat((cell.originalLst + shift).toFixed(2));
            const newLst = cell.mitigated ? newOriginalLst - (cell.appliedIntervention?.lstImpact || 0) : newOriginalLst;
            
            let newSeverity = "Low";
            if (newLst >= 40.0) newSeverity = "Severe";
            else if (newLst >= 36.0) newSeverity = "High";
            else if (newLst >= 32.0) newSeverity = "Moderate";

            return {
              ...cell,
              originalLst: newOriginalLst,
              lst: newLst,
              severity: newSeverity
            };
          });
          return {
            ...prev,
            [selectedCity]: updated
          };
        });

        message.success("Bhuvan/MOSDAC Pipeline sync simulation complete. City metrics re-analyzed.");
      }
    }, 1800);
  };

  // Sidebar Menu Items
  const menuItems = [
    { key: 'map', icon: <MapIcon size={16} />, label: 'Map Workspace' },
    { key: 'planner', icon: <Calendar size={16} />, label: 'Intervention Planner' },
    { key: 'analytics', icon: <BarChart3 size={16} />, label: 'Analytics Hub' },
    { key: 'pipeline', icon: <Database size={16} />, label: 'Data Ingestion Pipeline' }
  ];

  // Hotspot Table Columns
  const tableColumns = [
    {
      title: 'Hotspot ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-mono font-bold text-sky-400">{text}</span>,
      sorter: (a, b) => a.id.localeCompare(b.id)
    },
    {
      title: 'Ward Name',
      dataIndex: 'ward',
      key: 'ward',
      sorter: (a, b) => a.ward.localeCompare(b.ward)
    },
    {
      title: 'LST (°C)',
      dataIndex: 'lst',
      key: 'lst',
      render: (val, record) => (
        <span className="flex items-center gap-1.5">
          <Thermometer size={14} className={record.severity === 'Severe' ? 'text-red-500' : 'text-orange-500'} />
          <span className="font-semibold">{val.toFixed(1)}°C</span>
          {record.mitigated && (
            <span className="text-xs text-sky-400 font-normal">
              (-{record.appliedIntervention.lstImpact}°C)
            </span>
          )}
        </span>
      ),
      sorter: (a, b) => a.lst - b.lst
    },
    {
      title: 'NDVI Score',
      dataIndex: 'ndvi',
      key: 'ndvi',
      render: (val) => (
        <span className="flex items-center gap-1.5">
          <Leaf size={14} className="text-emerald-500" />
          <span className="font-mono">{val.toFixed(2)}</span>
        </span>
      ),
      sorter: (a, b) => a.ndvi - b.ndvi
    },
    {
      title: 'Dominant LULC',
      dataIndex: 'lulc',
      key: 'lulc',
      render: (text) => {
        let color = 'cyan';
        if (text === 'Industrial Area') color = 'magenta';
        if (text === 'Commercial') color = 'purple';
        if (text === 'Urban Forest') color = 'green';
        if (text === 'Water Body') color = 'blue';
        return <Tag color={color} className="border-slate-800 font-sans">{text}</Tag>;
      }
    },
    {
      title: 'Exposure / Priority',
      key: 'priority',
      sorter: (a, b) => {
        const weightA = a.severity === 'Severe' ? 3 : 2;
        const weightB = b.severity === 'Severe' ? 3 : 2;
        return (weightA * a.popExposure) - (weightB * b.popExposure);
      },
      render: (_, record) => {
        const weight = record.severity === 'Severe' ? 3 : 2;
        const score = weight * record.popExposure;
        let color = 'orange';
        if (score > 150) color = 'red';
        else if (score < 80) color = 'yellow';

        return (
          <div className="flex flex-col gap-1 w-full max-w-[120px]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">{record.popExposure}k pop.</span>
              <span className={`font-semibold text-${color}-400 font-mono`}>{score}</span>
            </div>
            <Progress 
              percent={Math.min(100, (score / 225) * 100)} 
              size="tiny" 
              showInfo={false} 
              strokeColor={color === 'red' ? '#ef4444' : (color === 'orange' ? '#f97316' : '#eab308')} 
              trailColor="#1e293b"
            />
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        if (record.mitigated) {
          return (
            <div className="flex items-center gap-2">
              <Tag color="geekblue" className="border-slate-800 flex items-center gap-1 py-0.5">
                <CheckCircle2 size={12} className="text-sky-400" />
                <span>{record.appliedIntervention.budgetTier} Sim</span>
              </Tag>
              <Button 
                type="link" 
                size="small" 
                danger 
                onClick={() => handleResetSimulation(record.id)}
                className="p-0 text-xs"
              >
                Reset
              </Button>
            </div>
          );
        }

        return (
          <Select
            placeholder="Deploy Simulation"
            size="small"
            style={{ width: 140 }}
            className="custom-table-select text-xs"
            onChange={(val) => handleDeploySimulation(record.id, val)}
            dropdownStyle={{ background: '#0f172a', border: '1px solid #1e293b' }}
            options={INTERVENTIONS.map(item => ({
              value: item.key,
              label: (
                <div className="flex justify-between items-center w-full text-xs text-slate-300">
                  <span>{item.name.split(' ')[0]}...</span>
                  <Tag color={item.budgetTier === 'Low' ? 'green' : (item.budgetTier === 'Medium' ? 'blue' : 'purple')} className="border-none text-[9px] px-1 py-0 scale-90">
                    -{item.lstImpact}°C
                  </Tag>
                </div>
              )
            }))}
          />
        );
      }
    }
  ];

  return (
    <Layout className="min-h-screen bg-slate-950 font-sans text-slate-100">
      
      {/* Sidebar Shell */}
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        width={260}
        className="border-r border-slate-800 shadow-2xl z-20 flex flex-col justify-between"
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Project Branding */}
            <div className="px-6 py-6 border-b border-slate-800 flex flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
                  <Thermometer className="text-sky-400 w-5 h-5 animate-pulse" />
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent font-display">
                  UrbanTemp AI
                </span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase font-mono pl-1">
                ISRO Hackathon 2026
              </span>
            </div>

            {/* City Selector Dropdown */}
            <div className="px-4 py-4 border-b border-slate-800/60">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest pl-1 block mb-1.5 font-bold">
                Monitoring Area
              </span>
              <Select
                value={selectedCity}
                onChange={(val) => {
                  setSelectedCity(val);
                  setSelectedCell(null);
                  setDrawerVisible(false);
                  message.info(`Workspace focused on ${CITY_NAMES[val]}`);
                }}
                className="w-full custom-city-select"
                options={[
                  { value: 'delhi', label: `Delhi NCT (${cityAverages.delhi}°C)` },
                  { value: 'bengaluru', label: `Bengaluru (${cityAverages.bengaluru}°C)` },
                  { value: 'ahmedabad', label: `Ahmedabad (${cityAverages.ahmedabad}°C)` }
                ]}
              />
              <p className="text-[11px] text-slate-400 mt-2 pl-1 leading-relaxed">
                {CITY_DESCRIPTIONS[selectedCity]}
              </p>
            </div>

            {/* Sider Navigation Menu */}
            <div className="px-2 py-4">
              <Menu
                mode="inline"
                selectedKeys={[activeTab]}
                onClick={({ key }) => setActiveTab(key)}
                items={menuItems}
                className="border-none"
              />
            </div>
          </div>

          {/* Footer Logo of ISRO Subtag */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col items-center gap-1 text-center">
            <span className="text-[10px] text-slate-400 font-mono">Platform coordinated with</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-sky-400">
                🚀
              </div>
              <span className="text-xs font-semibold text-slate-300 font-display">ISRO SAC Gateway</span>
            </div>
          </div>
        </div>
      </Sider>

      {/* Main Content Layout */}
      <Layout className="flex-1 flex flex-col bg-slate-950">
        
        {/* Top Header Metrics KPI Bar */}
        <Header className="bg-slate-900/40 border-b border-slate-800 h-auto py-4 px-6 flex flex-wrap justify-between items-center gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-xl font-bold font-display text-slate-100 m-0 flex items-center gap-3">
              {CITY_NAMES[selectedCity]} Command Console
              <Tag color="red" className="animate-pulse border-red-500/30 bg-red-500/10 text-red-400 m-0">
                <AlertTriangle size={12} className="inline mr-1" />
                Heatwave Warning: +2.4°C Anomaly Detected
              </Tag>
            </h1>
            <span className="text-xs text-slate-400">
              Satellite LST & NDVI Heat Mitigation Engine
            </span>
          </motion.div>
          <Row gutter={16} className="flex-1 max-w-[650px] justify-end">
            <Col xs={12} sm={8} md={8}>
              <Card size="small" className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition">
                <Statistic
                  title={<span className="text-xs text-slate-400 font-sans">Avg City LST</span>}
                  value={kpis.avgLst}
                  precision={1}
                  suffix="°C"
                  styles={{ content: { color: kpis.avgLst > 35 ? '#f97316' : '#eab308', fontSize: '18px', fontWeight: 700 } }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={8}>
              <Card size="small" className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition">
                <Statistic
                  title={<span className="text-xs text-slate-400 font-sans">Active Hotspots</span>}
                  value={kpis.criticalCount}
                  styles={{ content: { color: kpis.criticalCount > 15 ? '#ef4444' : '#f97316', fontSize: '18px', fontWeight: 700 } }}
                  suffix={<span className="text-xs text-slate-400 font-normal"> / 100</span>}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small" className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition">
                <Statistic
                  title={<span className="text-xs text-slate-400 font-sans">Simulated Cooling</span>}
                  value={kpis.projectionTarget}
                  precision={2}
                  styles={{ content: { color: '#38bdf8', fontSize: '18px', fontWeight: 700 } }}
                  prefix="-"
                  suffix="°C Avg"
                />
              </Card>
            </Col>
          </Row>
        </Header>

        {/* Content Pane */}
        <Content className="p-6 overflow-y-auto">
          {activeTab === 'map' && (
            <div className="space-y-6">
              {/* Map Pane Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 10x10 Leaflet Grid Map Workspace (Span 2) */}
                <div className="lg:col-span-2 flex flex-col h-[520px] bg-slate-900/30 border border-slate-800 rounded-2xl p-4 shadow-xl">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="text-sky-400 w-4 h-4" />
                      <span className="font-semibold text-slate-200 text-sm font-display">
                        Interactive Thermal Grid Workspace (100 Zones)
                      </span>
                    </div>
                    {kpis.mitigatedZonesCount > 0 && (
                      <Tag color="blue" className="border-slate-800 text-xs">
                        {kpis.mitigatedZonesCount} Mitigations Active in Sandbox
                      </Tag>
                    )}
                  </div>
                  
                  {/* Leaflet Component Wrapper */}
                  <div className="flex-1 w-full h-full relative">
                    <LeafletMap 
                      cityCenter={cityCenter} 
                      gridData={activeGridData} 
                      selectedCell={activeSelectedCell}
                      onSelectCell={handleSelectCell}
                    />
                  </div>
                </div>

                {/* Right Interactive Selection / AI Insights Panel */}
                <div className="lg:col-span-1 flex flex-col justify-between h-[520px] bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl overflow-y-auto">
                  {activeSelectedCell ? (
                    <div className="space-y-4">
                      {/* Selected cell header */}
                      <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-100 font-display text-lg m-0">
                              Zone {activeSelectedCell.id}
                            </h3>
                            <Tag color={activeSelectedCell.severity === 'Severe' ? 'red' : (activeSelectedCell.severity === 'High' ? 'orange' : (activeSelectedCell.severity === 'Moderate' ? 'yellow' : 'green'))} className="text-xs border-none font-bold">
                              {activeSelectedCell.severity} UHI
                            </Tag>
                          </div>
                          <span className="text-xs text-slate-400">Ward: {activeSelectedCell.ward}</span>
                        </div>
                        {activeSelectedCell.mitigated && (
                          <Tag color="cyan" className="border-none font-mono text-xs animate-pulse">SIMULATED</Tag>
                        )}
                      </div>

                      {/* Stat parameters grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                            <Thermometer size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-mono">Land Temp</div>
                            <div className="text-sm font-bold text-slate-200">{activeSelectedCell.lst.toFixed(1)}°C</div>
                          </div>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <Leaf size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-mono">NDVI Index</div>
                            <div className="text-sm font-bold text-slate-200 font-mono">{activeSelectedCell.ndvi.toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-mono">Built Density</div>
                            <div className="text-sm font-bold text-slate-200">{activeSelectedCell.density}%</div>
                          </div>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Layers size={16} />
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-mono">LULC Class</div>
                            <div className="text-xs font-bold text-slate-200 truncate max-w-[90px]">{activeSelectedCell.lulc}</div>
                          </div>
                        </div>
                      </div>

                      {/* AI Insights Card */}
                      <Card className="bg-slate-950/60 border-slate-800 hover:border-slate-700 transition" size="small">
                        <div className="flex gap-2 text-slate-200">
                          <Sparkles size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-xs font-display text-yellow-400 block mb-1">Predictive AI Insights</span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {activeSelectedCell.severity === 'Severe' && `CRITICAL: Thermal canopy trap. Industrial/commercial concrete absorbing extreme load. Pop Exposure: ${activeSelectedCell.popExposure}k. Priority Score high.`}
                              {activeSelectedCell.severity === 'High' && `WARNING: Moderate concrete fraction with critical vegetation deficit. Heat emission spikes during solar noon.`}
                              {activeSelectedCell.severity === 'Moderate' && `NOTICE: Heat island build up. Normal residential parameters. Mitigating this cell blocks further thermal expansion.`}
                              {activeSelectedCell.severity === 'Low' && `STABLE: Buffered zone. Dense urban forest canopy or water bodies absorbing temperature load.`}
                            </p>
                          </div>
                        </div>
                      </Card>

                      {/* Interventions Section */}
                      <div>
                        <div className="text-xs font-mono text-slate-400 uppercase mb-2">Cooling Action Steps</div>
                        {activeSelectedCell.mitigated ? (
                          <div className="bg-sky-950/20 border border-sky-800/40 rounded-xl p-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sky-400">
                              <CheckCircle2 size={16} />
                              <span className="text-xs font-semibold">Active Simulation Model</span>
                            </div>
                            <div className="text-xs text-slate-300">
                              Applied: <strong className="text-slate-100">{activeSelectedCell.appliedIntervention.name}</strong><br/>
                              Cooling Impact: <strong className="text-emerald-400">-{activeSelectedCell.appliedIntervention.lstImpact}°C</strong> localized LST.<br/>
                              Est. Project Cost: <span className="text-slate-300">{activeSelectedCell.appliedIntervention.cost}</span>
                            </div>
                            <Button 
                              type="primary" 
                              danger 
                              ghost 
                              size="small" 
                              onClick={() => handleResetSimulation(activeSelectedCell.id)}
                              className="mt-1 text-xs"
                            >
                              Reset Sandbox State
                            </Button>
                          </div>
                        ) : (
                          <Timeline 
                            className="custom-sidebar-timeline mt-2"
                            items={INTERVENTIONS.map((item) => ({
                              color: item.budgetTier === 'Low' ? 'green' : (item.budgetTier === 'Medium' ? 'blue' : 'red'),
                              content: (
                                <div className="text-xs -mt-1 pb-1">
                                  <div className="flex justify-between items-start">
                                    <strong className="text-slate-200">{item.name}</strong>
                                    <Tag color={item.budgetTier === 'Low' ? 'green' : (item.budgetTier === 'Medium' ? 'blue' : 'purple')} className="scale-75 origin-right border-none -mr-3 m-0 py-0 text-[10px]">
                                      {item.budgetTier}
                                    </Tag>
                                  </div>
                                  <div className="text-slate-400 mt-0.5 leading-relaxed text-[11px]">{item.details}</div>
                                  <div className="flex justify-between items-center mt-1 border-t border-slate-900 pt-1">
                                    <span className="text-[10px] text-emerald-400 font-semibold font-mono">-{item.lstImpact}°C cooling</span>
                                    <Button 
                                      type="link" 
                                      size="small" 
                                      className="p-0 text-[11px] text-sky-400 flex items-center gap-0.5 hover:text-sky-300"
                                      onClick={() => handleDeploySimulation(activeSelectedCell.id, item.key)}
                                    >
                                      Simulate <ArrowRight size={10} />
                                    </Button>
                                  </div>
                                </div>
                              )
                            }))}
                          />
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                      <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center mb-3 text-slate-400">
                        <MapIcon size={20} />
                      </div>
                      <h4 className="font-semibold text-slate-300 mb-1 font-display">No Zone Selected</h4>
                      <p className="text-xs leading-relaxed max-w-[200px]">
                        Click any cell on the 10x10 thermal grid map to pull localized satellite variables and test cooling strategies.
                      </p>
                    </div>
                  )}

                  {/* Summary of active city totals */}
                  <div className="border-t border-slate-800/80 pt-3 mt-4 text-[11px] text-slate-400 flex justify-between font-mono">
                    <span>Active Cell: {selectedCell ? selectedCell.id : 'N/A'}</span>
                    <span>Total Blocks: 100</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="space-y-6">
              {/* Header Filters Panel */}
              <Card className="bg-slate-900/30 border-slate-800" size="small">
                <Row gutter={[24, 16]} align="middle">
                  <Col xs={24} sm={8} md={6}>
                    <span className="text-xs text-slate-400 font-mono block mb-1">Filter by Severity Level</span>
                    <Select
                      mode="multiple"
                      placeholder="Show All Severity Levels"
                      value={filterSeverity}
                      onChange={setFilterSeverity}
                      className="w-full"
                      allowClear
                      options={[
                        { value: 'Severe', label: <span className="text-red-400 font-semibold">Severe (&gt; 40°C)</span> },
                        { value: 'High', label: <span className="text-orange-400 font-semibold">High (36°C - 40°C)</span> },
                        { value: 'Moderate', label: <span className="text-yellow-400 font-semibold">Moderate (32°C - 36°C)</span> },
                        { value: 'Low', label: <span className="text-emerald-400 font-semibold">Low (&lt; 32°C)</span> }
                      ]}
                    />
                  </Col>

                  <Col xs={24} sm={8} md={8}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400 font-mono">Min Population Exposure</span>
                      <span className="text-xs text-sky-400 font-bold font-mono">{filterMinPop}k residents</span>
                    </div>
                    <Slider
                      min={0}
                      max={75}
                      value={filterMinPop}
                      onChange={setFilterMinPop}
                      tooltip={{ formatter: (v) => `${v}k residents` }}
                    />
                  </Col>

                  <Col xs={24} sm={8} md={6}>
                    <span className="text-xs text-slate-400 font-mono block mb-1">Primary Land Use (LULC)</span>
                    <Select
                      value={filterLulc}
                      onChange={setFilterLulc}
                      className="w-full"
                      options={[
                        { value: 'All', label: 'All Land Classes' },
                        { value: 'Commercial', label: 'Commercial' },
                        { value: 'Residential High-Density', label: 'Residential High-Density' },
                        { value: 'Industrial Area', label: 'Industrial Area' },
                        { value: 'Open Soil', label: 'Open Soil' }
                      ]}
                    />
                  </Col>

                  <Col xs={24} md={4} className="text-right">
                    <Button 
                      type="default" 
                      onClick={() => {
                        setFilterSeverity([]);
                        setFilterMinPop(0);
                        setFilterLulc('All');
                        message.info("Filters cleared");
                      }}
                      className="w-full border-slate-700 text-slate-300 hover:text-slate-100"
                    >
                      Reset Filters
                    </Button>
                  </Col>
                </Row>
              </Card>

              {/* Hotspot Table and Simulation Pane */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="text-sky-400 w-5 h-5" />
                    <span className="font-semibold text-slate-200 text-base font-display">
                      All City Grid Locations & Heat Mitigation Command
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Found {plannerHotspots.length} target zones matching query
                  </span>
                </div>

                <Table 
                  columns={tableColumns} 
                  dataSource={plannerHotspots} 
                  rowKey="id"
                  pagination={{ pageSize: 8, showSizeChanger: false }}
                  className="custom-antd-table"
                  locale={{
                    emptyText: (
                      <div className="py-10 text-center text-slate-500">
                        <AlertTriangle size={32} className="mx-auto text-slate-600 mb-2" />
                        <p className="text-sm">No critical hotspots found matching current filters.</p>
                      </div>
                    )
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              {/* Analytics Header Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-900/30 border-slate-800" size="small">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-mono">Zones Monitored</span>
                      <div className="text-xl font-bold font-display text-slate-200 mt-1">100 Blocks</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <Layers size={18} />
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-900/30 border-slate-800" size="small">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-mono">Severe Hotspots</span>
                      <div className="text-xl font-bold font-display text-red-500 mt-1">
                        {activeGridData.filter(c => c.severity === 'Severe').length} Zones
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-950/30 border border-red-900/20 flex items-center justify-center text-red-400">
                      <ShieldAlert size={18} />
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-900/30 border-slate-800" size="small">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-mono">Mitigated Sandboxes</span>
                      <div className="text-xl font-bold font-display text-sky-400 mt-1">
                        {kpis.mitigatedZonesCount} Active
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-sky-950/30 border border-sky-900/20 flex items-center justify-center text-sky-400">
                      <Cpu size={18} />
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-900/30 border-slate-800" size="small">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-mono">Net Mitigated Target</span>
                      <div className="text-xl font-bold font-display text-emerald-400 mt-1">
                        -{kpis.projectionTarget.toFixed(2)}°C City-wide
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-950/30 border border-emerald-900/20 flex items-center justify-center text-emerald-400">
                      <Thermometer size={18} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Recharts Pane */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Seasonal Trends Line/Area Chart */}
                <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-slate-200 font-display text-sm m-0">
                        Seasonal Thermal Correlation Index
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        Tracks the inverse relationship between Land Surface Temperature (LST) and vegetation depletion (NDVI)
                      </span>
                    </div>
                  </div>

                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={seasonalTrendsData}>
                        <defs>
                          <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                        
                        {/* Left Y Axis for LST */}
                        <YAxis 
                          yAxisId="left" 
                          orientation="left" 
                          stroke="#ef4444" 
                          domain={['auto', 'auto']}
                          label={{ value: 'LST Temperature (°C)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10, offset: 10 } }}
                          tick={{ fontSize: 10 }} 
                        />
                        
                        {/* Right Y Axis for NDVI */}
                        <YAxis 
                          yAxisId="right" 
                          orientation="right" 
                          stroke="#10b981" 
                          domain={[0, 1.0]}
                          label={{ value: 'Vegetation Index (NDVI)', angle: 90, position: 'insideRight', style: { fill: '#64748b', fontSize: 10 } }}
                          tick={{ fontSize: 10 }} 
                        />

                        <ChartTooltip 
                          contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        
                        {/* Area for NDVI */}
                        <Area 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="NDVI" 
                          name="NDVI vegetation index"
                          fill="url(#ndviGradient)" 
                          stroke="#10b981" 
                          strokeWidth={2}
                        />

                        {/* Line for LST */}
                        <Line 
                          yAxisId="left" 
                          type="monotone" 
                          dataKey="LST" 
                          name="LST Temp (°C)"
                          stroke="#ef4444" 
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Chart / Progress Rings for Severity Distribution */}
                <div className="lg:col-span-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200 font-display text-sm m-0">
                      Grid Severity Share
                    </h3>
                    <span className="text-[11px] text-slate-400 block mb-3">
                      Distribution of 100 grid cells across UHI thermal levels
                    </span>
                  </div>

                  <div className="flex-1 flex justify-center items-center h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {severityDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          contentStyle={{ background: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                          itemStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Centered Total Indicator */}
                    <div className="absolute flex flex-col justify-center items-center text-center">
                      <span className="text-xl font-bold text-slate-200">100</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Total Blocks</span>
                    </div>
                  </div>

                  {/* Custom list description */}
                  <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                    {severityDistributionData.map((item, idx) => {
                      const ranges = {
                        Low: '< 32°C',
                        Moderate: '32°C - 36°C',
                        High: '36°C - 40°C',
                        Severe: '> 40°C'
                      };
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-300 font-semibold">{item.name} Severity ({ranges[item.name]})</span>
                          </div>
                          <span className="text-slate-400 font-mono">
                            {item.value}% area ({item.value} cells)
                          </span>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              
              {/* Ingestion status card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Control Panel and Status steps */}
                <div className="lg:col-span-1 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[450px]">
                  <div>
                    <h3 className="font-bold text-slate-200 font-display text-sm m-0 flex items-center gap-1.5">
                      <Database className="text-sky-400 w-4 h-4" />
                      Ingestion Control Panel
                    </h3>
                    <span className="text-[11px] text-slate-400 block mb-4">
                      Trigger satellite data ingestion pipeline from ISRO Bhuvan/MOSDAC
                    </span>

                    <div className="space-y-4">
                      {/* Sync button trigger */}
                      <Button
                        type="primary"
                        onClick={runDataPipelineSync}
                        disabled={pipelineState === 'running'}
                        icon={<RefreshCw size={14} className={pipelineState === 'running' ? 'animate-spin' : ''} />}
                        className="w-full bg-sky-500 hover:bg-sky-600 border-none font-semibold flex items-center justify-center gap-2"
                        size="large"
                      >
                        {pipelineState === 'running' ? 'Syncing Satellite Hub...' : 'Trigger Pipeline Sync'}
                      </Button>

                      {pipelineState === 'running' && (
                        <div className="space-y-1 pt-2">
                          <div className="flex justify-between text-xs font-mono text-slate-400">
                            <span>Progress</span>
                            <span className="text-sky-400">{pipelineProgress}%</span>
                          </div>
                          <Progress percent={pipelineProgress} strokeColor="#38bdf8" showInfo={false} size="small" trailColor="#1e293b" />
                        </div>
                      )}

                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Connection Link:</span>
                          <Tag color="green" className="m-0 border-slate-800 text-[10px]">MOSDAC Gateway Active</Tag>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Satellite Sensor:</span>
                          <span className="font-semibold text-slate-200">Resourcesat-2A AWiFS</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Model Engine:</span>
                          <span className="font-mono text-slate-200">XGBoost-Regressor v2.4</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800/80 pt-2">
                          <span className="text-slate-400">Last Sync Time:</span>
                          <span className="font-semibold text-sky-400 font-mono">{lastSyncTime || 'Pending Trigger'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Warning Alert */}
                  <Alert
                    message="Pipeline Synchronization Sandboxed"
                    description="Executing sync shifts baseline temperatures of grid cells slightly to emulate diurnal environmental drifts."
                    type="info"
                    showIcon
                    className="border-slate-800 bg-slate-950/40 text-[11px] leading-snug"
                  />
                </div>

                {/* Steps and Streaming Terminal Logs (Span 2) */}
                <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[450px]">
                  <div>
                    <h3 className="font-bold text-slate-200 font-display text-sm m-0 mb-3">
                      Processing Pipeline Sequence
                    </h3>
                    
                    <Steps
                      direction="horizontal"
                      current={pipelineStep}
                      status={pipelineState === 'running' ? 'process' : (pipelineState === 'success' ? 'finish' : 'wait')}
                      size="small"
                      className="custom-pipeline-steps border-b border-slate-800/80 pb-4 mb-4"
                      items={[
                        { title: 'Raster Parsing', description: 'GeoTIFF ingestion' },
                        { title: 'API Integration', description: 'MOSDAC FTP query' },
                        { title: 'XGBoost Run', description: 'ML classification' }
                      ]}
                    />
                  </div>

                  {/* Simulated terminal block logs */}
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-y-auto text-emerald-400 flex flex-col justify-between shadow-inner">
                    <div className="space-y-1.5">
                      {pipelineLogs.map((log, idx) => (
                        <div key={idx} className="leading-relaxed whitespace-pre-wrap break-words">{log}</div>
                      ))}
                      {pipelineState === 'running' && (
                        <div className="text-sky-400 animate-pulse flex items-center gap-1.5 mt-2">
                          <span>█</span>
                          <span>Executing sync thread...</span>
                        </div>
                      )}
                      {pipelineLogs.length === 0 && (
                        <div className="text-slate-600 italic">Terminal stream idle. Awaiting pipeline sync trigger...</div>
                      )}
                    </div>
                    {pipelineState === 'success' && (
                      <div className="text-emerald-500 font-bold border-t border-emerald-950 pt-2 mt-4 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>[PIPELINE OK] Ingestion success. 100 cells re-mapped successfully.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </Content>

      </Layout>
    </Layout>
  );
}

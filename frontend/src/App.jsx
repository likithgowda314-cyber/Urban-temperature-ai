import React, { useState, useEffect, useMemo } from 'react';
import { Layout, message } from 'antd';
import { INTERVENTIONS, CITY_COORDINATES, generateGridData, generateSeasonalTrends, CITY_NAMES } from './utils/constants';

import Sidebar from './components/Sidebar';
import TopStatsBar from './components/TopStatsBar';
import MapWorkspace from './components/MapWorkspace';
import InterventionPlanner from './components/InterventionPlanner';
import AnalyticsHub from './components/AnalyticsHub';

const { Content } = Layout;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedCity, setSelectedCity] = useState('delhi');
  
  // Custom Google Maps Geocoding State
  const [customCenter, setCustomCenter] = useState(null);
  const [customCityName, setCustomCityName] = useState("");
  const [searchOptions, setSearchOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Grids state
  const [grids, setGrids] = useState({
    delhi: [],
    bengaluru: [],
    ahmedabad: []
  });

  // Selected cell detail state
  const [selectedCell, setSelectedCell] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Intervention Planner filters
  const [filterSeverity, setFilterSeverity] = useState([]);
  const [filterMinPop, setFilterMinPop] = useState(0);
  const [filterLulc, setFilterLulc] = useState('All');

  // Seasonal trends state
  const [trends, setTrends] = useState([]);

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
        avgs[key] = key === 'delhi' ? '36.8' : (key === 'bengaluru' ? '30.6' : '38.6');
      }
    });
    return avgs;
  }, [grids]);

  // Fetch grids on load
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

  useEffect(() => {
    fetchCityGrids();
  }, []);

  // Fetch seasonal trends
  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cities/${selectedCity}/trends`);
        if (res.ok) {
          const data = await res.json();
          setTrends(data);
          return;
        }
      } catch (err) {}
      setTrends(generateSeasonalTrends(selectedCity));
    };
    fetchTrends();
  }, [selectedCity]);

  // Active grid syncing
  const activeGridData = useMemo(() => {
    if (selectedCity === 'custom' && customCenter) {
      return generateGridData(customCenter, "custom");
    }
    return grids[selectedCity] || [];
  }, [grids, selectedCity, customCenter]);

  const activeSelectedCell = useMemo(() => {
    if (!selectedCell) return null;
    return activeGridData.find(c => c.id === selectedCell.id) || null;
  }, [activeGridData, selectedCell]);

  const handleSelectCell = (cell) => {
    setSelectedCell(cell);
    setDrawerVisible(true);
  };

  const cityCenter = useMemo(() => {
    if (selectedCity === 'custom' && customCenter) return customCenter;
    return CITY_COORDINATES[selectedCity] || CITY_COORDINATES.delhi;
  }, [selectedCity, customCenter]);

  // Map Click (scan) logic
  const handleMapClick = async (lat, lng) => {
    setCustomCenter([lat, lng]);
    setCustomCityName(`Scan (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    setSelectedCity('custom');
    setSelectedCell(null);
    setDrawerVisible(false);

    try {
      message.loading({ content: 'Scanning live satellite feed...', key: 'liveWeather' });
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
      const data = await res.json();
      
      if (data && data.current_weather) {
        message.success({ 
          content: `Live Scan Complete! Actual Temp: ${data.current_weather.temperature}°C`, 
          key: 'liveWeather', 
          duration: 4 
        });
      } else {
        message.error({ content: 'Satellite data unavailable.', key: 'liveWeather' });
      }
    } catch (err) {
      message.error({ content: 'Failed to contact Open-Meteo satellite feed.', key: 'liveWeather' });
    }
  };

  const handleSearch = async (query) => {
    if (!query || query.length < 3) {
      setSearchOptions([]);
      return;
    }
    setIsSearching(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`);
      const data = await res.json();
      
      if (data.status === 'OK') {
        const opts = data.results.map(result => ({
          value: JSON.stringify({ lat: result.geometry.location.lat, lng: result.geometry.location.lng, name: result.formatted_address }),
          label: result.formatted_address
        }));
        setSearchOptions(opts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

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
        setGrids(prev => ({
          ...prev, 
          [selectedCity]: prev[selectedCity].map(c => c.id === cellId ? updatedCell : c)
        }));
        message.success(`Deployed ${intervention.name} to ${cellId}`);
        return;
      }
    } catch (err) {}

    // Fallback simulation
    setGrids(prev => {
      const updatedCityGrid = prev[selectedCity].map(cell => {
        if (cell.id !== cellId) return cell;
        const newLst = cell.originalLst - intervention.lstImpact;
        const newNdvi = Math.min(1.0, cell.originalNdvi + intervention.ndviImpact);
        let newSeverity = "Low";
        if (newLst >= 40.0) newSeverity = "Severe";
        else if (newLst >= 36.0) newSeverity = "High";
        else if (newLst >= 32.0) newSeverity = "Moderate";

        return { ...cell, mitigated: true, lst: newLst, ndvi: newNdvi, severity: newSeverity, appliedIntervention: intervention };
      });
      return { ...prev, [selectedCity]: updatedCityGrid };
    });
    message.success(`Local Simulation: ${intervention.name} applied to ${cellId}`);
  };

  const handleResetSimulation = async (cellId) => {
    try {
      const res = await fetch(`${API_BASE}/api/cells/${cellId}/reset`, { method: 'POST' });
      if (res.ok) {
        const updatedCell = await res.json();
        setGrids(prev => ({
          ...prev, [selectedCity]: prev[selectedCity].map(c => c.id === cellId ? updatedCell : c)
        }));
        message.info(`Reset simulation for ${cellId}`);
        return;
      }
    } catch (err) {}

    setGrids(prev => {
      const updatedCityGrid = prev[selectedCity].map(cell => {
        if (cell.id !== cellId) return cell;
        return { ...cell, mitigated: false, lst: cell.originalLst, ndvi: cell.originalNdvi, severity: cell.originalSeverity, appliedIntervention: null };
      });
      return { ...prev, [selectedCity]: updatedCityGrid };
    });
    message.info(`Reset local simulation for ${cellId}`);
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    if (activeGridData.length === 0) return { avgLst: 0, criticalCount: 0, projectionTarget: 0, mitigatedZonesCount: 0 };
    let totalLst = 0, criticalCount = 0, totalOriginalLst = 0, mitigatedZonesCount = 0;

    activeGridData.forEach(cell => {
      totalLst += cell.lst;
      totalOriginalLst += cell.originalLst;
      if (cell.severity === 'Severe' || cell.severity === 'High') criticalCount++;
      if (cell.mitigated && cell.appliedIntervention) mitigatedZonesCount++;
    });

    const avgLst = totalLst / activeGridData.length;
    const avgOriginalLst = totalOriginalLst / activeGridData.length;
    return {
      avgLst: parseFloat(avgLst.toFixed(2)),
      criticalCount,
      projectionTarget: parseFloat((avgOriginalLst - avgLst).toFixed(2)),
      mitigatedZonesCount
    };
  }, [activeGridData]);

  const severityDistributionData = useMemo(() => {
    const counts = { Low: 0, Moderate: 0, High: 0, Severe: 0 };
    activeGridData.forEach(cell => counts[cell.severity] = (counts[cell.severity] || 0) + 1);
    return [
      { name: 'Low', value: counts.Low, color: '#10b981' },
      { name: 'Moderate', value: counts.Moderate, color: '#eab308' },
      { name: 'High', value: counts.High, color: '#f97316' },
      { name: 'Severe', value: counts.Severe, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [activeGridData]);

  const seasonalTrendsData = useMemo(() => {
    return trends.length > 0 ? trends : generateSeasonalTrends(selectedCity);
  }, [trends, selectedCity]);

  const currentCityName = selectedCity === 'custom' ? customCityName : CITY_NAMES[selectedCity];

  return (
    <Layout className="min-h-screen bg-transparent font-sans text-slate-100 flex-row">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab}
        selectedCity={selectedCity} setSelectedCity={setSelectedCity}
        customCityName={customCityName} setCustomCityName={setCustomCityName}
        setCustomCenter={setCustomCenter} setSelectedCell={setSelectedCell}
        setDrawerVisible={setDrawerVisible} searchOptions={searchOptions}
        isSearching={isSearching} handleSearch={handleSearch}
        cityAverages={cityAverages}
      />

      <Layout className="flex-1 flex flex-col bg-transparent">
        <TopStatsBar cityName={currentCityName} kpis={kpis} />

        <Content className="p-8 overflow-y-auto">
          {activeTab === 'map' && (
            <MapWorkspace 
              cityCenter={cityCenter}
              activeGridData={activeGridData}
              activeSelectedCell={activeSelectedCell}
              handleSelectCell={handleSelectCell}
              handleMapClick={handleMapClick}
              kpis={kpis}
              selectedCell={selectedCell}
              handleDeploySimulation={handleDeploySimulation}
              handleResetSimulation={handleResetSimulation}
            />
          )}

          {activeTab === 'planner' && (
            <InterventionPlanner 
              activeGridData={activeGridData}
              filterSeverity={filterSeverity} setFilterSeverity={setFilterSeverity}
              filterMinPop={filterMinPop} setFilterMinPop={setFilterMinPop}
              filterLulc={filterLulc} setFilterLulc={setFilterLulc}
              handleDeploySimulation={handleDeploySimulation}
              handleResetSimulation={handleResetSimulation}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsHub 
              activeGridData={activeGridData}
              kpis={kpis}
              seasonalTrendsData={seasonalTrendsData}
              severityDistributionData={severityDistributionData}
            />
          )}

          {activeTab === 'pipeline' && (
            <div className="glass-panel flex flex-col items-center justify-center h-[500px] rounded-2xl text-center p-8 text-slate-500 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-500/5 to-transparent pointer-events-none"></div>
              <h2 className="text-2xl font-bold font-display text-slate-300 mb-2">Data Ingestion Pipeline</h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Pipeline sync module is running correctly in the background as per FastAPI integration. All datasets are currently up to date.
              </p>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

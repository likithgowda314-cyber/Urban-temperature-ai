import React from 'react';
import { Layout, Menu, Select } from 'antd';
import { Thermometer, Map as MapIcon, Calendar, BarChart3, Database } from 'lucide-react';
import { CITY_NAMES, CITY_DESCRIPTIONS } from '../utils/constants';

const { Sider } = Layout;

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedCity,
  setSelectedCity,
  customCityName,
  setCustomCityName,
  setCustomCenter,
  setSelectedCell,
  setDrawerVisible,
  searchOptions,
  isSearching,
  handleSearch,
  cityAverages
}) {
  const menuItems = [
    { key: 'map', icon: <MapIcon size={16} />, label: 'Map Workspace' },
    { key: 'planner', icon: <Calendar size={16} />, label: 'Intervention Planner' },
    { key: 'analytics', icon: <BarChart3 size={16} />, label: 'Analytics Hub' },
    { key: 'pipeline', icon: <Database size={16} />, label: 'Data Pipeline' }
  ];

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
      width={280}
      className="glass-panel border-r border-slate-700/50 shadow-2xl z-20 flex flex-col justify-between"
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Project Branding */}
          <div className="px-6 py-6 border-b border-slate-700/50 flex flex-col items-start gap-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <Thermometer className="text-sky-400 w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent font-display">
                  UrbanTemp AI
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase font-mono">
                  ISRO Hackathon 2026
                </span>
              </div>
            </div>
          </div>

          {/* City Selector Dropdown */}
          <div className="px-5 py-5 border-b border-slate-700/50">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-2 font-bold">
              Monitoring Area
            </span>
            <Select
              showSearch
              placeholder="Search any global city..."
              value={selectedCity === 'custom' ? customCityName : selectedCity}
              defaultActiveFirstOption={false}
              suffixIcon={null}
              filterOption={false}
              onSearch={handleSearch}
              notFoundContent={isSearching ? "Searching Google Maps..." : null}
              onChange={(val) => {
                try {
                  const parsed = JSON.parse(val);
                  setCustomCenter([parsed.lat, parsed.lng]);
                  setCustomCityName(parsed.name);
                  setSelectedCity('custom');
                  setSelectedCell(null);
                  setDrawerVisible(false);
                } catch (e) {
                  setSelectedCity(val);
                  setCustomCenter(null);
                  setCustomCityName("");
                  setSelectedCell(null);
                  setDrawerVisible(false);
                }
              }}
              className="w-full"
              options={[
                { value: 'delhi', label: `Delhi NCT (${cityAverages.delhi}°C)` },
                { value: 'bengaluru', label: `Bengaluru (${cityAverages.bengaluru}°C)` },
                { value: 'ahmedabad', label: `Ahmedabad (${cityAverages.ahmedabad}°C)` },
                ...searchOptions
              ]}
            />
            <p className="text-[12px] text-slate-400 mt-3 leading-relaxed">
              {selectedCity === 'custom' ? `Monitoring custom global coordinates via Google Maps API.` : CITY_DESCRIPTIONS[selectedCity]}
            </p>
          </div>

          {/* Sider Navigation Menu */}
          <div className="px-3 py-5">
            <Menu
              mode="inline"
              selectedKeys={[activeTab]}
              onClick={({ key }) => setActiveTab(key)}
              items={menuItems}
              className="border-none bg-transparent"
            />
          </div>
        </div>

        {/* Footer Logo */}
        <div className="p-5 border-t border-slate-700/50 bg-slate-900/40 flex flex-col items-center gap-1 text-center backdrop-blur-md">
          <span className="text-[11px] text-slate-400 font-mono">Platform coordinated with</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-sky-400">
              🚀
            </div>
            <span className="text-sm font-semibold text-slate-200 font-display">ISRO SAC Gateway</span>
          </div>
        </div>
      </div>
    </Sider>
  );
}

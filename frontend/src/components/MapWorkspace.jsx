import React from 'react';
import { Tag } from 'antd';
import { Layers } from 'lucide-react';
import GoogleMapComponent from './GoogleMapComponent';
import HotspotDetails from './HotspotDetails';

export default function MapWorkspace({
  cityCenter,
  activeGridData,
  activeSelectedCell,
  handleSelectCell,
  handleMapClick,
  kpis,
  selectedCell,
  handleDeploySimulation,
  handleResetSimulation
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      
      {/* 10x10 Leaflet Grid Map Workspace (Span 2) */}
      <div className="lg:col-span-2 flex flex-col h-[650px] glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none z-0"></div>
        
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
              <Layers className="text-sky-400 w-5 h-5" />
            </div>
            <span className="font-bold text-slate-200 text-lg font-display tracking-wide">
              Interactive Thermal Grid
            </span>
          </div>
          {kpis.mitigatedZonesCount > 0 && (
            <Tag color="blue" className="bg-sky-500/10 border-sky-500/30 text-sky-400 font-mono text-xs px-3 py-1 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.2)]">
              {kpis.mitigatedZonesCount} Mitigations Active
            </Tag>
          )}
        </div>
        
        {/* Map Component Wrapper */}
        <div className="flex-1 w-full h-full relative z-10">
          <GoogleMapComponent 
            cityCenter={cityCenter} 
            gridData={activeGridData} 
            selectedCell={activeSelectedCell}
            onSelectCell={handleSelectCell}
            onMapClick={handleMapClick}
          />
        </div>
      </div>

      {/* Right Interactive Selection / AI Insights Panel */}
      <div className="lg:col-span-1 h-[650px]">
        <HotspotDetails 
          activeSelectedCell={activeSelectedCell}
          selectedCell={selectedCell}
          handleDeploySimulation={handleDeploySimulation}
          handleResetSimulation={handleResetSimulation}
        />
      </div>

    </div>
  );
}

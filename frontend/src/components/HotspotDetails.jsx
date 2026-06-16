import React from 'react';
import { Card, Tag, Timeline, Button } from 'antd';
import { Thermometer, Leaf, Building2, Layers, Sparkles, CheckCircle2, ArrowRight, Map as MapIcon } from 'lucide-react';
import { INTERVENTIONS } from '../utils/constants';

export default function HotspotDetails({ 
  activeSelectedCell, 
  selectedCell,
  handleDeploySimulation,
  handleResetSimulation 
}) {

  if (!activeSelectedCell) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center h-full rounded-2xl text-center p-8 text-slate-500 shadow-xl border border-slate-700/50 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none"></div>
        <div className="w-16 h-16 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4 text-slate-400 group-hover:text-sky-400 transition-colors group-hover:scale-110 duration-500 shadow-inner">
          <MapIcon size={24} />
        </div>
        <h4 className="font-bold text-slate-300 mb-2 font-display text-lg tracking-wide">No Zone Selected</h4>
        <p className="text-sm leading-relaxed max-w-[250px]">
          Select any cell on the thermal grid map to unlock localized satellite variables and test cooling strategies.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col h-full rounded-2xl shadow-xl overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400"></div>
      
      <div className="p-6 overflow-y-auto flex-1">
        <div className="space-y-5">
          {/* Selected cell header */}
          <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-100 font-display text-2xl m-0 tracking-tight">
                  Zone {activeSelectedCell.id}
                </h3>
                <Tag color={activeSelectedCell.severity === 'Severe' ? 'red' : (activeSelectedCell.severity === 'High' ? 'orange' : (activeSelectedCell.severity === 'Moderate' ? 'yellow' : 'green'))} className="text-xs border-none font-bold uppercase tracking-wider px-2 py-1 rounded">
                  {activeSelectedCell.severity} UHI
                </Tag>
              </div>
              <span className="text-sm text-slate-400 mt-1 block">Ward: {activeSelectedCell.ward}</span>
            </div>
            {activeSelectedCell.mitigated && (
              <Tag color="cyan" className="border-none font-mono text-xs animate-pulse bg-cyan-500/20 text-cyan-400 px-2 py-1">SIMULATED</Tag>
            )}
          </div>

          {/* Stat parameters grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel glass-panel-hover rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 shadow-inner">
                <Thermometer size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Land Temp</div>
                <div className="text-lg font-bold text-slate-200">{activeSelectedCell.lst.toFixed(1)}°C</div>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
                <Leaf size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">NDVI Index</div>
                <div className="text-lg font-bold text-slate-200 font-mono">{activeSelectedCell.ndvi.toFixed(2)}</div>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-inner">
                <Building2 size={18} />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Built Density</div>
                <div className="text-lg font-bold text-slate-200">{activeSelectedCell.density}%</div>
              </div>
            </div>

            <div className="glass-panel glass-panel-hover rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-inner">
                <Layers size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">LULC Class</div>
                <div className="text-sm font-bold text-slate-200 truncate">{activeSelectedCell.lulc}</div>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <Card className="glass-panel border-none relative overflow-hidden" size="small">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl"></div>
            <div className="flex gap-3 text-slate-200 relative z-10 p-1">
              <Sparkles size={20} className="text-yellow-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-sm font-display text-yellow-400 block mb-1.5 uppercase tracking-widest">Predictive AI Insights</span>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  {activeSelectedCell.severity === 'Severe' && `CRITICAL: Thermal canopy trap. Industrial/commercial concrete absorbing extreme load. Pop Exposure: ${activeSelectedCell.popExposure}k. Priority Score high.`}
                  {activeSelectedCell.severity === 'High' && `WARNING: Moderate concrete fraction with critical vegetation deficit. Heat emission spikes during solar noon.`}
                  {activeSelectedCell.severity === 'Moderate' && `NOTICE: Heat island build up. Normal residential parameters. Mitigating this cell blocks further thermal expansion.`}
                  {activeSelectedCell.severity === 'Low' && `STABLE: Buffered zone. Dense urban forest canopy or water bodies absorbing temperature load.`}
                </p>
              </div>
            </div>
          </Card>

          {/* Interventions Section */}
          <div className="pt-2">
            <div className="text-xs font-bold font-sans text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
              Cooling Action Steps
            </div>
            {activeSelectedCell.mitigated ? (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-[0_0_15px_rgba(56,189,248,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-sky-400/20 rounded-full blur-2xl"></div>
                <div className="flex items-center gap-2 text-sky-400 relative z-10">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-bold uppercase tracking-wider">Active Simulation Model</span>
                </div>
                <div className="text-sm text-slate-300 relative z-10 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                  Applied: <strong className="text-sky-300 text-base">{activeSelectedCell.appliedIntervention.name}</strong><br/>
                  Cooling Impact: <strong className="text-emerald-400 text-base">-{activeSelectedCell.appliedIntervention.lstImpact}°C</strong> localized LST.<br/>
                  Est. Project Cost: <span className="text-slate-400 font-mono text-xs">{activeSelectedCell.appliedIntervention.cost}</span>
                </div>
                <Button 
                  type="primary" 
                  danger 
                  ghost 
                  size="middle" 
                  onClick={() => handleResetSimulation(activeSelectedCell.id)}
                  className="mt-2 text-sm font-semibold tracking-wide border-red-500/50 hover:bg-red-500/10"
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
                    <div className="text-sm -mt-1 pb-3 glass-panel p-3 rounded-xl mb-3 border-l-4" style={{borderLeftColor: item.budgetTier === 'Low' ? '#10b981' : (item.budgetTier === 'Medium' ? '#3b82f6' : '#ef4444')}}>
                      <div className="flex justify-between items-start mb-1">
                        <strong className="text-slate-200 text-sm">{item.name}</strong>
                        <Tag color={item.budgetTier === 'Low' ? 'green' : (item.budgetTier === 'Medium' ? 'blue' : 'purple')} className="border-none m-0 py-0 text-[10px] font-bold uppercase tracking-wider px-2">
                          {item.budgetTier}
                        </Tag>
                      </div>
                      <div className="text-slate-400 mt-1 leading-relaxed text-xs">{item.details}</div>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700/50">
                        <span className="text-xs text-emerald-400 font-bold font-mono px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                          -{item.lstImpact}°C cooling
                        </span>
                        <Button 
                          type="link" 
                          size="small" 
                          className="p-0 text-xs font-bold text-sky-400 flex items-center gap-1 hover:text-sky-300 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                          onClick={() => handleDeploySimulation(activeSelectedCell.id, item.key)}
                        >
                          Simulate <ArrowRight size={12} />
                        </Button>
                      </div>
                    </div>
                  )
                }))}
              />
            )}
          </div>

        </div>
      </div>
      
      {/* Footer Info */}
      <div className="border-t border-slate-700/50 p-4 bg-slate-900/60 text-[11px] text-slate-400 flex justify-between font-mono shrink-0">
        <span>Active Zone: {selectedCell ? selectedCell.id : 'N/A'}</span>
        <span>Total Map Blocks: 400</span>
      </div>
    </div>
  );
}

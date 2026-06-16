import React from 'react';
import { Card, Row, Col } from 'antd';
import { Layers, ShieldAlert, Cpu, Thermometer } from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, 
  Tooltip as ChartTooltip, Legend, Area, Line, PieChart, Pie, Cell 
} from 'recharts';

export default function AnalyticsHub({ 
  activeGridData, 
  kpis, 
  seasonalTrendsData, 
  severityDistributionData 
}) {
  return (
    <div className="space-y-6">
      
      {/* Analytics Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-panel glass-panel-hover border-none relative overflow-hidden" size="small">
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-500/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between p-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold font-sans uppercase tracking-widest">Zones Monitored</span>
              <div className="text-3xl font-bold font-display text-slate-100 mt-1">400<span className="text-sm font-medium text-slate-400 ml-1">Blocks</span></div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400 shadow-inner">
              <Layers size={24} />
            </div>
          </div>
        </Card>

        <Card className="glass-panel glass-panel-hover border-none relative overflow-hidden" size="small">
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between p-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold font-sans uppercase tracking-widest">Severe Hotspots</span>
              <div className="text-3xl font-bold font-display text-red-500 mt-1">
                {activeGridData.filter(c => c.severity === 'Severe').length}
                <span className="text-sm font-medium text-slate-400 ml-1">Zones</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner">
              <ShieldAlert size={24} />
            </div>
          </div>
        </Card>

        <Card className="glass-panel glass-panel-hover border-none relative overflow-hidden" size="small">
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-sky-500/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between p-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold font-sans uppercase tracking-widest">Mitigated Sandboxes</span>
              <div className="text-3xl font-bold font-display text-sky-400 mt-1">
                {kpis.mitigatedZonesCount}
                <span className="text-sm font-medium text-slate-400 ml-1">Active</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
              <Cpu size={24} />
            </div>
          </div>
        </Card>

        <Card className="glass-panel glass-panel-hover border-none relative overflow-hidden" size="small">
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between p-2">
            <div>
              <span className="text-[10px] text-slate-400 font-bold font-sans uppercase tracking-widest">Net Mitigated Target</span>
              <div className="text-3xl font-bold font-display text-emerald-400 mt-1 flex items-baseline">
                -{kpis.projectionTarget.toFixed(2)}
                <span className="text-sm font-medium text-slate-400 ml-1">°C City-wide</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Thermometer size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recharts Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Seasonal Trends Line/Area Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h3 className="font-bold text-slate-100 font-display text-lg m-0 tracking-wide">
                Seasonal Thermal Correlation Index
              </h3>
              <span className="text-xs text-slate-400 font-medium mt-1 block">
                Tracks the inverse relationship between Land Surface Temperature (LST) and vegetation depletion (NDVI)
              </span>
            </div>
          </div>

          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={seasonalTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                
                {/* Left Y Axis for LST */}
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="#ef4444" 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fontWeight: 500 }} 
                  axisLine={false}
                  tickLine={false}
                />
                
                {/* Right Y Axis for NDVI */}
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#10b981" 
                  domain={[0, 1.0]}
                  tick={{ fontSize: 11, fontWeight: 500 }} 
                  axisLine={false}
                  tickLine={false}
                />

                <ChartTooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', color: '#f8fafc' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                  labelStyle={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 500 }} />
                
                <Area 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="NDVI" 
                  fill="url(#ndviGradient)" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Vegetation Index (NDVI)" 
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="LST" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#0f172a', strokeWidth: 2 }}
                  name="Land Temp (°C)" 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut Chart */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="mb-2 relative z-10">
            <h3 className="font-bold text-slate-100 font-display text-lg m-0 tracking-wide">
              UHI Severity Dist.
            </h3>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              Proportion of 400 tracked grid zones
            </span>
          </div>

          <div className="flex-1 w-full min-h-[300px] relative z-10 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {severityDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(51, 65, 85, 0.5)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc', fontWeight: 600, fontSize: '13px' }}
                  formatter={(value, name) => [`${value} Zones`, `${name} Severity`]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 500 }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Center Text for Donut Chart */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
              <span className="text-4xl font-bold font-display text-slate-200">400</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Total Zones</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

import React from 'react';
import { Layout, Row, Col, Card, Statistic, Tag } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const { Header } = Layout;

export default function TopStatsBar({ cityName, kpis }) {
  return (
    <Header className="glass-panel border-b border-slate-700/50 h-auto py-5 px-8 flex flex-wrap justify-between items-center gap-6 shadow-md z-10 relative">
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
      
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex-1 min-w-0 pr-4">
        <h1 className="text-xl lg:text-2xl font-bold font-display text-slate-100 m-0 flex items-center gap-4">
          <span className="truncate" title={`${cityName} Command Console`}>{cityName} Command Console</span>
          <Tag color="red" className="flex-shrink-0 animate-pulse border-red-500/30 bg-red-500/10 text-red-400 m-0 px-3 py-1 rounded-full flex items-center shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Heatwave Warning</span>
            <span className="sm:hidden">Warning</span>
          </Tag>
        </h1>
        <span className="text-sm text-slate-400 font-medium tracking-wide truncate block">
          Satellite LST & NDVI Heat Mitigation Engine
        </span>
      </motion.div>
      
      <Row gutter={16} className="w-auto justify-end flex-nowrap overflow-x-auto overflow-y-hidden pb-1 lg:pb-0 hide-scrollbar flex-shrink-0">
        <Col>
          <Card size="small" className="glass-panel glass-panel-hover overflow-hidden relative border-none min-w-[140px]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-xl"></div>
            <Statistic
              title={<span className="text-xs text-slate-400 font-sans tracking-wider uppercase font-semibold whitespace-nowrap">Avg City LST</span>}
              value={kpis.avgLst}
              precision={1}
              suffix="°C"
              styles={{ content: { color: kpis.avgLst > 35 ? '#f97316' : '#eab308', fontSize: '22px', fontWeight: 700 } }}
            />
          </Card>
        </Col>
        <Col>
          <Card size="small" className="glass-panel glass-panel-hover overflow-hidden relative border-none min-w-[140px]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl"></div>
            <Statistic
              title={<span className="text-xs text-slate-400 font-sans tracking-wider uppercase font-semibold whitespace-nowrap">Active Hotspots</span>}
              value={kpis.criticalCount}
              styles={{ content: { color: kpis.criticalCount > 15 ? '#ef4444' : '#f97316', fontSize: '22px', fontWeight: 700 } }}
              suffix={<span className="text-xs text-slate-500 font-normal ml-1">/ 400</span>}
            />
          </Card>
        </Col>
        <Col>
          <Card size="small" className="glass-panel glass-panel-hover overflow-hidden relative border-none min-w-[140px]">
            <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/10 rounded-full blur-xl"></div>
            <Statistic
              title={<span className="text-xs text-slate-400 font-sans tracking-wider uppercase font-semibold whitespace-nowrap">Simulated Cooling</span>}
              value={kpis.projectionTarget}
              precision={2}
              styles={{ content: { color: '#38bdf8', fontSize: '22px', fontWeight: 700 } }}
              prefix="-"
              suffix={<span className="text-sm font-normal ml-1">°C</span>}
            />
          </Card>
        </Col>
      </Row>
    </Header>
  );
}

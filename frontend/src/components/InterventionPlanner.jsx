import React, { useMemo } from 'react';
import { Card, Row, Col, Select, Slider, Button, Table, Progress, Tag } from 'antd';
import { AlertTriangle, Thermometer, Leaf, CheckCircle2, Layers } from 'lucide-react';
import { INTERVENTIONS } from '../utils/constants';

export default function InterventionPlanner({
  activeGridData,
  filterSeverity,
  setFilterSeverity,
  filterMinPop,
  setFilterMinPop,
  filterLulc,
  setFilterLulc,
  handleDeploySimulation,
  handleResetSimulation
}) {
  
  const plannerHotspots = useMemo(() => {
    return activeGridData.filter(cell => {
      if (filterSeverity.length > 0) {
        if (!filterSeverity.includes(cell.severity)) return false;
      }
      if (cell.popExposure < filterMinPop) return false;
      if (filterLulc !== 'All' && cell.lulc !== filterLulc) return false;
      return true;
    });
  }, [activeGridData, filterSeverity, filterMinPop, filterLulc]);

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
          <Thermometer size={16} className={record.severity === 'Severe' ? 'text-red-500' : 'text-orange-500'} />
          <span className="font-bold text-slate-200 text-sm">{val.toFixed(1)}°C</span>
          {record.mitigated && (
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              -{record.appliedIntervention.lstImpact}°C
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
          <Leaf size={16} className="text-emerald-500" />
          <span className="font-mono font-semibold text-slate-200">{val.toFixed(2)}</span>
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
        return <Tag color={color} className="border-none font-sans font-semibold tracking-wide px-2 py-0.5">{text}</Tag>;
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
        let strokeColor = '#f97316';
        if (score > 150) { color = 'red'; strokeColor = '#ef4444'; }
        else if (score < 80) { color = 'yellow'; strokeColor = '#eab308'; }

        return (
          <div className="flex flex-col gap-1 w-full max-w-[140px]">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">{record.popExposure}k pop.</span>
              <span className={`font-bold text-${color}-400 font-mono bg-${color}-500/10 px-1 rounded`}>{score} pts</span>
            </div>
            <Progress 
              percent={Math.min(100, (score / 225) * 100)} 
              size="small" 
              showInfo={false} 
              strokeColor={strokeColor} 
              trailColor="rgba(30, 41, 59, 0.5)"
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
            <div className="flex items-center gap-3">
              <Tag color="geekblue" className="border-sky-500/30 bg-sky-500/10 flex items-center gap-1.5 py-1 px-2">
                <CheckCircle2 size={14} className="text-sky-400" />
                <span className="font-bold tracking-wider">{record.appliedIntervention.budgetTier} SIM</span>
              </Tag>
              <Button 
                type="link" 
                size="small" 
                danger 
                onClick={() => handleResetSimulation(record.id)}
                className="p-0 text-xs font-bold tracking-wider hover:bg-red-500/10 px-2 py-0 rounded"
              >
                RESET
              </Button>
            </div>
          );
        }

        return (
          <Select
            placeholder="Deploy Simulation"
            size="middle"
            style={{ width: 160 }}
            className="custom-table-select font-semibold"
            onChange={(val) => handleDeploySimulation(record.id, val)}
            dropdownStyle={{ background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(51, 65, 85, 0.8)' }}
            options={INTERVENTIONS.map(item => ({
              value: item.key,
              label: (
                <div className="flex justify-between items-center w-full text-xs text-slate-200">
                  <span className="truncate max-w-[100px]">{item.name.split(' ')[0]}...</span>
                  <Tag color={item.budgetTier === 'Low' ? 'green' : (item.budgetTier === 'Medium' ? 'blue' : 'purple')} className="border-none text-[10px] px-1.5 py-0 font-bold">
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
    <div className="space-y-6">
      {/* Header Filters Panel */}
      <Card className="glass-panel border-none" size="small">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <span className="text-xs text-slate-400 font-bold font-sans uppercase tracking-widest block mb-2">Filter by Severity Level</span>
            <Select
              mode="multiple"
              placeholder="Show All Severity Levels"
              value={filterSeverity}
              onChange={setFilterSeverity}
              className="w-full font-semibold"
              allowClear
              options={[
                { value: 'Severe', label: <span className="text-red-400 font-bold">Severe (&gt; 40°C)</span> },
                { value: 'High', label: <span className="text-orange-400 font-bold">High (36°C - 40°C)</span> },
                { value: 'Moderate', label: <span className="text-yellow-400 font-bold">Moderate (32°C - 36°C)</span> },
                { value: 'Low', label: <span className="text-emerald-400 font-bold">Low (&lt; 32°C)</span> }
              ]}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400 font-bold font-sans uppercase tracking-widest">Min Population Exposure</span>
              <span className="text-xs text-sky-400 font-bold font-mono bg-sky-500/10 px-2 py-0.5 rounded">{filterMinPop}k residents</span>
            </div>
            <Slider
              min={0}
              max={75}
              value={filterMinPop}
              onChange={setFilterMinPop}
              tooltip={{ formatter: (v) => `${v}k residents` }}
              trackStyle={{ background: '#38bdf8' }}
              handleStyle={{ borderColor: '#38bdf8', background: '#0ea5e9' }}
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <span className="text-xs text-slate-400 font-bold font-sans uppercase tracking-widest block mb-2">Primary Land Use (LULC)</span>
            <Select
              value={filterLulc}
              onChange={setFilterLulc}
              className="w-full font-semibold"
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
              }}
              className="w-full bg-slate-800/50 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 font-bold tracking-wide"
            >
              RESET FILTERS
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Hotspot Table and Simulation Pane */}
      <div className="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
              <Layers className="text-sky-400 w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-xl font-display block">
                Heat Mitigation Command
              </span>
              <span className="text-xs text-slate-400 font-mono mt-1 block">
                Deploy ML-backed cooling simulations to high-priority zones
              </span>
            </div>
          </div>
          <Tag color="blue" className="bg-slate-900 border-slate-700 text-slate-300 font-mono text-sm px-4 py-1.5 rounded-full shadow-inner">
            <strong className="text-sky-400">{plannerHotspots.length}</strong> Target Zones Found
          </Tag>
        </div>

        <Table 
          columns={tableColumns} 
          dataSource={plannerHotspots} 
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: false, position: ['bottomCenter'] }}
          className="custom-antd-table relative z-10"
          locale={{
            emptyText: (
              <div className="py-16 text-center text-slate-500">
                <AlertTriangle size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
                <p className="text-base font-semibold tracking-wide">No critical hotspots found matching current filters.</p>
                <p className="text-sm mt-2 opacity-75">Try lowering the population exposure threshold or expanding LULC classes.</p>
              </div>
            )
          }}
        />
      </div>
    </div>
  );
}

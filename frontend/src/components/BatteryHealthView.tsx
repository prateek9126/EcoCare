import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  ReferenceLine 
} from 'recharts';
import type { StateData, CityData, ShowroomData } from '../types/salesCity';
import { 
  getModelHealthMetrics, 
  getModelSohTrends, 
  getAllFleetVehicles, 
  computeHealthDistribution, 
  computeBatteryHealthKpis
} from '../services/batteryHealthData';

interface BatteryHealthViewProps {
  selectedState?: StateData | null;
  selectedCity?: CityData | null;
  selectedShowroom?: ShowroomData | null;
  onClearCitySelection?: () => void;
  onNavigateToComparison?: (m1: string, m2: string) => void;
  companyBatteryHealth?: any[];
}

// High-contrast, premium palette
const MODEL_COLORS: Record<string, string> = {
  'E1': '#0E8360',               // Forest Emerald
  'E2': '#0284C7',               // Electric Sky Blue
  'E3': '#7C3AED',               // Royal Purple
  'EV 360': '#EF4444',           // Coral Red (Critical/Watch Model)
  'Model Y Long Range': '#F59E0B' // Golden Amber
};

const MODEL_CHEMISTRY: Record<string, string> = {
  'E1': 'LFP',
  'E2': 'LFP',
  'E3': 'LFP',
  'EV 360': 'NMC',
  'Model Y Long Range': 'NMC'
};

// Tiny SVG sparkline component for KPI cards
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 26;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Custom Glassmorphic Tooltip for SoH Trend Line Chart
const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const sortedPayload = [...payload].sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(8px)',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      padding: '0.85rem 1rem',
      boxShadow: '0 12px 28px -4px rgba(4, 42, 43, 0.12), 0 6px 12px -4px rgba(4, 42, 43, 0.08)',
      minWidth: '220px',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #F1F5F9',
        paddingBottom: '0.45rem',
        marginBottom: '0.55rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Activity size={13} style={{ color: '#0E8360' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#042A2B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label} Telemetry
          </span>
        </div>
        <span style={{ fontSize: '0.68rem', color: '#64748B', background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
          State of Health
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {sortedPayload.map((entry: any) => {
          const modelName = entry.dataKey;
          const color = entry.stroke || entry.color;
          const val = entry.value;
          const chem = MODEL_CHEMISTRY[modelName] || 'EV';
          const isWarning = val < 85;

          return (
            <div
              key={modelName}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                fontSize: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 0 2px ${color}25`
                }} />
                <span style={{ fontWeight: 700, color: '#1E293B' }}>{modelName}</span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600 }}>({chem})</span>
              </div>
              <strong style={{
                color: isWarning ? '#DC2626' : (val >= 90 ? '#0E8360' : '#D97706'),
                fontWeight: 800,
                fontSize: '0.82rem'
              }}>
                {val}%
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const BatteryHealthView: React.FC<BatteryHealthViewProps> = ({
  selectedState,
  selectedCity,
  selectedShowroom: _selectedShowroom,
  onClearCitySelection: _onClearCitySelection,
  onNavigateToComparison: _onNavigateToComparison,
  companyBatteryHealth: _companyBatteryHealth
}) => {
  // Timeframe for SoH Trend Line Chart
  const [trendTimeframe, setTrendTimeframe] = useState<'3M' | '6M' | '12M'>('12M');

  // Hidden models in multi-line chart legend
  const [hiddenModels, setHiddenModels] = useState<Record<string, boolean>>({});

  // Active Donut Slice Filter
  const [activeSliceFilter, setActiveSliceFilter] = useState<string | null>(null);

  // Retrieve base vehicles matching regional selection
  const allFleetVehicles = useMemo(() => {
    return getAllFleetVehicles(selectedState, selectedCity);
  }, [selectedState, selectedCity]);

  // Compute 4 KPI cards
  const kpis = useMemo(() => {
    return computeBatteryHealthKpis(allFleetVehicles);
  }, [allFleetVehicles]);

  // Compute Health Distribution buckets for Donut Chart
  const distributionBuckets = useMemo(() => {
    return computeHealthDistribution(allFleetVehicles);
  }, [allFleetVehicles]);

  // Get Model Health Comparative Metrics
  const rawModelMetrics = useMemo(() => {
    return getModelHealthMetrics(selectedState, selectedCity);
  }, [selectedState, selectedCity]);

  // SoH Trends for multi-line chart
  const sohTrendData = useMemo(() => {
    return getModelSohTrends(rawModelMetrics, trendTimeframe);
  }, [rawModelMetrics, trendTimeframe]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fade-in 0.3s ease-out' }}>
      
      {/* 1. ROW OF 4 KPI SUMMARY CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Card 1: Fleet Average SoH */}
        <div className="card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem', borderLeft: '4px solid #0E8360' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{kpis.fleetAvgSoh.title}</span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#042A2B', marginTop: '0.2rem' }}>
                {kpis.fleetAvgSoh.value}
              </div>
            </div>
            <Sparkline data={kpis.fleetAvgSoh.sparkline} color="#0E8360" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#0E8360', fontWeight: 700 }}>
            <TrendingUp size={14} />
            <span>{kpis.fleetAvgSoh.changeText}</span>
          </div>
        </div>

        {/* Card 2: Total Batteries Monitored */}
        <div className="card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem', borderLeft: '4px solid #0D9488' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{kpis.totalBatteries.title}</span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#042A2B', marginTop: '0.2rem' }}>
                {kpis.totalBatteries.value}
              </div>
            </div>
            <Sparkline data={kpis.totalBatteries.sparkline} color="#0D9488" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#0D9488', fontWeight: 700 }}>
            <TrendingUp size={14} />
            <span>{kpis.totalBatteries.changeText}</span>
          </div>
        </div>

        {/* Card 3: Batteries Below 80% SoH */}
        <div className="card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{kpis.below80Count.title}</span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#042A2B', marginTop: '0.2rem' }}>
                {kpis.below80Count.value}
              </div>
            </div>
            <Sparkline data={kpis.below80Count.sparkline} color="#F59E0B" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#D97706', fontWeight: 700 }}>
            <AlertTriangle size={14} />
            <span>{kpis.below80Count.changeText}</span>
          </div>
        </div>

        {/* Card 4: Overall Problem Rate */}
        <div className="card" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.75rem', borderLeft: '4px solid #DC2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{kpis.problemRate.title}</span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#042A2B', marginTop: '0.2rem' }}>
                {kpis.problemRate.value}
              </div>
            </div>
            <Sparkline data={kpis.problemRate.sparkline} color="#DC2626" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#0E8360', fontWeight: 700 }}>
            <TrendingDown size={14} />
            <span>{kpis.problemRate.changeText}</span>
          </div>
        </div>
      </div>

      {/* 2. CHARTS ROW: SOH TREND & DONUT DISTRIBUTION */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Chart A: SoH Trend by Model */}
        <div className="card" style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(4, 42, 43, 0.05)',
          background: '#ffffff'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0E8360', display: 'inline-block' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#042A2B' }}>
                  SoH Trend by Model
                </h3>
              </div>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
                Multi-model degradation velocity over service lifecycle
              </span>
            </div>

            {/* Apple/Linear style sleek pill timeframe toggle */}
            <div style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: '24px',
              border: '1px solid #E2E8F0'
            }}>
              {(['3M', '6M', '12M'] as const).map(tf => {
                const isActive = trendTimeframe === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setTrendTimeframe(tf)}
                    style={{
                      border: 'none',
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#042A2B' : '#64748B',
                      fontWeight: isActive ? 800 : 600,
                      padding: '0.28rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Line Chart */}
          <div style={{ width: '100%', height: 275 }}>
            <ResponsiveContainer>
              <LineChart data={sohTrendData} margin={{ top: 15, right: 15, left: -12, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                  dy={6}
                />
                <YAxis 
                  domain={[75, 100]} 
                  ticks={[75, 80, 85, 90, 95, 100]}
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  unit="%" 
                  dx={-4}
                />
                <ReferenceLine 
                  y={80} 
                  stroke="#FDA4AF" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{
                    value: '80% Warranty Threshold',
                    position: 'insideTopRight',
                    fill: '#E11D48',
                    fontSize: 10,
                    fontWeight: 700,
                    offset: 8
                  }}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                {rawModelMetrics.map(m => {
                  if (hiddenModels[m.model]) return null;
                  const color = MODEL_COLORS[m.model] || '#0E8360';
                  return (
                    <Line
                      key={m.model}
                      type="monotone"
                      dataKey={m.model}
                      stroke={color}
                      strokeWidth={2.4}
                      dot={false}
                      activeDot={{ 
                        r: 5, 
                        fill: color, 
                        stroke: '#ffffff', 
                        strokeWidth: 2.5 
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Legend with toggle pills */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.75rem',
            borderTop: '1px solid #F1F5F9',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
              {rawModelMetrics.map(m => {
                const isHidden = hiddenModels[m.model];
                const color = MODEL_COLORS[m.model] || '#0E8360';
                return (
                  <button
                    key={m.model}
                    onClick={() => setHiddenModels(prev => ({ ...prev, [m.model]: !prev[m.model] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: isHidden ? '#F8FAFC' : '#ffffff',
                      border: `1px solid ${isHidden ? '#E2E8F0' : '#CBD5E1'}`,
                      cursor: 'pointer',
                      opacity: isHidden ? 0.45 : 1,
                      padding: '0.28rem 0.65rem',
                      borderRadius: '20px',
                      transition: 'all 0.2s ease',
                      boxShadow: isHidden ? 'none' : '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    title={isHidden ? `Click to show ${m.model}` : `Click to hide ${m.model}`}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isHidden ? '#94A3B8' : color,
                      boxShadow: isHidden ? 'none' : `0 0 0 2px ${color}25`
                    }} />
                    <span style={{
                      fontSize: '0.76rem',
                      fontWeight: isHidden ? 500 : 700,
                      color: isHidden ? '#94A3B8' : '#042A2B',
                      textDecoration: isHidden ? 'line-through' : 'none'
                    }}>
                      {m.model}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: isHidden ? '#CBD5E1' : color,
                      background: isHidden ? 'transparent' : `${color}12`,
                      padding: '0.08rem 0.35rem',
                      borderRadius: '4px'
                    }}>
                      {m.avgSoh}%
                    </span>
                  </button>
                );
              })}
            </div>

            <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>
              Click to toggle model
            </span>
          </div>
        </div>

        {/* Chart B: Battery Health Distribution Donut */}
        <div className="card" style={{
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(4, 42, 43, 0.05)',
          background: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0D9488', display: 'inline-block' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#042A2B' }}>
                Battery Health Distribution
              </h3>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              Fleet breakdown across SoH degradation thresholds
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center', gap: '1rem' }}>
            {/* Donut */}
            <div style={{ width: '100%', height: 230, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={distributionBuckets}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    cursor="pointer"
                    onClick={(entry: any) => {
                      const key = entry?.key ? String(entry.key) : null;
                      if (!key) return;
                      if (activeSliceFilter === key) {
                        setActiveSliceFilter(null);
                      } else {
                        setActiveSliceFilter(key);
                      }
                    }}
                  >
                    {distributionBuckets.map((bucket) => (
                      <Cell 
                        key={bucket.key} 
                        fill={bucket.color} 
                        stroke={activeSliceFilter === bucket.key ? '#042A2B' : '#ffffff'} 
                        strokeWidth={activeSliceFilter === bucket.key ? 3 : 2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.8rem', borderRadius: '10px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} 
                    formatter={(val: any, name: any) => [`${val} batteries (${Math.round((Number(val) / allFleetVehicles.length) * 100)}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center text in donut */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#042A2B', lineHeight: 1.1 }}>
                  {allFleetVehicles.length}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Vehicles
                </div>
              </div>
            </div>

            {/* Bucket List Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {distributionBuckets.map(b => {
                const isActive = activeSliceFilter === b.key;
                return (
                  <div
                    key={b.key}
                    onClick={() => setActiveSliceFilter(isActive ? null : b.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(14, 131, 96, 0.08)' : '#F8FAFC',
                      border: `1px solid ${isActive ? 'var(--color-primary)' : '#F1F5F9'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: b.color }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#042A2B' }}>{b.name}</span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                      <strong style={{ color: '#042A2B' }}>{b.count}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginLeft: '0.25rem' }}>({b.percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
            Tip: Click any donut slice to highlight health threshold breakdown
          </div>
        </div>
      </div>

    </div>
  );
};

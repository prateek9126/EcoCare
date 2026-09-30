import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Car, 
  Battery, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Store, 
  User, 
  Phone, 
  ShieldAlert,
  Eye,
  X
} from 'lucide-react';
import type { 
  ShowroomData, 
  CityData, 
  StateData, 
  SoldVehicleData, 
  BatteryHealthStatus 
} from '../types/salesCity';

interface ShowroomVehiclesViewProps {
  showroom: ShowroomData;
  city: CityData;
  state: StateData;
  onBackToShowrooms: () => void;
  onBackToCities: () => void;
  onBackToStates: () => void;
  onSelectVehicle: (vehicle: SoldVehicleData) => void;
}

export const ShowroomVehiclesView: React.FC<ShowroomVehiclesViewProps> = ({
  showroom,
  city,
  state,
  onBackToShowrooms,
  onBackToCities,
  onBackToStates,
  onSelectVehicle
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [batteryFilter, setBatteryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BatteryHealthStatus>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'soh_asc' | 'soh_desc' | 'vid'>('date_desc');
  
  // Accordion collapsed state per group key (model + batteryType)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Extract unique models & battery packs for dropdowns
  const availableModels = useMemo(() => {
    return Array.from(new Set(showroom.vehicles.map(v => v.model)));
  }, [showroom.vehicles]);

  const availableBatteryTypes = useMemo(() => {
    return Array.from(new Set(showroom.vehicles.map(v => v.batteryType)));
  }, [showroom.vehicles]);

  // KPI Calculations
  const totalSold = showroom.vehicles.length;
  const avgSoh = showroom.averageSoh;
  const criticalCount = showroom.vehicles.filter(v => v.healthStatus === 'Critical').length;
  const warningCount = showroom.vehicles.filter(v => v.healthStatus === 'Warning').length;
  const attentionCount = criticalCount + warningCount;

  // Filter & sort vehicles
  const filteredVehicles = useMemo(() => {
    return showroom.vehicles.filter(v => {
      if (modelFilter !== 'ALL' && v.model !== modelFilter) return false;
      if (batteryFilter !== 'ALL' && v.batteryType !== batteryFilter) return false;
      if (statusFilter !== 'ALL' && v.healthStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = v.vehicleId.toLowerCase().includes(q);
        const matchVin = v.vin.toLowerCase().includes(q);
        const matchPack = v.batteryPackId.toLowerCase().includes(q);
        const matchCustomer = v.customerName.toLowerCase().includes(q);
        if (!matchId && !matchVin && !matchPack && !matchCustomer) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'soh_asc') return a.currentSoh - b.currentSoh;
      if (sortBy === 'soh_desc') return b.currentSoh - a.currentSoh;
      if (sortBy === 'vid') return a.vehicleId.localeCompare(b.vehicleId);
      // default: date_desc
      return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
    });
  }, [showroom.vehicles, searchQuery, modelFilter, batteryFilter, statusFilter, sortBy]);

  // Group vehicles by Model, then by Battery Pack / Type
  const groupedVehicles = useMemo(() => {
    const groups: {
      key: string;
      model: string;
      batteryType: string;
      vehicles: SoldVehicleData[];
      avgGroupSoh: number;
    }[] = [];

    const map = new Map<string, SoldVehicleData[]>();

    filteredVehicles.forEach(v => {
      const groupKey = `${v.model}___${v.batteryType}`;
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(v);
    });

    map.forEach((vehicles, key) => {
      const [model, batteryType] = key.split('___');
      const avg = Number((vehicles.reduce((acc, curr) => acc + curr.currentSoh, 0) / vehicles.length).toFixed(1));
      groups.push({
        key,
        model,
        batteryType,
        vehicles,
        avgGroupSoh: avg
      });
    });

    // Sort groups alphabetically by model
    return groups.sort((a, b) => a.model.localeCompare(b.model));
  }, [filteredVehicles]);

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fade-in 0.3s ease-out' }}>
      
      {/* BREADCRUMB STRIP & BACK ACTION */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '0.85rem 1.5rem',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', flexWrap: 'wrap' }}>
          <button
            onClick={onBackToStates}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
          >
            Sales Territory
          </button>
          <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
          <button
            onClick={onBackToCities}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
          >
            {state.name}
          </button>
          <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
          <button
            onClick={onBackToShowrooms}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}
          >
            {city.name}
          </button>
          <ChevronRight size={14} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
            {showroom.name}
          </span>
        </div>

        <button
          onClick={onBackToShowrooms}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--color-success-light)',
            border: '1px solid rgba(14, 131, 96, 0.2)',
            color: 'var(--color-success-hover)',
            borderRadius: '8px',
            padding: '0.4rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={14} />
          Change Showroom
        </button>
      </div>

      {/* SHOWROOM DETAILS HEADER CARD */}
      <div className="card" style={{
        padding: '1.5rem 1.75rem',
        background: 'linear-gradient(135deg, #ffffff 0%, #FAFCFB 100%)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#042A2B',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(4, 42, 43, 0.2)'
          }}>
            <Store size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(14, 131, 96, 0.1)', color: 'var(--color-primary)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                {showroom.code}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#042A2B' }}>
                {showroom.name}
              </h2>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              {showroom.address}, {city.name}, {state.name}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={15} style={{ color: 'var(--color-primary)' }} />
            <span>Manager: <strong>{showroom.manager}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Phone size={15} style={{ color: 'var(--color-primary)' }} />
            <span>{showroom.contact}</span>
          </div>
        </div>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--color-success-light)', color: 'var(--color-success-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Car size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#042A2B' }}>{totalSold}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Total Vehicles Sold</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#F1F5F9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Battery size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#042A2B' }}>{availableModels.length} Models</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{availableBatteryTypes.length} Battery Configurations</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(14, 131, 96, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: avgSoh >= 88 ? 'var(--color-success-hover)' : 'var(--color-warning)' }}>
              {avgSoh}%
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Fleet Average Battery SoH</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: attentionCount > 0 ? 'var(--color-danger-light)' : 'var(--color-success-light)', color: attentionCount > 0 ? 'var(--color-danger)' : 'var(--color-success-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: attentionCount > 0 ? 'var(--color-danger)' : 'var(--color-success-hover)' }}>
              {attentionCount}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Needing Attention ({criticalCount} Critical, {warningCount} Warn)
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="card" style={{
        padding: '1.15rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '0.4rem 0.85rem',
          width: '300px'
        }}>
          <Search size={15} style={{ color: 'var(--text-secondary)' }} />
          <input 
            type="text"
            placeholder="Search Vehicle ID, VIN, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '0.84rem',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Model */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Model</span>
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', background: '#fff' }}
            >
              <option value="ALL">All Models</option>
              {availableModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Battery Pack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Battery Pack</span>
            <select
              value={batteryFilter}
              onChange={(e) => setBatteryFilter(e.target.value)}
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', background: '#fff' }}
            >
              <option value="ALL">All Packs</option>
              {availableBatteryTypes.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Health Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', background: '#fff' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Healthy">Healthy (≥88%)</option>
              <option value="Warning">Warning (78-87%)</option>
              <option value="Critical">Critical (&lt;78%)</option>
            </select>
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '0.35rem 0.65rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', background: '#fff' }}
            >
              <option value="date_desc">Sale Date (Newest)</option>
              <option value="soh_asc">Lowest SoH (Urgent)</option>
              <option value="soh_desc">Highest SoH</option>
              <option value="vid">Vehicle ID</option>
            </select>
          </div>

          {(modelFilter !== 'ALL' || batteryFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setModelFilter('ALL');
                setBatteryFilter('ALL');
                setStatusFilter('ALL');
                setSearchQuery('');
              }}
              style={{
                alignSelf: 'flex-end',
                background: 'none',
                border: 'none',
                color: 'var(--color-danger)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.35rem 0.5rem'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE ACCORDION GROUPS: MODEL › BATTERY TYPE */}
      {groupedVehicles.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {groupedVehicles.map(group => {
            const isCollapsed = !!collapsedGroups[group.key];
            return (
              <div 
                key={group.key}
                className="card"
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-soft)'
                }}
              >
                {/* Accordion Group Header */}
                <div 
                  onClick={() => toggleGroupCollapse(group.key)}
                  style={{
                    padding: '1.15rem 1.5rem',
                    background: '#F8FAFC',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: 'var(--color-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Car size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#042A2B' }}>
                          {group.model}
                        </h3>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: 'rgba(14, 131, 96, 0.12)',
                          color: 'var(--color-primary)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {group.batteryType}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {group.vehicles.length} Vehicles in this configuration • Average Group SoH: <strong>{group.avgGroupSoh}%</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: group.avgGroupSoh >= 88 ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                      color: group.avgGroupSoh >= 88 ? 'var(--color-success-hover)' : 'var(--color-warning)'
                    }}>
                      {group.avgGroupSoh}% Avg SoH
                    </span>
                    {isCollapsed ? <ChevronDown size={20} style={{ color: 'var(--text-secondary)' }} /> : <ChevronUp size={20} style={{ color: 'var(--text-secondary)' }} />}
                  </div>
                </div>

                {/* Table of Vehicles inside Group */}
                {!isCollapsed && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ background: '#ffffff', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '0.85rem 1.25rem' }}>Vehicle ID / VIN</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Battery Pack ID</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Customer / Phone</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Sale Date</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Battery SoH (%)</th>
                          <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                          <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Telemetry Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.vehicles.map(v => (
                          <tr 
                            key={v.vehicleId}
                            onClick={() => onSelectVehicle(v)}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14, 131, 96, 0.04)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <td style={{ padding: '0.9rem 1.25rem' }}>
                              <div style={{ fontWeight: 800, color: '#042A2B' }}>{v.vehicleId}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{v.vin}</div>
                            </td>

                            <td style={{ padding: '0.9rem 1rem' }}>
                              <div style={{ fontWeight: 600, color: '#042A2B' }}>{v.batteryPackId}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{v.chargeCycles} cycles • {v.odometerKm.toLocaleString()} km</div>
                            </td>

                            <td style={{ padding: '0.9rem 1rem' }}>
                              <div style={{ fontWeight: 600, color: '#042A2B' }}>{v.customerName}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{v.customerPhone}</div>
                            </td>

                            <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                              {new Date(v.saleDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>

                            <td style={{ padding: '0.9rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{
                                  width: '45px',
                                  height: '6px',
                                  borderRadius: '3px',
                                  background: '#E2E8F0',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, v.currentSoh)}%`,
                                    background: v.healthStatus === 'Healthy' ? '#0E8360' : (v.healthStatus === 'Warning' ? '#D97706' : '#DC2626')
                                  }} />
                                </div>
                                <span style={{
                                  fontWeight: 800,
                                  color: v.healthStatus === 'Healthy' ? 'var(--color-success-hover)' : (v.healthStatus === 'Warning' ? 'var(--color-warning)' : 'var(--color-danger)')
                                }}>
                                  {v.currentSoh}%
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '0.9rem 1rem' }}>
                              <span style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                background: v.healthStatus === 'Healthy' ? 'var(--color-success-light)' : (v.healthStatus === 'Warning' ? 'var(--color-warning-light)' : 'var(--color-danger-light)'),
                                color: v.healthStatus === 'Healthy' ? 'var(--color-success-hover)' : (v.healthStatus === 'Warning' ? 'var(--color-warning)' : 'var(--color-danger)')
                              }}>
                                {v.healthStatus === 'Healthy' ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                                {v.healthStatus}
                              </span>
                            </td>

                            <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectVehicle(v);
                                }}
                                style={{
                                  background: 'var(--color-success-light)',
                                  border: '1px solid rgba(14, 131, 96, 0.2)',
                                  color: 'var(--color-success-hover)',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                <Eye size={12} />
                                Assessment History ({v.assessments.length})
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#042A2B' }}>No sold vehicles found</p>
          <span style={{ fontSize: '0.84rem' }}>Try adjusting your search criteria, model filter, or health status filter.</span>
        </div>
      )}

    </div>
  );
};

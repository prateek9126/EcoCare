import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Battery, 
  Download, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  User
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';
import type { SoldVehicleData } from '../types/salesCity';

interface VehicleAssessmentModalProps {
  vehicle: SoldVehicleData | null;
  showroomName: string;
  cityName: string;
  stateName: string;
  onClose: () => void;
}

export const VehicleAssessmentModal: React.FC<VehicleAssessmentModalProps> = ({
  vehicle,
  showroomName,
  cityName,
  stateName,
  onClose
}) => {
  const [expandedAssessmentId, setExpandedAssessmentId] = useState<string | null>(null);

  if (!vehicle) return null;

  // Chart telemetry data (oldest to newest for proper chronological trend)
  const chartData = [...vehicle.assessments]
    .sort((a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime())
    .map(a => ({
      date: new Date(a.assessmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }),
      soh: a.soh,
      capacity: a.usableCapacityKwh,
      cycles: a.chargeCycles,
      odometer: a.odometerKm,
      resistance: a.internalResistanceMohm,
      cellImbalance: a.cellVoltageImbalanceMv
    }));

  const exportCsv = () => {
    const headers = [
      'Assessment ID',
      'Assessment Date',
      'Service Center',
      'Assessor',
      'SoH (%)',
      'Usable Capacity (kWh)',
      'Nominal Capacity (kWh)',
      'Internal Resistance (mOhm)',
      'Cell Imbalance (mV)',
      'Avg Temp (C)',
      'Peak Temp (C)',
      'Cycles',
      'Odometer (km)',
      'DTC Codes',
      'Result',
      'Remarks'
    ];

    const rows = vehicle.assessments.map(a => [
      `"${a.id}"`,
      `"${a.assessmentDate}"`,
      `"${a.serviceCenter.replace(/"/g, '""')}"`,
      `"${a.assessedBy.replace(/"/g, '""')}"`,
      a.soh,
      a.usableCapacityKwh,
      a.originalCapacityKwh,
      a.internalResistanceMohm,
      a.cellVoltageImbalanceMv,
      a.avgTempCelsius,
      a.peakTempCelsius,
      a.chargeCycles,
      a.odometerKm,
      `"${a.dtcCodes.join('; ').replace(/"/g, '""')}"`,
      `"${a.result}"`,
      `"${a.remarks.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Battery_Assessments_${vehicle.vehicleId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleExpand = (id: string) => {
    setExpandedAssessmentId(prev => prev === id ? null : id);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(4, 42, 43, 0.55)',
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(4, 42, 43, 0.35)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          animation: 'fade-in 0.25s ease-out'
        }}
      >
        {/* HEADER BAR */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span style={{
                background: '#042A2B',
                color: '#ffffff',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}>
                {vehicle.model}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#042A2B' }}>
                Vehicle Diagnostics: {vehicle.vehicleId}
              </h2>
              <span style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: vehicle.healthStatus === 'Healthy' ? 'var(--color-success-light)' : (vehicle.healthStatus === 'Warning' ? 'var(--color-warning-light)' : 'var(--color-danger-light)'),
                color: vehicle.healthStatus === 'Healthy' ? 'var(--color-success-hover)' : (vehicle.healthStatus === 'Warning' ? 'var(--color-warning)' : 'var(--color-danger)')
              }}>
                {vehicle.healthStatus} Status ({vehicle.currentSoh}%)
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span>VIN: <strong style={{ color: '#042A2B' }}>{vehicle.vin}</strong></span>
              <span>Pack: <strong style={{ color: '#042A2B' }}>{vehicle.batteryPackId}</strong> ({vehicle.batteryType})</span>
              <span>Showroom: <strong>{showroomName}</strong> ({cityName}, {stateName})</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={exportCsv}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--color-success-light)',
                border: '1px solid rgba(14, 131, 96, 0.2)',
                color: 'var(--color-success-hover)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Download CSV report"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Print assessment report"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div style={{
          padding: '1.5rem 1.75rem',
          overflowY: 'auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* VEHICLE & OWNER OVERVIEW STRIP */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            background: '#F8FAFC',
            border: '1px solid var(--border-color)',
            padding: '1rem 1.25rem',
            borderRadius: '12px'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Name</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#042A2B', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={13} style={{ color: 'var(--color-primary)' }} />
                {vehicle.customerName}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{vehicle.customerPhone}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sale Date</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#042A2B', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
                {new Date(vehicle.saleDate).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Odo: {vehicle.odometerKm.toLocaleString()} km</div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Usable Capacity</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-success-hover)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Battery size={13} />
                {vehicle.assessments[0]?.usableCapacityKwh} kWh / {vehicle.assessments[0]?.originalCapacityKwh} kWh
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Cycles: {vehicle.chargeCycles} full cycles</div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Inspections</span>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#042A2B', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
                {vehicle.assessments.length} Logged Assessments
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Latest: {new Date(vehicle.assessments[0]?.assessmentDate).toLocaleDateString()}</div>
            </div>
          </div>

          {/* HISTORICAL SOH & CAPACITY DEGRADATION CHART */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-soft)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#042A2B' }}>
                  State-of-Health (SoH) & Capacity Retention Over Time
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Chronological telemetry trajectory across all dealer service center assessments
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0E8360', fontWeight: 700 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0E8360' }}></span>
                  SoH (%)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284C7', fontWeight: 700 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284C7' }}></span>
                  Usable Capacity (kWh)
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 10, right: 25, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" domain={[60, 100]} stroke="#0E8360" fontSize={11} tickLine={false} unit="%" />
                  <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} stroke="#0284C7" fontSize={11} tickLine={false} unit="kWh" />
                  <Tooltip 
                    contentStyle={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem', borderRadius: '8px', border: '1px solid #CBD5E1' }} 
                  />
                  <Line yAxisId="left" type="monotone" dataKey="soh" name="SoH (%)" stroke="#0E8360" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="capacity" name="Capacity (kWh)" stroke="#0284C7" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ASSESSMENT HISTORY TIMELINE */}
          <div>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.98rem', fontWeight: 800, color: '#042A2B' }}>
              Chronological Battery Assessment Timeline ({vehicle.assessments.length} Visits)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {vehicle.assessments.map((a, idx) => {
                const isExpanded = expandedAssessmentId === a.id;
                return (
                  <div
                    key={a.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      background: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-soft)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Collapsible Card Header */}
                    <div 
                      onClick={() => toggleExpand(a.id)}
                      style={{
                        padding: '1rem 1.25rem',
                        background: isExpanded ? 'rgba(14, 131, 96, 0.04)' : '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: idx === 0 ? 'var(--color-primary)' : '#E2E8F0',
                          color: idx === 0 ? '#ffffff' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 800
                        }}>
                          #{vehicle.assessments.length - idx}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#042A2B' }}>
                              {new Date(a.assessmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {idx === 0 && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--color-success-light)', color: 'var(--color-success-hover)', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                                LATEST
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {a.serviceCenter} • Evaluator: <strong>{a.assessedBy}</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: a.soh >= 88 ? 'var(--color-success-hover)' : (a.soh >= 78 ? 'var(--color-warning)' : 'var(--color-danger)')
                          }}>
                            {a.soh}% SoH
                          </span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            {a.usableCapacityKwh} kWh usable
                          </div>
                        </div>

                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: a.result === 'PASS' ? 'var(--color-success-light)' : (a.result === 'WARNING' ? 'var(--color-warning-light)' : 'var(--color-danger-light)'),
                          color: a.result === 'PASS' ? 'var(--color-success-hover)' : (a.result === 'WARNING' ? 'var(--color-warning)' : 'var(--color-danger)')
                        }}>
                          {a.result}
                        </span>

                        {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />}
                      </div>
                    </div>

                    {/* Detailed Diagnostic Expansion */}
                    {isExpanded && (
                      <div style={{
                        padding: '1.25rem',
                        borderTop: '1px solid var(--border-color)',
                        background: '#FAFCFB',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        fontSize: '0.82rem'
                      }}>
                        {/* Metrics grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '1rem',
                          background: '#ffffff',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)'
                        }}>
                          <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Internal Resistance:</span>
                            <div style={{ fontWeight: 700, color: a.internalResistanceMohm > 22 ? 'var(--color-danger)' : '#042A2B' }}>
                              {a.internalResistanceMohm} mΩ {a.internalResistanceMohm > 22 && '(Degraded)'}
                            </div>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Cell Voltage Imbalance:</span>
                            <div style={{ fontWeight: 700, color: a.cellVoltageImbalanceMv > 22 ? 'var(--color-danger)' : '#042A2B' }}>
                              {a.cellVoltageImbalanceMv} mV {a.cellVoltageImbalanceMv <= 15 ? '(Balanced)' : '(High Delta)'}
                            </div>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Temperature (Avg / Peak):</span>
                            <div style={{ fontWeight: 700, color: '#042A2B' }}>
                              {a.avgTempCelsius}°C / {a.peakTempCelsius}°C
                            </div>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>Odometer & Cycles:</span>
                            <div style={{ fontWeight: 700, color: '#042A2B' }}>
                              {a.odometerKm.toLocaleString()} km ({a.chargeCycles} cycles)
                            </div>
                          </div>
                        </div>

                        {/* DTC & Remarks */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                          <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Diagnostic DTC Codes</span>
                            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {a.dtcCodes.map((dtc, dtcIdx) => (
                                <span 
                                  key={dtcIdx}
                                  style={{
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    color: dtc.includes('None') ? 'var(--color-success-hover)' : 'var(--color-danger)',
                                    background: dtc.includes('None') ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                                    padding: '0.2rem 0.45rem',
                                    borderRadius: '4px'
                                  }}
                                >
                                  {dtc}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Inspector Technician Remarks</span>
                            <p style={{ margin: '0.4rem 0 0 0', lineHeight: '1.4', color: '#1E293B', fontSize: '0.82rem' }}>
                              {a.remarks}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div style={{
          padding: '0.85rem 1.75rem',
          borderTop: '1px solid var(--border-color)',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <span>Battery Pack ID: <strong>{vehicle.batteryPackId}</strong></span>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 1rem', fontSize: '0.82rem' }}
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};

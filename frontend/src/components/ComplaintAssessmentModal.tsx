import React, { useState, useEffect } from 'react';
import {
  X,
  Battery,
  ShieldCheck,
  Thermometer,
  Zap,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Gauge
} from 'lucide-react';
import {
  fetchVehicleAssessmentsForComplaint,
  type UnifiedBatteryAssessment,
  type VehicleAssessmentHistoryResult
} from '../services/assessmentLookupService';

interface ComplaintAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: {
    id?: number | string;
    ticketNumber?: string;
    vehicleId?: string; // VIN
    model?: string;
    manufacturer?: string;
    issueType?: string;
    category?: string;
    severity?: string;
    description?: string;
    reportedDate?: string;
    status?: string;
    [key: string]: any;
  } | null;
}

export const ComplaintAssessmentModal: React.FC<ComplaintAssessmentModalProps> = ({
  isOpen,
  onClose,
  complaint
}) => {
  const [loading, setLoading] = useState(true);
  const [historyResult, setHistoryResult] = useState<VehicleAssessmentHistoryResult | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const vin = complaint?.vehicleId || 'VIN-Unknown';
  const complaintDate = complaint?.reportedDate;
  const issueName = complaint?.issueType || complaint?.category || 'Customer Complaint';

  useEffect(() => {
    if (!isOpen || !complaint) return;

    let isMounted = true;
    setLoading(true);
    setSelectedIdx(0);

    fetchVehicleAssessmentsForComplaint(
      complaint.vehicleId || '',
      complaint.reportedDate,
      complaint.model,
      complaint.manufacturer
    )
      .then(res => {
        if (isMounted) {
          setHistoryResult(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHistoryResult(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  const priorList = historyResult?.priorAssessments || [];
  const currentAssessment: UnifiedBatteryAssessment | null =
    priorList.length > 0 ? priorList[selectedIdx] || priorList[0] : null;

  const isLatestPrior = selectedIdx === 0;

  // Format complaint reported date
  const formattedComplaintDate = complaintDate
    ? new Date(complaintDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recent';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(4, 42, 43, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem 1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(4, 42, 43, 0.4)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          animation: 'fade-in 0.25s ease-out'
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#042A2B',
                  color: '#ffffff',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}
              >
                VIN: {vin}
              </span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#042A2B' }}>
                Previous Assessment
              </h2>
              {currentAssessment && (
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background:
                      currentAssessment.overallResult === 'PASS'
                        ? '#DCFCE7'
                        : currentAssessment.overallResult === 'WARNING'
                        ? '#FEF3C7'
                        : '#FEE2E2',
                    color:
                      currentAssessment.overallResult === 'PASS'
                        ? '#15803D'
                        : currentAssessment.overallResult === 'WARNING'
                        ? '#B45309'
                        : '#B91C1C'
                  }}
                >
                  {currentAssessment.overallResult} ({currentAssessment.condition})
                </span>
              )}
            </div>

            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
              Evaluation history associated with complaint{' '}
              <strong style={{ color: '#0F172A' }}>
                {complaint.ticketNumber ? `Ticket #${complaint.ticketNumber}` : (complaint.id ? `ID: #${complaint.id}` : '')}
              </strong>{' '}
              ({issueName})
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Modal"
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F1F5F9')}
          >
            <X size={18} />
          </button>
        </div>

        {/* COMPLAINT CONTEXT BAR */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: '#F0FDF4',
            borderBottom: '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.78rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#166534', fontWeight: 600 }}>
              Connected Vehicle:{' '}
              <strong style={{ color: '#042A2B' }}>
                {historyResult?.vehicleModel || complaint.model || 'EV 360'} ({historyResult?.manufacturer || complaint.manufacturer || 'EV Company'})
              </strong>
            </span>
            <span style={{ color: '#166534' }}>
              Reported Date: <strong>{formattedComplaintDate}</strong>
            </span>
            <span
              style={{
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 800,
                background:
                  complaint.severity === 'HIGH'
                    ? '#FEE2E2'
                    : complaint.severity === 'MEDIUM'
                    ? '#FEF3C7'
                    : '#E0F2FE',
                color:
                  complaint.severity === 'HIGH'
                    ? '#DC2626'
                    : complaint.severity === 'MEDIUM'
                    ? '#D97706'
                    : '#0284C7'
              }}
            >
              Severity: {complaint.severity || 'HIGH'}
            </span>
          </div>
          <span style={{ color: '#15803D', fontWeight: 700, fontSize: '0.72rem' }}>
            READ-ONLY VIEW
          </span>
        </div>

        {/* MODAL BODY */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', gap: '1rem' }}>
              <div className="spinner"></div>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                Retrieving previous assessment history for VIN {vin}...
              </span>
            </div>
          ) : !currentAssessment ? (
            /* EMPTY STATE */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3.5rem 1.5rem',
                textAlign: 'center',
                background: '#F8FAFC',
                borderRadius: '12px',
                border: '1px dashed #CBD5E1',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B'
                }}
              >
                <HelpCircle size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                No previous assessment found for this vehicle.
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', maxWidth: '440px', lineHeight: 1.5 }}>
                There are no completed battery health evaluations recorded for VIN{' '}
                <strong style={{ color: '#042A2B' }}>{vin}</strong> prior to the complaint date (
                {formattedComplaintDate}).
              </p>
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.75rem',
                  color: '#475569'
                }}
              >
                VIN: <strong>{vin}</strong> • Vehicle:{' '}
                <strong>{complaint.model || 'EV'}</strong>
              </div>
            </div>
          ) : (
            <>
              {/* TIMELINE / OLDER ASSESSMENTS SELECTOR */}
              {priorList.length > 1 && (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#042A2B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Assessment Timeline ({priorList.length} prior records)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        disabled={selectedIdx === 0}
                        onClick={() => setSelectedIdx((prev) => Math.max(0, prev - 1))}
                        style={{
                          background: selectedIdx === 0 ? '#F1F5F9' : '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          padding: '0.2rem 0.4rem',
                          color: selectedIdx === 0 ? '#94A3B8' : '#0F172A',
                          cursor: selectedIdx === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Newer prior assessment"
                      >
                        <ChevronLeft size={14} /> Newer
                      </button>
                      <button
                        disabled={selectedIdx === priorList.length - 1}
                        onClick={() => setSelectedIdx((prev) => Math.min(priorList.length - 1, prev + 1))}
                        style={{
                          background: selectedIdx === priorList.length - 1 ? '#F1F5F9' : '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          padding: '0.2rem 0.4rem',
                          color: selectedIdx === priorList.length - 1 ? '#94A3B8' : '#0F172A',
                          cursor: selectedIdx === priorList.length - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Older prior assessment"
                      >
                        Older <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                    {priorList.map((item, idx) => {
                      const isActive = idx === selectedIdx;
                      return (
                        <button
                          key={item.id || idx}
                          onClick={() => setSelectedIdx(idx)}
                          style={{
                            flexShrink: 0,
                            padding: '0.4rem 0.75rem',
                            borderRadius: '6px',
                            border: isActive ? '1.5px solid #0E8360' : '1px solid #CBD5E1',
                            background: isActive ? '#0E8360' : '#FFFFFF',
                            color: isActive ? '#FFFFFF' : '#334155',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            fontWeight: isActive ? 700 : 500,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{idx === 0 ? 'Latest Pre-Complaint' : `Older (#${idx + 1})`}:</span>
                          <strong>{item.formattedDate.split(',')[0]}</strong>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '4px',
                              background: isActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                              color: isActive ? '#FFFFFF' : '#0E8360',
                              fontWeight: 800
                            }}
                          >
                            {item.soh}% SoH
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACTIVE ASSESSMENT SUMMARY BANNER */}
              <div
                style={{
                  background: isLatestPrior ? '#F0FDF4' : '#F8FAFC',
                  border: isLatestPrior ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} style={{ color: '#0E8360' }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                      Assessment Date & Timestamp
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: '#042A2B' }}>
                      {currentAssessment.formattedDate}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {isLatestPrior ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: '#DCFCE7',
                        color: '#15803D',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '20px',
                        border: '1px solid #86EFAC'
                      }}
                    >
                      ✓ Most Recent Before Complaint
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: '#F1F5F9',
                        color: '#475569',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '20px'
                      }}
                    >
                      Archived Assessment Record
                    </span>
                  )}
                </div>
              </div>

              {/* KEY ASSESSMENT METRICS GRID */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.85rem'
                }}
              >
                {/* 1. BATTERY SOH */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Battery SoH
                    </span>
                    <Battery size={16} style={{ color: '#0E8360' }} />
                  </div>
                  <strong style={{ fontSize: '1.65rem', color: '#042A2B' }}>
                    {currentAssessment.soh}%
                  </strong>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color:
                        currentAssessment.healthStatus === 'Healthy'
                          ? '#15803D'
                          : currentAssessment.healthStatus === 'Good'
                          ? '#0D9488'
                          : currentAssessment.healthStatus === 'Warning'
                          ? '#D97706'
                          : '#DC2626'
                    }}
                  >
                    Status: {currentAssessment.healthStatus}
                  </span>
                </div>

                {/* 2. BATTERY CAPACITY */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Battery Capacity
                    </span>
                    <Layers size={16} style={{ color: '#0E8360' }} />
                  </div>
                  <strong style={{ fontSize: '1.35rem', color: '#042A2B' }}>
                    {currentAssessment.usableCapacityKwh} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>kWh</span>
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Nominal: <strong>{currentAssessment.nominalCapacityKwh} kWh</strong> (
                    {((currentAssessment.usableCapacityKwh / currentAssessment.nominalCapacityKwh) * 100).toFixed(1)}% usable)
                  </span>
                </div>

                {/* 3. DEGRADATION PERCENTAGE */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Degradation %
                    </span>
                    <RotateCcw size={16} style={{ color: '#DC2626' }} />
                  </div>
                  <strong style={{ fontSize: '1.65rem', color: currentAssessment.degradationPercent > 12 ? '#DC2626' : '#042A2B' }}>
                    {currentAssessment.degradationPercent}%
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Lost: <strong>{(currentAssessment.nominalCapacityKwh - currentAssessment.usableCapacityKwh).toFixed(2)} kWh</strong>
                  </span>
                </div>

                {/* 4. SAFETY SCORE */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Safety Score
                    </span>
                    <ShieldCheck size={16} style={{ color: '#0E8360' }} />
                  </div>
                  <strong style={{ fontSize: '1.65rem', color: '#042A2B' }}>
                    {currentAssessment.safetyScore} <span style={{ fontSize: '0.9rem', color: '#64748B' }}>/ 100</span>
                  </strong>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color:
                        currentAssessment.riskLevel === 'LOW'
                          ? '#15803D'
                          : currentAssessment.riskLevel === 'MEDIUM'
                          ? '#D97706'
                          : '#DC2626'
                    }}
                  >
                    Risk Level: {currentAssessment.riskLevel}
                  </span>
                </div>

                {/* 5. CHARGING CYCLES */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Charging Cycles
                    </span>
                    <Zap size={16} style={{ color: '#0D9488' }} />
                  </div>
                  <strong style={{ fontSize: '1.45rem', color: '#042A2B' }}>
                    {currentAssessment.chargeCycles}{' '}
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748B' }}>cycles</span>
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {currentAssessment.chargingSplit.label}
                  </span>
                </div>

                {/* 6. TEMPERATURE FACTORS */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Temperature
                    </span>
                    <Thermometer size={16} style={{ color: '#0E8360' }} />
                  </div>
                  <strong style={{ fontSize: '1.45rem', color: '#042A2B' }}>
                    {currentAssessment.temperature.avgCelsius}°C
                  </strong>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color:
                        currentAssessment.temperature.status === 'Optimal' || currentAssessment.temperature.status === 'Normal'
                          ? '#15803D'
                          : '#DC2626'
                    }}
                  >
                    Pack Status: {currentAssessment.temperature.status}
                    {currentAssessment.temperature.peakCelsius && (
                      <span style={{ fontWeight: 400, color: '#64748B' }}>
                        {' '}(Peak: {currentAssessment.temperature.peakCelsius}°C)
                      </span>
                    )}
                  </span>
                </div>

                {/* 7. BATTERY HEALTH SCORE */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Health Score
                    </span>
                    <Gauge size={16} style={{ color: '#0E8360' }} />
                  </div>
                  <strong style={{ fontSize: '1.65rem', color: '#042A2B' }}>
                    {currentAssessment.batteryHealthScore}{' '}
                    <span style={{ fontSize: '0.9rem', color: '#64748B' }}>/ 100</span>
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Overall condition: <strong>{currentAssessment.condition}</strong>
                  </span>
                </div>

                {/* 8. OVERALL RESULT */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      Assessment Result
                    </span>
                    <CheckCircle size={16} style={{ color: '#0E8360' }} />
                  </div>
                  <strong
                    style={{
                      fontSize: '1.45rem',
                      color:
                        currentAssessment.overallResult === 'PASS'
                          ? '#15803D'
                          : currentAssessment.overallResult === 'WARNING'
                          ? '#B45309'
                          : '#B91C1C'
                    }}
                  >
                    {currentAssessment.overallResult}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    Evaluation Verdict: <strong>{currentAssessment.condition}</strong>
                  </span>
                </div>
              </div>

              {/* VEHICLE TELEMETRY INFO STRIP */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: '#475569',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <span>
                  Model:{' '}
                  <strong style={{ color: '#042A2B' }}>
                    {historyResult?.vehicleModel || complaint.model}
                  </strong>
                </span>
                <span>
                  Manufacturer:{' '}
                  <strong style={{ color: '#042A2B' }}>
                    {historyResult?.manufacturer || complaint.manufacturer}
                  </strong>
                </span>
                {currentAssessment.odometerKm !== undefined && (
                  <span>
                    Odometer:{' '}
                    <strong style={{ color: '#042A2B' }}>
                      {currentAssessment.odometerKm.toLocaleString()} km
                    </strong>
                  </span>
                )}
                {currentAssessment.batteryAgeYears !== undefined && (
                  <span>
                    Battery Age:{' '}
                    <strong style={{ color: '#042A2B' }}>
                      {currentAssessment.batteryAgeYears} yrs
                    </strong>
                  </span>
                )}
                {currentAssessment.cellVoltageImbalanceMv !== undefined && (
                  <span>
                    Cell Imbalance:{' '}
                    <strong style={{ color: '#042A2B' }}>
                      {currentAssessment.cellVoltageImbalanceMv} mV
                    </strong>
                  </span>
                )}
              </div>

              {/* TWO COLUMN DETAIL: KEY FACTORS & RECOMMENDATIONS */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1rem'
                }}
              >
                {/* KEY FACTORS AFFECTING ASSESSMENT */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={16} style={{ color: '#0E8360' }} />
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#042A2B' }}>
                      Key Factors Affecting Assessment
                    </h4>
                  </div>

                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.4rem', lineHeight: 1.45 }}>
                    {currentAssessment.keyFactors.map((factor, fIdx) => (
                      <li key={fIdx}>{factor}</li>
                    ))}
                  </ul>

                  {currentAssessment.explanation && (
                    <div
                      style={{
                        marginTop: '0.25rem',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        background: '#F8FAFC',
                        fontSize: '0.76rem',
                        color: '#475569',
                        fontStyle: 'italic',
                        borderLeft: '3px solid #0E8360'
                      }}
                    >
                      "{currentAssessment.explanation}"
                    </div>
                  )}
                </div>

                {/* PREVIOUS RECOMMENDATIONS */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={16} style={{ color: '#0E8360' }} />
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#042A2B' }}>
                      Previous Recommendations
                    </h4>
                  </div>

                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.4rem', lineHeight: 1.45 }}>
                    {currentAssessment.recommendations.map((rec, rIdx) => (
                      <li key={rIdx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: '#64748B'
          }}
        >
          <span>
            Connected VIN: <strong style={{ color: '#042A2B' }}>{vin}</strong>
          </span>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: '0.4rem 1.25rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

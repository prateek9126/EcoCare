import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Battery,
  Info,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FileText,
  X,
  Search,
  ShieldCheck,
  BarChart3,
  Wrench,
  DollarSign,
  Layers,
  Car,
  AlertCircle,
  MapPin,
  ChevronDown,
  Store,
  Users,
  MessageSquareWarning,
  PlusCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { SalesCityModal } from './SalesCityModal';
import { ShowroomVehiclesView } from './ShowroomVehiclesView';
import { VehicleAssessmentModal } from './VehicleAssessmentModal';
import { BatteryHealthView } from './BatteryHealthView';
import { RaiseComplaintModal } from './RaiseComplaintModal';
import { ComplaintAssessmentModal } from './ComplaintAssessmentModal';
import type { 
  StateData, 
  CityData, 
  ShowroomData, 
  SoldVehicleData 
} from '../types/salesCity';
import { 
  getSalesCityDataset, 
  saveSelectedLocationToStorage, 
  getSelectedLocationFromStorage, 
  clearSelectedLocationStorage,
  computeCityMonthlySales
} from '../services/salesCityData';

interface CompanyDashboardProps {
  user: any;
  setView: (v: 'main' | 'report' | 'passport' | 'secondlife' | 'company') => void;
  companyTab: 'dashboard' | 'models' | 'sales' | 'health' | 'service' | 'problems' | 'comparison' | 'insights';
  setCompanyTab: (t: 'dashboard' | 'models' | 'sales' | 'health' | 'service' | 'problems' | 'comparison' | 'insights') => void;
  companySummary: any;
  companySales: any[];
  companyModelSales: any;
  companyModelsList: string[];
  selectedCompanyModel: string;
  setSelectedCompanyModel: (m: string) => void;
  companyModelDetail: any;
  companyBatteryHealth: any[];
  companyServiceSummary: any;
  companyProblems: any[];
  selectedCompanyProblem: any;
  setSelectedCompanyProblem: (p: any) => void;
  companyProblemMatrix: any;
  companyInsights: any[];
  compModel1: string;
  setCompModel1: (m: string) => void;
  compModel2: string;
  setCompModel2: (m: string) => void;
  companyComparisonData: any;
  searchCompanyVehicleId: string;
  setSearchCompanyVehicleId: (id: string) => void;
  searchedVehicleDetail: any;
  setSearchedVehicleDetail: (d: any) => void;
  fetchCompanyVehicleDetail: (id: string) => void;
  salesRangeFilter: string;
  setSalesRangeFilter: (r: string) => void;
  salesModelFilter: string;
  setSalesModelFilter: (m: string) => void;
  companyLoading: boolean;
  companyError: string;
}

export default function CompanyDashboardView({
  user,
  setView,
  companyTab,
  setCompanyTab,
  companySummary,
  companySales,
  companyModelSales,
  companyModelsList,
  selectedCompanyModel,
  setSelectedCompanyModel,
  companyModelDetail,
  companyBatteryHealth,
  companyServiceSummary,
  companyProblems,
  selectedCompanyProblem,
  setSelectedCompanyProblem,
  companyProblemMatrix,
  companyInsights,
  compModel1,
  setCompModel1,
  compModel2,
  setCompModel2,
  companyComparisonData,
  searchCompanyVehicleId,
  setSearchCompanyVehicleId,
  searchedVehicleDetail,
  setSearchedVehicleDetail,
  fetchCompanyVehicleDetail,
  salesRangeFilter,
  setSalesRangeFilter,
  salesModelFilter,
  setSalesModelFilter,
  companyLoading,
  companyError
}: CompanyDashboardProps) {
  
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sales City Drill-Down States
  const [salesCityModalOpen, setSalesCityModalOpen] = useState(false);
  const salesCityDataset = useMemo(() => getSalesCityDataset(), []);

  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [selectedShowroom, setSelectedShowroom] = useState<ShowroomData | null>(null);
  const [selectedSoldVehicle, setSelectedSoldVehicle] = useState<SoldVehicleData | null>(null);

  // Restore state/city/showroom from localStorage on mount
  useEffect(() => {
    const saved = getSelectedLocationFromStorage(salesCityDataset);
    if (saved.state && saved.city) {
      setSelectedState(saved.state);
      setSelectedCity(saved.city);
      if (saved.showroom) {
        setSelectedShowroom(saved.showroom);
      }
    }
  }, [salesCityDataset]);

  const handleSelectShowroom = (state: StateData, city: CityData, showroom: ShowroomData) => {
    setSelectedState(state);
    setSelectedCity(city);
    setSelectedShowroom(showroom);
    saveSelectedLocationToStorage(state.name, city.name, showroom.id);
  };

  const handleSelectCityOnly = (state: StateData, city: CityData) => {
    setSelectedState(state);
    setSelectedCity(city);
    setSelectedShowroom(null);
    saveSelectedLocationToStorage(state.name, city.name);
  };

  const handleClearCitySelection = () => {
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedShowroom(null);
    clearSelectedLocationStorage();
  };

  // Filtered monthly sales data if city is active
  const activeMonthlySales = useMemo(() => {
    if (selectedCity && companySales && companySales.length > 0) {
      return computeCityMonthlySales(companySales, selectedCity.totalVehiclesSold, 650);
    }
    return companySales;
  }, [companySales, selectedCity]);

  // Customer Complaints & Problem diagnostics state
  const [companyComplaintModalOpen, setCompanyComplaintModalOpen] = useState(false);
  const [complaintAssessmentModalOpen, setComplaintAssessmentModalOpen] = useState(false);
  const [selectedComplaintForAssessment, setSelectedComplaintForAssessment] = useState<any | null>(null);
  const [localComplaints, setLocalComplaints] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('customer_complaints_v1') || '[]');
    } catch {
      return [];
    }
  });

  const handleComplaintSuccess = (newComplaint: any) => {
    setLocalComplaints(prev => [newComplaint, ...prev]);
  };

  // Merge customer complaints from API payload + localStorage cache
  const allCustomerComplaints = useMemo(() => {
    const list: any[] = [];
    companyProblems?.forEach(p => {
      if (p.complaints && Array.isArray(p.complaints)) {
        p.complaints.forEach((c: any) => {
          if (!list.some(existing => (existing.id && existing.id === c.id) || (existing.vehicleId === c.vehicleId && existing.reportedDate === c.reportedDate && existing.description === c.description))) {
            list.push({ ...c, category: p.problem });
          }
        });
      }
    });

    localComplaints.forEach((c: any) => {
      if (!list.some(existing => (existing.ticketNumber && existing.ticketNumber === c.ticketNumber) || (existing.vehicleId === c.vehicleId && existing.description === c.description))) {
        list.unshift({ ...c, category: c.issueType });
      }
    });

    return list;
  }, [companyProblems, localComplaints]);

  // Enhanced problems list with real-time user count
  const displayProblems = useMemo(() => {
    if (!companyProblems || companyProblems.length === 0) return [];
    return companyProblems.map(p => {
      const probName = (p.problem || '').toLowerCase();
      const matching = allCustomerComplaints.filter(c => 
        (c.issueType && c.issueType.toLowerCase() === probName) || 
        (c.category && c.category.toLowerCase() === probName)
      );
      const baseUsers = p.affectedVehicles || p.affectedUsersCount || p.count || 0;
      const count = Math.max(p.count || 0, matching.length);
      const affectedUsers = Math.max(baseUsers, matching.length);
      return {
        ...p,
        count,
        affectedVehicles: affectedUsers,
        affectedUsersCount: affectedUsers
      };
    });
  }, [companyProblems, allCustomerComplaints]);

  // Currently active selected problem
  const activeProblem = useMemo(() => {
    if (!selectedCompanyProblem && displayProblems.length > 0) {
      return displayProblems[0];
    }
    if (!selectedCompanyProblem) return null;
    const match = displayProblems.find(p => p.problem?.toLowerCase() === selectedCompanyProblem.problem?.toLowerCase());
    return match || selectedCompanyProblem;
  }, [selectedCompanyProblem, displayProblems]);

  // Complaints specific to active category
  const activeCategoryComplaints = useMemo(() => {
    if (!activeProblem) return [];
    const probName = (activeProblem.problem || '').toLowerCase();
    return allCustomerComplaints.filter(c => 
      (c.issueType && c.issueType.toLowerCase() === probName) || 
      (c.category && c.category.toLowerCase() === probName)
    );
  }, [activeProblem, allCustomerComplaints]);

  if (companyLoading && !companySummary) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 76px)', marginTop: '76px', color: 'var(--color-primary)', fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner"></div>
          <span>Loading manufacturer dashboard analytics...</span>
        </div>
      </div>
    );
  }

  if (companyError) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 76px)', marginTop: '76px', padding: '2rem', fontFamily: 'Outfit, sans-serif' }}>
        <div className="card" style={{ maxWidth: '450px', padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.15)', background: 'var(--color-danger-light)', borderRadius: '12px' }}>
          <AlertCircle size={44} style={{ color: 'var(--color-danger)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Access Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>{companyError}</p>
          <button className="btn btn-secondary" onClick={() => setView('main')} style={{ margin: '0 auto' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 76px)', marginTop: '76px', background: '#F8FAFC', fontFamily: 'Outfit, sans-serif', padding: 0 }}>
      
      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? '260px' : '70px',
        background: '#042A2B',
        color: '#fff',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        zIndex: 50,
        position: 'sticky',
        top: '76px',
        height: 'calc(100vh - 76px)'
      }}>
        {/* Toggle Button */}
        <div style={{ display: 'flex', justifyContent: sidebarOpen ? 'flex-end' : 'center', padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            {sidebarOpen ? <ArrowLeftIcon /> : <ArrowRightIcon />}
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '1rem 0.5rem', flexGrow: 1 }}>
          <SidebarLink active={companyTab === 'dashboard' && !selectedShowroom} onClick={() => { setSelectedShowroom(null); setCompanyTab('dashboard'); }} icon={<BarChart3 size={18} />} text="Dashboard" open={sidebarOpen} />
          <SidebarLink active={companyTab === 'models' && !selectedShowroom} onClick={() => { setSelectedShowroom(null); setCompanyTab('models'); }} icon={<Car size={18} />} text="Battery Models" open={sidebarOpen} />
          <SidebarLink active={companyTab === 'sales' && !selectedShowroom} onClick={() => { setSelectedShowroom(null); setCompanyTab('sales'); }} icon={<TrendingUp size={18} />} text="Sales Analytics" open={sidebarOpen} />
          <SidebarLink active={companyTab === 'health' && !selectedShowroom} onClick={() => { setSelectedShowroom(null); setCompanyTab('health'); }} icon={<Battery size={18} />} text="Battery Health" open={sidebarOpen} />
          <SidebarLink active={companyTab === 'service' && !selectedShowroom} onClick={() => { setSelectedShowroom(null); setCompanyTab('service'); }} icon={<Wrench size={18} />} text="Service Analytics" open={sidebarOpen} />
          <SidebarLink active={companyTab === 'problems' && !selectedShowroom} onClick={() => { setSelectedShowroom(null); setCompanyTab('problems'); }} icon={<AlertTriangle size={18} />} text="Customer Problems" open={sidebarOpen} />
          <SidebarLink active={companyTab === 'comparison' && !selectedShowroom} onClick={() => { setSelectedShowroom(null); setCompanyTab('comparison'); }} icon={<Layers size={18} />} text="Model Comparison" open={sidebarOpen} />
          <SidebarLink active={companyTab === 'insights' && !selectedShowroom} onClick={() => { setSelectedShowroom(null); setCompanyTab('insights'); }} icon={<FileText size={18} />} text="Engineering Insights" open={sidebarOpen} />

          {selectedShowroom && (
            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <SidebarLink 
                active={true} 
                onClick={() => {}} 
                icon={<Store size={18} />} 
                text={selectedShowroom.name} 
                open={sidebarOpen} 
              />
            </div>
          )}
        </nav>

        {/* Sidebar Footer info */}
        {sidebarOpen && (
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
            <div>Signed in as Manufacturer</div>
            <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.15rem' }}>{user?.gmail}</div>
          </div>
        )}
      </aside>

      {/* DASHBOARD CONTENT BODY */}
      <main style={{ flexGrow: 1, padding: '2rem 2.5rem', overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* HEADER AREA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Manufacturer Analytics Terminal</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#042A2B', margin: '0.2rem 0 0 0', letterSpacing: '-0.02em' }}>
              {selectedShowroom ? `${selectedShowroom.name} — Showroom Fleet Directory` : (
                <>
                  {companyTab === 'dashboard' && 'Executive Fleet Summary'}
                  {companyTab === 'models' && 'Vehicle & Battery Models'}
                  {companyTab === 'sales' && 'Monthly Sales Overview'}
                  {companyTab === 'health' && 'Fleet Battery Health Trends'}
                  {companyTab === 'service' && 'Service Center Logs & Lifecycle Journey'}
                  {companyTab === 'problems' && 'Customer Problem Diagnostics'}
                  {companyTab === 'comparison' && 'Model Telemetry Comparison'}
                  {companyTab === 'insights' && 'Data-Driven Engineering Recommendations'}
                </>
              )}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Sales City Selector Pill Button */}
            <button
              onClick={() => setSalesCityModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: selectedCity ? 'var(--color-success-light)' : '#ffffff',
                border: `1px solid ${selectedCity ? 'var(--color-primary)' : 'var(--border-color)'}`,
                borderRadius: '30px',
                padding: '0.38rem 0.95rem',
                boxShadow: 'var(--shadow-soft)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.84rem',
                color: selectedCity ? 'var(--color-success-hover)' : 'var(--text-primary)',
                fontWeight: selectedCity ? 700 : 500,
                transition: 'all 0.2s ease'
              }}
              title="Click to drill down into State, City, or Showroom"
            >
              <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
              <span>
                {selectedState && selectedCity ? `${selectedState.name} › ${selectedCity.name}` : 'Select Sales City'}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
            </button>

            {/* Quick Vehicle Search bar */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '30px', padding: '0.35rem 0.75rem', boxShadow: 'var(--shadow-soft)' }}>
              <Search size={16} style={{ color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Quick Vehicle ID search..." 
                value={searchCompanyVehicleId}
                onChange={(e) => setSearchCompanyVehicleId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCompanyVehicleDetail(searchCompanyVehicleId)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '180px' }}
              />
              <button 
                onClick={() => fetchCompanyVehicleDetail(searchCompanyVehicleId)}
                style={{ background: 'var(--color-primary)', border: 'none', color: '#fff', fontSize: '0.8rem', padding: '0.3rem 0.85rem', borderRadius: '30px', fontWeight: 700, cursor: 'pointer' }}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* VEHICLE DETAILS PANEL IF SEARCHED */}
        {searchedVehicleDetail && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-success-light)', borderLeft: '4px solid var(--color-primary)', position: 'relative', animation: 'fade-in 0.3s ease-out' }}>
            <button 
              onClick={() => setSearchedVehicleDetail(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
              Vehicle Timeline Profile: {searchedVehicleDetail.vehicleId}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>Manufacturer: <strong>{searchedVehicleDetail.manufacturer}</strong></div>
              <div>Model: <strong>{searchedVehicleDetail.model}</strong></div>
              <div>Purchase Date: <strong>{new Date(searchedVehicleDetail.purchaseDate).toLocaleDateString()}</strong></div>
              <div>Odometer: <strong>{searchedVehicleDetail.assessments?.length > 0 ? searchedVehicleDetail.assessments[searchedVehicleDetail.assessments.length-1].odometer : 0} km</strong></div>
              <div>Current SoH: <strong style={{ color: 'var(--color-success-hover)', fontSize: '1rem' }}>{searchedVehicleDetail.currentSoh}%</strong></div>
              <div>Charging Cycles: <strong>{searchedVehicleDetail.chargingCycles}</strong></div>
              <div>Total Service Visits: <strong>{searchedVehicleDetail.serviceVisitsCount}</strong></div>
            </div>

            {/* Assessment timeline list */}
            {searchedVehicleDetail.assessments?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Diagnostics Timeline Logs</span>
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {searchedVehicleDetail.assessments.map((a: any, idx: number) => (
                    <div key={idx} style={{ flexShrink: 0, width: '160px', background: '#fff', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontWeight: 800, marginTop: '0.25rem' }}>SoH: {a.soh}%</div>
                      <div style={{ color: 'var(--text-secondary)' }}>Cycles: {a.chargingCycles}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>Temp: {a.averageTemperature}°C</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENTS / SHOWROOM VEHICLE FLEET VIEW */}
        {selectedShowroom && selectedCity && selectedState ? (
          <ShowroomVehiclesView
            showroom={selectedShowroom}
            city={selectedCity}
            state={selectedState}
            onBackToShowrooms={() => {
              setSelectedShowroom(null);
              setSalesCityModalOpen(true);
            }}
            onBackToCities={() => {
              setSelectedShowroom(null);
              setSalesCityModalOpen(true);
            }}
            onBackToStates={() => {
              setSelectedShowroom(null);
              setSalesCityModalOpen(true);
            }}
            onSelectVehicle={(vehicle) => {
              setSelectedSoldVehicle(vehicle);
            }}
          />
        ) : (
          <>
            {/* 1. EXECUTIVE FLEET SUMMARY (TAB: dashboard) */}
        {companyTab === 'dashboard' && companySummary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
              <KPICard title="Total Vehicles Sold" value={companySummary.totalVehiclesSold} change={companySummary.salesChange} changeType="positive" icon={<DollarSign size={20} />} />
              <KPICard title="Active Vehicles" value={companySummary.activeVehicles} change={companySummary.activeVehiclesChange} changeType="positive" icon={<Car size={20} />} />
              <KPICard title="Total Assessments" value={companySummary.totalBatteryAssessments} change={companySummary.assessmentsChange} changeType="positive" icon={<Activity size={20} />} />
              <KPICard title="Service Visits" value={companySummary.serviceVisits} change={companySummary.servicesChange} changeType="negative" icon={<Wrench size={20} />} />
              <KPICard title="Open Issues" value={companySummary.openIssues} change={companySummary.openIssuesChange} changeType="negative" icon={<AlertTriangle size={20} />} />
              <KPICard title="Average Battery SoH" value={`${companySummary.avgBatterySoh}%`} change={companySummary.sohChange > 0 ? `+${companySummary.sohChange}%` : `${companySummary.sohChange}%`} changeType={companySummary.sohChange >= 0 ? "positive" : "negative"} icon={<Battery size={20} />} />
            </div>

            {/* Sales Chart & Rankings Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
              
              {/* Monthly Sales chart */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Monthly Vehicle Sales Trends</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select value={salesRangeFilter} onChange={(e) => setSalesRangeFilter(e.target.value)} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <option value="6 months">Last 6 Months</option>
                      <option value="12 months">Last 12 Months</option>
                      <option value="this year">This Year</option>
                    </select>
                  </div>
                </div>
                
                {companySales?.length > 0 ? (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={companySales}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" fontSize={11} stroke="#64748B" tickLine={false} />
                        <YAxis fontSize={11} stroke="#64748B" tickLine={false} />
                        <Tooltip contentStyle={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }} />
                        <Bar dataKey="sales" fill="#0E8360" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState text="No monthly sales records available yet." />
                )}
              </div>

              {/* Model Sales Rankings list */}
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Model Sales Rankings</h3>
                {companyModelSales?.rankings?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
                    {companyModelSales.rankings.map((r: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span>{r.model}</span>
                          <strong>{r.sold} units sold</strong>
                        </div>
                        {/* Custom Bar */}
                        <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${(r.sold / companyModelSales.mostSoldCount) * 100}%`,
                            height: '100%',
                            background: '#0E8360',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    ))}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: 'auto', fontSize: '0.8rem' }}>
                      <div style={{ background: 'var(--color-success-light)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Most Sold Model</div>
                        <strong style={{ color: 'var(--color-success-hover)', fontSize: '1rem' }}>{companyModelSales.mostSoldModel}</strong>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Least Sold Model</div>
                        <strong style={{ fontSize: '1rem' }}>{companyModelSales.leastSoldModel}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState text="No model sales performance data." />
                )}
              </div>

            </div>

            {/* Battery Health overview and service cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '1.5rem' }}>
              
              {/* Engineering Insights preview card */}
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Engineering Insights Summary</h3>
                  <button onClick={() => setCompanyTab('insights')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>View All →</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {companyInsights?.slice(0, 3).map((insight: any, idx: number) => (
                    <div key={idx} style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                      background: insight.type === 'WARNING' ? 'var(--color-danger-light)' : (insight.type === 'SUCCESS' ? 'var(--color-success-light)' : 'var(--bg-secondary)'),
                      color: insight.type === 'WARNING' ? 'var(--color-danger)' : (insight.type === 'SUCCESS' ? 'var(--color-success-hover)' : 'var(--text-primary)'),
                      border: `1px solid ${insight.type === 'WARNING' ? 'rgba(220, 38, 38, 0.1)' : (insight.type === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 'var(--border-color)')}`
                    }}>
                      <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{insight.text}</span>
                    </div>
                  ))}
                  {companyInsights?.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem' }}>No engineering recommendations compiled.</div>
                  )}
                </div>
              </div>

              {/* Service center overview preview */}
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Service Center Diagnostics</h3>
                  <button onClick={() => setCompanyTab('service')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Service Journey →</button>
                </div>

                {companyServiceSummary ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Most Serviced Model:</span>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.15rem' }}>{companyServiceSummary.mostServicedModel}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Most Common Service Problem:</span>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.15rem', color: 'var(--color-danger)' }}>{companyServiceSummary.mostCommonProblem}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Average Repair Time:</span>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.15rem' }}>{companyServiceSummary.avgRepairTime} hours</div>
                      </div>
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Repeat Service Rate:</span>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.15rem', color: companyServiceSummary.repeatServiceRate > 15 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{companyServiceSummary.repeatServiceRate}%</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState text="No service logs available." />
                )}
              </div>

            </div>

          </div>
        )}

        {/* 2. VEHICLE & BATTERY MODELS (TAB: models) */}
        {companyTab === 'models' && companyModelsList && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Model Selector Bar */}
            <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
              {companyModelsList.map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedCompanyModel(model)}
                  className={`btn ${selectedCompanyModel === model ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {model}
                </button>
              ))}
            </div>

            {/* Model detail stats */}
            {companyModelDetail ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '1.5rem' }}>
                
                {/* Stats Panel */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{companyModelDetail.model} Analytics</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <ModelMetricLabel label="Total Units Sold" value={companyModelDetail.totalSold} />
                      <ModelMetricLabel label="Active Vehicles" value={companyModelDetail.activeVehicles} />
                      <ModelMetricLabel label="Average Battery SoH" value={`${companyModelDetail.avgBatterySoh}%`} highlight />
                      <ModelMetricLabel label="Average Battery Age" value={`${companyModelDetail.avgBatteryAge} years`} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <ModelMetricLabel label="Average Charging Cycles" value={companyModelDetail.avgChargingCycles} />
                      <ModelMetricLabel label="Service Visits Recorded" value={companyModelDetail.serviceVisits} />
                      <ModelMetricLabel label="Reported Problems" value={companyModelDetail.reportedProblems} />
                      <ModelMetricLabel label="Avg Service Interval" value={`${companyModelDetail.avgServiceInterval} months`} />
                    </div>
                  </div>
                </div>

                {/* Additional context for model */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Model Quality Assessment</h3>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    {companyModelDetail.reportedProblems === 0 ? (
                      <div style={{ color: 'var(--color-success-hover)', fontWeight: 600 }}>✓ Outstanding quality metrics. Zero reported service issues for {companyModelDetail.model} in the fleet.</div>
                    ) : (
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Reliability Rating:</span>
                        {(() => {
                          const problemRatio = companyModelDetail.reportedProblems / (doubleCheckNum(companyModelDetail.activeVehicles));
                          if (problemRatio > 0.3) {
                            return <strong style={{ color: 'var(--color-danger)', fontSize: '1rem' }}>⚠️ CRITICAL FEEDBACK REQUIRED (Problem rate exceeds 30%)</strong>;
                          } else if (problemRatio > 0.1) {
                            return <strong style={{ color: 'var(--color-warning)', fontSize: '1rem' }}>⚠️ MODERATE DEFECT ALERTS (Problem rate {Math.round(problemRatio*100)}%)</strong>;
                          } else {
                            return <strong style={{ color: 'var(--color-success-hover)', fontSize: '1rem' }}>✓ HEALTHY STABILITY (Problem rate below 10%)</strong>;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <EmptyState text="Select a model to view details." />
            )}

          </div>
        )}

        {/* 3. SALES ANALYTICS (TAB: sales) */}
        {companyTab === 'sales' && (
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Filtering options */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Vehicle Monthly Sales Performance</h3>
                {selectedCity && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.4rem',
                    background: 'var(--color-success-light)',
                    border: '1px solid rgba(14, 131, 96, 0.25)',
                    borderRadius: '20px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.78rem',
                    color: 'var(--color-success-hover)',
                    width: 'fit-content'
                  }}>
                    <MapPin size={13} />
                    <span>Territory Filter: <strong>{selectedState?.name} › {selectedCity.name}</strong></span>
                    <button
                      onClick={handleClearCitySelection}
                      style={{
                        background: '#ffffff',
                        border: '1px solid rgba(14, 131, 96, 0.3)',
                        borderRadius: '12px',
                        padding: '0.1rem 0.45rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--color-success-hover)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        marginLeft: '0.35rem'
                      }}
                      title="Clear city filter"
                    >
                      <X size={11} />
                      Clear city filter
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Timeline Range</span>
                  <select value={salesRangeFilter} onChange={(e) => setSalesRangeFilter(e.target.value)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <option value="6 months">Last 6 Months</option>
                    <option value="12 months">Last 12 Months</option>
                    <option value="this year">This Year</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Filter by Model</span>
                  <select value={salesModelFilter} onChange={(e) => setSalesModelFilter(e.target.value)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <option value="All Models">All Models</option>
                    {companyModelsList?.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sales Chart */}
            {activeMonthlySales?.length > 0 ? (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={activeMonthlySales}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ fontFamily: 'Outfit, sans-serif', fontSize: '0.85rem' }} />
                    <Line type="monotone" dataKey="sales" stroke="#0E8360" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="No sales logs meet the selected criteria." />
            )}

          </div>
        )}

        {/* 4. BATTERY HEALTH (TAB: health) */}
        {companyTab === 'health' && (
          <BatteryHealthView
            selectedState={selectedState}
            selectedCity={selectedCity}
            selectedShowroom={selectedShowroom}
            onClearCitySelection={handleClearCitySelection}
            onNavigateToComparison={(m1, m2) => {
              setCompModel1(m1);
              setCompModel2(m2);
              setCompanyTab('comparison');
            }}
            companyBatteryHealth={companyBatteryHealth}
          />
        )}

        {/* 5. SERVICE ANALYTICS (TAB: service) */}
        {companyTab === 'service' && companyServiceSummary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* General metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Service Center Visits</span>
                <strong style={{ fontSize: '1.6rem', color: '#042A2B', display: 'block', marginTop: '0.25rem' }}>{companyServiceSummary.totalServiceVisits}</strong>
              </div>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Avg Service Interval</span>
                <strong style={{ fontSize: '1.6rem', color: '#042A2B', display: 'block', marginTop: '0.25rem' }}>{companyServiceSummary.avgServiceFrequencyMonths} months</strong>
              </div>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Average Repair Time</span>
                <strong style={{ fontSize: '1.6rem', color: '#042A2B', display: 'block', marginTop: '0.25rem' }}>{companyServiceSummary.avgRepairTime} hours</strong>
              </div>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Repeat Service Rate</span>
                <strong style={{ fontSize: '1.6rem', color: 'var(--color-danger)', display: 'block', marginTop: '0.25rem' }}>{companyServiceSummary.repeatServiceRate}%</strong>
              </div>
            </div>

            {/* Lifecycle Journey funnel chart */}
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Vehicle Lifecycle & Service Journey</h3>
              {companyServiceSummary.lifecycleJourney ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '700px' }}>
                  <LifecycleStep step="1. Reached First Service" count={`${companyServiceSummary.lifecycleJourney.reachedFirstService} vehicles`} desc={`Average timeline: ${companyServiceSummary.lifecycleJourney.avgMonthsToFirstService} months since purchase.`} />
                  <LifecycleStep step="2. Battery Condition at First Service" count={`Avg SoH: ${companyServiceSummary.lifecycleJourney.avgSohAtFirstService}%`} desc="Diagnostics readings assessed at service entry." />
                  <LifecycleStep step="3. Active Repair Required" count={`${companyServiceSummary.lifecycleJourney.requiringRepairCount} vehicles`} desc="Component faults identified requiring parts replacement/balancing." />
                  <LifecycleStep step="4. Post-Service Repeat Visits" count={`${companyServiceSummary.lifecycleJourney.repeatServiceVisitsCount} repeat visits`} desc={`Tracked ${companyServiceSummary.lifecycleJourney.problemsAfterServiceCount} subsequent reports logged post first repair.`} warning={companyServiceSummary.lifecycleJourney.problemsAfterServiceCount > 0} />
                </div>
              ) : (
                <EmptyState text="No journey data compiled." />
              )}
            </div>

          </div>
        )}

        {/* 6. CUSTOMER PROBLEMS (TAB: problems) */}
        {companyTab === 'problems' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Top Bar for Customer Problems */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#042A2B' }}>
                  Customer Problem Diagnostics & Complaint Tracking
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Real-time telemetry incidents and direct owner-submitted complaints across the fleet.
                </p>
              </div>
              <button
                onClick={() => setCompanyComplaintModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(14, 131, 96, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <PlusCircle size={16} /> Log / Raise Customer Complaint
              </button>
            </div>

            {/* Top Problem ranking & Detail side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.35fr', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Problem list ranking */}
              <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#042A2B' }}>Common Problems Reported</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {displayProblems.length} Categories
                  </span>
                </div>
                
                {displayProblems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {displayProblems.map((prob, idx) => {
                      const isSelected = activeProblem?.problem?.toLowerCase() === prob.problem?.toLowerCase();
                      const usersCount = prob.affectedVehicles || prob.affectedUsersCount || prob.count || 0;
                      return (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedCompanyProblem(prob)}
                          style={{
                            padding: '0.9rem 1.1rem',
                            borderRadius: '10px',
                            border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                            background: isSelected ? 'rgba(14, 131, 96, 0.05)' : '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 3px 10px rgba(14, 131, 96, 0.12)' : 'none'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isSelected ? 'var(--color-primary)' : '#042A2B' }}>
                              {prob.problem}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.78rem', color: isSelected ? '#0E8360' : '#475569', fontWeight: 600 }}>
                              <Users size={14} style={{ color: isSelected ? '#0E8360' : '#64748B' }} />
                              <span>
                                <strong style={{ color: isSelected ? '#0E8360' : '#0F172A' }}>{usersCount}</strong> {usersCount === 1 ? 'user' : 'users'} facing this currently
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                            <div style={{ 
                              fontSize: '0.8rem', 
                              background: isSelected ? 'var(--color-primary)' : '#F1F5F9', 
                              color: isSelected ? '#fff' : '#334155',
                              padding: '0.25rem 0.6rem', 
                              borderRadius: '6px', 
                              fontWeight: 700 
                            }}>
                              {prob.count} reports
                            </div>
                            {prob.percentageOfTotal && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                {prob.percentageOfTotal}% fleet impact
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState text="No problems registered in the database." />
                )}
              </div>

              {/* Problem Detail panel */}
              {activeProblem ? (
                <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#042A2B' }}>
                        {activeProblem.problem}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Diagnostic Analysis & Customer Log
                      </span>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: '#FEE2E2',
                      color: '#DC2626'
                    }}>
                      <AlertTriangle size={13} /> Active Diagnostics
                    </span>
                  </div>

                  {/* PROMINENT USERS FACING THIS BANNER */}
                  <div style={{
                    background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)',
                    border: '1.5px solid #FECACA',
                    borderRadius: '10px',
                    padding: '1.1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: '#FEE2E2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#DC2626'
                      }}>
                        <Users size={24} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Current Live User Impact
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#042A2B', marginTop: '0.15rem' }}>
                          {activeProblem.affectedVehicles || activeProblem.affectedUsersCount || activeProblem.count} Users Currently Facing This Problem
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.3rem 0.75rem',
                        background: '#FEE2E2',
                        color: '#DC2626',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 800
                      }}>
                        {activeProblem.percentageOfTotal || '10'}% of fleet
                      </span>
                    </div>
                  </div>
                  
                  {/* Detailed metrics table */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                    <div className="passport-info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #F1F5F9' }}>
                      <span className="passport-label" style={{ color: 'var(--text-secondary)' }}>Affected Users / Vehicles</span>
                      <span className="passport-value" style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                        {activeProblem.affectedVehicles || activeProblem.affectedUsersCount || activeProblem.count} users
                      </span>
                    </div>
                    <div className="passport-info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #F1F5F9' }}>
                      <span className="passport-label" style={{ color: 'var(--text-secondary)' }}>Percentage of Fleet Affected</span>
                      <span className="passport-value" style={{ fontWeight: 700 }}>{activeProblem.percentageOfTotal}%</span>
                    </div>
                    <div className="passport-info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #F1F5F9' }}>
                      <span className="passport-label" style={{ color: 'var(--text-secondary)' }}>Avg Vehicle Age when occurred</span>
                      <span className="passport-value">{activeProblem.avgVehicleAge} years</span>
                    </div>
                    <div className="passport-info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #F1F5F9' }}>
                      <span className="passport-label" style={{ color: 'var(--text-secondary)' }}>Avg Battery SoH when occurred</span>
                      <span className="passport-value" style={{ fontWeight: 700, color: '#D97706' }}>{activeProblem.avgBatterySoh}%</span>
                    </div>
                    <div className="passport-info-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid #F1F5F9' }}>
                      <span className="passport-label" style={{ color: 'var(--text-secondary)' }}>Service Visits Caused</span>
                      <span className="passport-value">{activeProblem.serviceVisitsCaused}</span>
                    </div>
                  </div>

                  {/* Model breakdown list */}
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                      Affected Models Breakdown
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {Object.entries(activeProblem.affectedModels || {}).map(([modelName, count]: [string, any]) => (
                        <div key={modelName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', background: 'var(--bg-secondary)', padding: '0.45rem 0.75rem', borderRadius: '6px' }}>
                          <span style={{ fontWeight: 600 }}>{modelName}</span>
                          <strong style={{ color: '#042A2B' }}>{count} {count === 1 ? 'vehicle' : 'vehicles'}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CUSTOMER WRITTEN COMPLAINTS SECTION */}
                  <div style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquareWarning size={16} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#042A2B' }}>
                          Customer Written Complaints ({activeCategoryComplaints.length})
                        </span>
                      </div>
                      <button
                        onClick={() => setCompanyComplaintModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <PlusCircle size={13} /> Write Complaint
                      </button>
                    </div>

                    {activeCategoryComplaints.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                        {activeCategoryComplaints.map((c: any, cIdx: number) => (
                          <div 
                            key={c.ticketNumber || c.id || cIdx} 
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#042A2B' }}>
                                  {c.vehicleId || 'VIN-Unknown'}
                                </span>
                                {c.model && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    • {c.model}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontWeight: 800,
                                  background: c.severity === 'HIGH' ? '#FEE2E2' : c.severity === 'MEDIUM' ? '#FEF3C7' : '#E0F2FE',
                                  color: c.severity === 'HIGH' ? '#DC2626' : c.severity === 'MEDIUM' ? '#D97706' : '#0284C7'
                                }}>
                                  {c.severity || 'HIGH'}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                  {c.reportedDate ? new Date(c.reportedDate).toLocaleDateString() : 'Recent'}
                                </span>
                              </div>
                            </div>
                            <div style={{
                              fontSize: '0.82rem',
                              color: '#334155',
                              lineHeight: 1.45,
                              fontStyle: 'italic',
                              background: '#fff',
                              padding: '0.6rem 0.75rem',
                              borderRadius: '6px',
                              borderLeft: '3px solid var(--color-primary)'
                            }}>
                              "{c.description}"
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '0.25rem',
                              paddingTop: '0.4rem',
                              borderTop: '1px dashed #E2E8F0'
                            }}>
                              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                                {c.ticketNumber ? `Ticket #${c.ticketNumber}` : (c.id ? `ID: #${c.id}` : '')}
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedComplaintForAssessment(c);
                                  setComplaintAssessmentModalOpen(true);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid #0E8360',
                                  background: '#F0FDF4',
                                  color: '#0E8360',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontFamily: 'Outfit, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#0E8360';
                                  e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#F0FDF4';
                                  e.currentTarget.style.color = '#0E8360';
                                }}
                              >
                                <FileText size={13} />
                                <span>View Assessment</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        padding: '1.25rem',
                        background: '#F8FAFC',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '1px dashed #CBD5E1'
                      }}>
                        <MessageSquareWarning size={22} style={{ color: '#94A3B8', margin: '0 auto 0.4rem' }} />
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          No customer written complaints logged yet for {activeProblem.problem}.
                        </p>
                        <button
                          onClick={() => setCompanyComplaintModalOpen(true)}
                          style={{
                            marginTop: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          + Write a complaint for this category
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Select a problem from the list on the left to view comprehensive telemetry diagnostics and user complaints.
                </div>
              )}

            </div>

            {/* Problem distribution by model matrix */}
            {companyProblemMatrix && companyProblemMatrix.models?.length > 0 && (
              <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Problem Distribution by Model</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="problem-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '0.75rem' }}>Problem Type</th>
                        {companyProblemMatrix.models.map((m: string) => (
                          <th key={m} style={{ padding: '0.75rem' }}>{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(companyProblemMatrix.matrix || {}).map(([issueType, modelCounts]: [string, any]) => (
                        <tr key={issueType} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{issueType}</td>
                          {companyProblemMatrix.models.map((m: string) => {
                            const count = modelCounts[m] || 0;
                            return (
                              <td 
                                key={m} 
                                style={{
                                  padding: '0.75rem',
                                  fontWeight: count > 0 ? 800 : 400,
                                  color: count > 3 ? 'var(--color-danger)' : (count > 0 ? 'var(--color-warning)' : 'var(--text-secondary)'),
                                  background: count > 3 ? 'rgba(220, 38, 38, 0.03)' : 'transparent'
                                }}
                              >
                                {count}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Raise Complaint Modal for Company Officer */}
            <RaiseComplaintModal
              isOpen={companyComplaintModalOpen}
              onClose={() => setCompanyComplaintModalOpen(false)}
              onSuccess={handleComplaintSuccess}
              currentVehicleId="VIN-1001"
              currentModel={selectedCompanyModel || 'EV 360'}
              currentManufacturer="EV Company"
              userEmail={user?.gmail || 'company@evcompany.com'}
            />

          </div>
        )}

        {/* 7. MODEL COMPARISON (TAB: comparison) */}
        {companyTab === 'comparison' && companyModelsList && (
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>EV Model Telemetry Comparison</h3>
            
            {/* Selectors */}
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Compare Model 1</span>
                <select value={compModel1} onChange={(e) => setCompModel1(e.target.value)} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  {companyModelsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '1.1rem' }}>VS</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Compare Model 2</span>
                <select value={compModel2} onChange={(e) => setCompModel2(e.target.value)} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  {companyModelsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison results tables */}
            {companyComparisonData ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <ModelComparisonCard modelData={companyComparisonData.model1} themeColor="#0E8360" />
                <ModelComparisonCard modelData={companyComparisonData.model2} themeColor="#042A2B" />
              </div>
            ) : (
              <EmptyState text="Select two models above to initialize comparison." />
            )}
          </div>
        )}

        {/* 8. ENGINEERING INSIGHTS (TAB: insights) */}
        {companyTab === 'insights' && (
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Engineering & Design Insights</h3>
            
            {companyInsights?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {companyInsights.map((insight, idx) => (
                  <div key={idx} className="card" style={{
                    padding: '1.25rem',
                    borderLeft: `4px solid ${insight.type === 'WARNING' ? 'var(--color-danger)' : (insight.type === 'SUCCESS' ? 'var(--color-success)' : 'var(--color-secondary)')}`,
                    background: insight.type === 'WARNING' ? 'var(--color-danger-light)' : (insight.type === 'SUCCESS' ? 'var(--color-success-light)' : 'var(--color-secondary-light)'),
                    animation: 'fade-in 0.3s ease-out'
                  }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      {insight.type === 'WARNING' ? <AlertTriangle size={20} className="text-danger" style={{ flexShrink: 0, marginTop: '2px' }} /> : 
                       insight.type === 'SUCCESS' ? <CheckCircle size={20} className="text-success" style={{ flexShrink: 0, marginTop: '2px' }} /> : 
                       <Info size={20} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '2px' }} />}
                      
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                        <strong style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          {insight.type === 'WARNING' && 'High Risk Fault Alert'}
                          {insight.type === 'SUCCESS' && 'Design Target Achievement'}
                          {insight.type === 'INFO' && 'Fleet Telemetry Trend'}
                        </strong>
                        {insight.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Insufficient data to generate design insights. Proceeding calibrations." />
            )}
          </div>
        )}
          </>
        )}

      </main>

      {/* SALES CITY DRILLDOWN MODAL */}
      <SalesCityModal
        isOpen={salesCityModalOpen}
        onClose={() => setSalesCityModalOpen(false)}
        dataset={salesCityDataset}
        selectedState={selectedState}
        selectedCity={selectedCity}
        selectedShowroom={selectedShowroom}
        onSelectShowroom={handleSelectShowroom}
        onSelectCityOnly={handleSelectCityOnly}
        onClearSelection={handleClearCitySelection}
      />

      {/* VEHICLE ASSESSMENT HISTORY MODAL */}
      <VehicleAssessmentModal
        vehicle={selectedSoldVehicle}
        showroomName={selectedShowroom?.name || 'Authorized EV Showroom'}
        cityName={selectedCity?.name || 'Central Region'}
        stateName={selectedState?.name || 'All Territories'}
        onClose={() => setSelectedSoldVehicle(null)}
      />

      {/* COMPLAINT PREVIOUS ASSESSMENT MODAL */}
      <ComplaintAssessmentModal
        isOpen={complaintAssessmentModalOpen}
        onClose={() => {
          setComplaintAssessmentModalOpen(false);
          setSelectedComplaintForAssessment(null);
        }}
        complaint={selectedComplaintForAssessment}
      />

    </div>
  );
}

// Sidebar Icon links
function SidebarLink({ active, onClick, icon, text, open }: { active: boolean, onClick: () => void, icon: React.ReactNode, text: string, open: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        border: 'none',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.7)',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontFamily: 'Outfit, sans-serif',
        textAlign: 'left',
        fontWeight: active ? 700 : 400,
        justifyContent: open ? 'flex-start' : 'center',
        width: '100%',
        transition: 'all 0.2s ease'
      }}
    >
      {icon}
      {open && <span>{text}</span>}
    </button>
  );
}

// KPI Card widget
function KPICard({ title, value, change, changeType, icon }: { title: string, value: any, change: any, changeType: 'positive' | 'negative', icon: React.ReactNode }) {
  const isUp = change && !change.toString().startsWith('-');
  const color = changeType === 'positive' ? 'var(--color-success-hover)' : 'var(--color-danger)';
  const bg = changeType === 'positive' ? 'var(--color-success-light)' : 'var(--color-danger-light)';

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{title}</span>
        <div style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '0.3rem', borderRadius: '6px' }}>{icon}</div>
      </div>
      <strong style={{ fontSize: '1.6rem', color: '#042A2B' }}>{value}</strong>
      {change !== undefined && change !== null && (
        <span style={{ fontSize: '0.75rem', color, background: bg, padding: '0.15rem 0.4rem', borderRadius: '4px', display: 'inline-block', width: 'fit-content', fontWeight: 700 }}>
          {change.toString().startsWith('+') || change.toString().startsWith('-') ? change : (isUp ? `+${change}` : change)}
        </span>
      )}
    </div>
  );
}

// Model detail label widget
function ModelMetricLabel({ label, value, highlight }: { label: string, value: any, highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed var(--border-color)', fontSize: '0.85rem' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}:</span>
      <strong style={{ color: highlight ? 'var(--color-primary)' : 'var(--text-primary)', fontSize: highlight ? '1rem' : '0.85rem' }}>{value}</strong>
    </div>
  );
}

// Model Comparison list details card
function ModelComparisonCard({ modelData, themeColor }: { modelData: any, themeColor: string }) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: `4px solid ${themeColor}` }}>
      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: themeColor }}>{modelData.model}</h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
        <div className="passport-info-row">
          <span className="passport-label">Total sales</span>
          <span className="passport-value">{modelData.sales} units</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Average battery SoH</span>
          <span className="passport-value" style={{ color: 'var(--color-success-hover)' }}>{modelData.avgSoh}%</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Capacity retention</span>
          <span className="passport-value">{modelData.capacityRetention}%</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Average battery age</span>
          <span className="passport-value">{modelData.avgBatteryAge} years</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Charging cycles logged</span>
          <span className="passport-value">{modelData.chargingCycles}</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Average driving range</span>
          <span className="passport-value">{modelData.avgRange} km</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Service visits logged</span>
          <span className="passport-value">{modelData.serviceVisits}</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Defect problem rate</span>
          <span className="passport-value" style={{ color: modelData.problemRate > 10 ? 'var(--color-danger)' : 'var(--text-primary)' }}>{modelData.problemRate}%</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Most common issue</span>
          <span className="passport-value" style={{ color: modelData.commonProblem !== 'None' ? 'var(--color-danger)' : 'var(--text-primary)' }}>{modelData.commonProblem}</span>
        </div>
        <div className="passport-info-row">
          <span className="passport-label">Service interval frequency</span>
          <span className="passport-value">{modelData.serviceFrequency} months</span>
        </div>
      </div>
    </div>
  );
}

// Lifecycle Step layout
function LifecycleStep({ step, count, desc, warning }: { step: string, count: any, desc: string, warning?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: warning ? 'var(--color-danger)' : 'var(--color-success)',
        border: `3px solid ${warning ? 'var(--color-danger-light)' : 'var(--color-success-light)'}`,
        marginTop: '6px',
        flexShrink: 0
      }}></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 700, color: '#042A2B' }}>{step}</span>
          <span style={{ fontSize: '0.8rem', background: warning ? 'var(--color-danger-light)' : 'var(--color-success-light)', color: warning ? 'var(--color-danger)' : 'var(--color-success-hover)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>{count}</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{desc}</span>
      </div>
    </div>
  );
}

// Arrow icons
function ArrowLeftIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
}

function ArrowRightIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
}

// Empty state loader fallback helper
function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '0.85rem' }}>
      <span>{text}</span>
    </div>
  );
}

// Helper to check for NaN in calculations
function doubleCheckNum(num: any): number {
  const parsed = Number(num);
  return isNaN(parsed) || parsed === 0 ? 1 : parsed;
}

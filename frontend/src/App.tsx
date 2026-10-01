import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Battery, 
  BatteryCharging, 
  Calendar, 
  Info, 
  MapPin, 
  Thermometer, 
  Trash2, 
  TrendingUp, 
  Zap,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  User,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  X,
  Search,
  Printer,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import 'leaflet/dist/leaflet.css';
import './App.css';
import CompanyDashboardView from './components/CompanyDashboardView';
import { RaiseComplaintModal } from './components/RaiseComplaintModal';
import L from 'leaflet';
import { useRef } from 'react';
import { BACKEND_URL, API_BASE_URL } from './config/api';

interface BatteryAnalysis {
  id?: number;
  manufacturer: string;
  model: string;
  batteryAge: number;
  odometer: number;
  originalCapacity: number;
  currentUsableCapacity: number;
  currentBatteryPercentage: number;
  chargingCycles: number;
  averageTemperature: number;
  averageRange: number;
  normalChargingPercentage: number;
  fastChargingPercentage: number;
  soh?: number;
  capacityLoss?: number;
  condition?: string;
  confidenceScore?: number;
  explanation?: string;
  createdAt?: string;
  vehicleId?: string;
  vehicleType?: string;
  usableCapacityChange?: number;
  sohChange?: number;
  odometerChange?: number;
  cyclesChange?: number;
  rangeChange?: number;
  ageChange?: number;
  safetyScore?: number;
  riskLevel?: string;
}

const CITIES = [
  { name: 'Jamshedpur', lat: 22.8046, lng: 86.2029 },
  { name: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { name: 'Paradip', lat: 20.3164, lng: 86.6109 },
  { name: 'Cuttack', lat: 20.4625, lng: 85.8830 },
  { name: 'Rourkela', lat: 22.2604, lng: 84.8536 },
  { name: 'Sambalpur', lat: 21.4669, lng: 83.9812 },
  { name: 'Puri', lat: 19.8134, lng: 85.8312 },
  { name: 'Balasore', lat: 21.4934, lng: 86.9337 },
  { name: 'Kendujhargarh', lat: 21.6289, lng: 85.5817 },
  { name: 'Angul', lat: 20.8444, lng: 85.1511 },
  { name: 'Dhenkanal', lat: 20.6621, lng: 85.6000 },
  { name: 'Bhadrak', lat: 21.0574, lng: 86.4958 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 }
];



export default function App() {
  // Scroll & Active Section States
  const [activeSection, setActiveSection] = useState<'home' | 'features' | 'analysis'>('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Nearest Charging Stations States & Refs
  const [selectedCityName, setSelectedCityName] = useState<string>('');
  const [userLat, setUserLat] = useState<number | ''>('');
  const [userLng, setUserLng] = useState<number | ''>('');
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [nearbyStations, setNearbyStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);
  const [gpsError, setGpsError] = useState<string>('');
  const [locationAccessGranted, setLocationAccessGranted] = useState<boolean | null>(null);
  const [chargingSearchLoading, setChargingSearchLoading] = useState<boolean>(false);
  const [chargingSearchError, setChargingSearchError] = useState<string>('');

  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // EV Comparison & Recommendation States
  const [recBudget, setRecBudget] = useState<number | ''>(1500000);
  const [recCity, setRecCity] = useState<string>('Jamshedpur');
  const [recType, setRecType] = useState<string>('ELECTRIC_CAR');
  const [recMinRange, setRecMinRange] = useState<number | ''>('');
  const [recPriority, setRecPriority] = useState<string>('Price');
  const [recommendedEvs, setRecommendedEvs] = useState<any[]>([]);
  const [recSearchLoading, setRecSearchLoading] = useState<boolean>(false);
  const [recSearchError, setRecSearchError] = useState<string>('');

  const [allEvsList, setAllEvsList] = useState<any[]>([]);
  const [compEv1, setCompEv1] = useState<string>('');
  const [compEv2, setCompEv2] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);
  const [compSearchLoading, setCompSearchLoading] = useState<boolean>(false);
  const [compSearchError, setCompSearchError] = useState<string>('');

  // QR Verification View States
  const [isQrReportView, setIsQrReportView] = useState(false);
  const [qrReportData, setQrReportData] = useState<BatteryAnalysis | null>(null);
  const [qrReportHistory, setQrReportHistory] = useState<BatteryAnalysis[]>([]);
  const [qrVerificationStatus, setQrVerificationStatus] = useState<string>('Verifying...');
  const [qrReportId, setQrReportId] = useState<string>('');

  const fetchPublicReport = async (reportIdStr: string) => {
    try {
      setLoading(true);
      setError('');
      setQrReportId(reportIdStr);
      setIsQrReportView(true);
      setQrVerificationStatus('Verifying authenticity with server...');

      const parts = reportIdStr.split('-');
      if (parts.length < 2) {
        setQrVerificationStatus('Invalid Report ID format.');
        setLoading(false);
        return;
      }
      const dbId = parts[1];

      const response = await fetch(`${BACKEND_URL}/api/battery/public/assessment/${dbId}`);
      if (response.ok) {
        const data = await response.json();
        setQrReportData(data.assessment);
        setQrReportHistory(data.history || []);
        setQrVerificationStatus('VERIFIED: Dynamic QR Verification Success');
      } else {
        setQrVerificationStatus('Verification Failed: Report ID not found in database.');
      }
    } catch (err) {
      console.error(err);
      setQrVerificationStatus('Verification Error: Could not connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    const element = document.getElementById('passport-print-area');
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     `EV_Battery_Passport_${qrReportData?.vehicleId || result?.vehicleId || 'EV-REPORT'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    const generate = () => {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save();
    };

    // @ts-ignore
    if (window.html2pdf) {
      generate();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = generate;
      document.head.appendChild(script);
    }
  };

  // Second Life Platform States
  const [activeSlTab, setActiveSlTab] = useState<'marketplace' | 'solar' | 'backup'>('marketplace');
  const [marketplaceLocation, setMarketplaceLocation] = useState('Jamshedpur, Jharkhand');
  const [radiusFilter, setRadiusFilter] = useState(10);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [chemistryFilter, setChemistryFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState<number | ''>('');
  const [sohFilter, setSohFilter] = useState<number | ''>('');
  const [listings, setListings] = useState<any[]>([]);
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [contactSellerModal, setContactSellerModal] = useState<any | null>(null);
  

  
  const [listingForm, setListingForm] = useState({
    vehicleType: 'car',
    manufacturer: '',
    model: '',
    chemistry: 'LFP',
    capacity: 0,
    estimatedSoH: 0,
    chargingCycles: 0,
    batteryAge: 0,
    price: 0,
    city: 'Jamshedpur',
    state: 'Jharkhand',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=300&q=80',
    phoneNumber: ''
  });

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      
      if (priceFilter) params.append('maxPrice', priceFilter.toString());
      if (sohFilter) params.append('minSoh', sohFilter.toString());
      if (vehicleTypeFilter) params.append('vehicleType', vehicleTypeFilter);
      if (chemistryFilter) params.append('chemistry', chemistryFilter);
      
      const response = await fetch(`${BACKEND_URL}/api/marketplace/listings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        
        // Sort by city match to prioritize "Your Location" (e.g. Jamshedpur)
        const userCity = marketplaceLocation.split(',')[0].toLowerCase().trim();
        const sorted = [...data].sort((a, b) => {
          const aMatch = a.city.toLowerCase().trim() === userCity ? 1 : 0;
          const bMatch = b.city.toLowerCase().trim() === userCity ? 1 : 0;
          return bMatch - aMatch;
        });
        
        setListings(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    if (!isLoggedIn || !user) {
      setError('You must be logged in to create a listing.');
      return;
    }
    if (!listingForm.manufacturer || !listingForm.model || !listingForm.capacity || !listingForm.price || !listingForm.city || !listingForm.state || !listingForm.phoneNumber) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...listingForm,
        sellerEmail: user.gmail,
        status: 'AVAILABLE'
      };
      
      const response = await fetch(`${BACKEND_URL}/api/marketplace/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        setIsCreatingListing(false);
        setListingForm({
          vehicleType: 'car',
          manufacturer: '',
          model: '',
          chemistry: 'LFP',
          capacity: 0,
          estimatedSoH: 0,
          chargingCycles: 0,
          batteryAge: 0,
          price: 0,
          city: 'Jamshedpur',
          state: 'Jharkhand',
          description: '',
          imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=300&q=80',
          phoneNumber: ''
        });
        setSuccessMsg('Battery listing posted successfully!');
        fetchListings();
      } else {
        setError('Failed to submit listing. Please try again.');
      }
    } catch (err) {
      setError('Server error while submitting listing.');
    } finally {
      setLoading(false);
    }
  };



  // Vehicle Selection Type
  const [vehicleType, setVehicleType] = useState<'scooty' | 'bike' | 'car' | 'bus'>('car');

  // Form State
  const [formData, setFormData] = useState<BatteryAnalysis>({
    manufacturer: '',
    model: '',
    batteryAge: 0,
    odometer: 0,
    originalCapacity: 0,
    currentUsableCapacity: 0,
    currentBatteryPercentage: 0,
    chargingCycles: 0,
    averageTemperature: 0,
    averageRange: 0,
    normalChargingPercentage: 0,
    fastChargingPercentage: 0,
  });

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Registration Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerOtp, setRegisterOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // User details
  const [user, setUser] = useState<{ name: string; gmail: string } | null>(null);
  const [authType, setAuthType] = useState<'admin' | 'user' | 'company' | null>(null);
  const [registerRole, setRegisterRole] = useState<'ROLE_USER' | 'ROLE_COMPANY'>('ROLE_USER');
  const [myVehicles, setMyVehicles] = useState<any[]>([]);

  // UI / Logic States
  const [view, setView] = useState<'main' | 'report' | 'passport' | 'secondlife' | 'company'>('main');
  const [result, setResult] = useState<BatteryAnalysis | null>(null);
  const [history, setHistory] = useState<BatteryAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Vehicle Search & History states
  const [searchVehicleId, setSearchVehicleId] = useState('');
  const [isReturningToggle, setIsReturningToggle] = useState(false);
  const [vehicleCheckStatus, setVehicleCheckStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehicleHistory, setVehicleHistory] = useState<BatteryAnalysis[]>([]);
  const [lastAssessment, setLastAssessment] = useState<BatteryAnalysis | null>(null);

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {};
    if (isLoggedIn) {
      headers['X-User-Email'] = authType === 'admin' ? 'admin' : user?.gmail || '';
    }
    return headers;
  };

  const fetchMyVehicles = async (email: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/battery/vehicles`, {
        headers: {
          'X-User-Email': email
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMyVehicles(data);
      }
    } catch (err) {
      console.error('Failed to fetch user vehicles:', err);
    }
  };

  // Restore session on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryReportId = params.get('reportId');
    if (queryReportId) {
      fetchPublicReport(queryReportId);
    }

    const savedUser = localStorage.getItem('ev_diagnostics_user');
    const savedAuthType = localStorage.getItem('ev_diagnostics_authtype');
    if (savedUser && savedAuthType) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setAuthType(savedAuthType as 'admin' | 'user' | 'company');
      setIsLoggedIn(true);
      if (savedAuthType === 'user') {
        fetchMyVehicles(parsedUser.gmail);
      } else if (savedAuthType === 'company') {
        setView('company');
      }
    }
  }, []);

  // Company Dashboard States
  const [companyTab, setCompanyTab] = useState<'dashboard' | 'models' | 'sales' | 'health' | 'service' | 'problems' | 'comparison'>('dashboard');
  const [companySummary, setCompanySummary] = useState<any>(null);
  const [companySales, setCompanySales] = useState<any[]>([]);
  const [companyModelSales, setCompanyModelSales] = useState<any>(null);
  const [companyModelsList, setCompanyModelsList] = useState<string[]>([]);
  const [selectedCompanyModel, setSelectedCompanyModel] = useState<string>('EV 360');
  const [companyModelDetail, setCompanyModelDetail] = useState<any>(null);
  const [companyBatteryHealth, setCompanyBatteryHealth] = useState<any[]>([]);
  const [companyServiceSummary, setCompanyServiceSummary] = useState<any>(null);
  const [companyProblems, setCompanyProblems] = useState<any[]>([]);
  const [selectedCompanyProblem, setSelectedCompanyProblem] = useState<any>(null);
  const [companyProblemMatrix, setCompanyProblemMatrix] = useState<any>(null);
  const [companyInsights, setCompanyInsights] = useState<any[]>([]);
  
  // Comparison state
  const [compModel1, setCompModel1] = useState<string>('E1');
  const [compModel2, setCompModel2] = useState<string>('EV 360');
  const [companyComparisonData, setCompanyComparisonData] = useState<any>(null);

  // Vehicle detail search state
  const [searchCompanyVehicleId, setSearchCompanyVehicleId] = useState<string>('');
  const [searchedVehicleDetail, setSearchedVehicleDetail] = useState<any>(null);

  // Filters for sales
  const [salesRangeFilter, setSalesRangeFilter] = useState<string>('12 months');
  const [salesModelFilter, setSalesModelFilter] = useState<string>('All Models');

  // Loading/Error states
  const [companyLoading, setCompanyLoading] = useState<boolean>(false);
  // Customer Complaint Modal State
  const [raiseComplaintModalOpen, setRaiseComplaintModalOpen] = useState(false);

  const handleRaiseComplaintSuccess = (newComplaint: any) => {
    // 1. Refetch company analytics if available
    fetchCompanyDashboardData();

    // 2. Also optimistically update companyProblems state so it shows immediately
    setCompanyProblems(prev => {
      const existingIdx = prev.findIndex(p => p.problem?.toLowerCase() === newComplaint.issueType?.toLowerCase());
      if (existingIdx >= 0) {
        const updated = [...prev];
        const target = { ...updated[existingIdx] };
        target.count = (target.count || 0) + 1;
        target.affectedVehicles = (target.affectedVehicles || 0) + 1;
        target.affectedUsersCount = (target.affectedUsersCount || target.affectedVehicles || 0) + 1;
        
        const complaints = target.complaints ? [...target.complaints] : [];
        complaints.unshift({
          id: Date.now(),
          vehicleId: newComplaint.vehicleId,
          model: newComplaint.model,
          issueType: newComplaint.issueType,
          severity: newComplaint.severity,
          description: newComplaint.description,
          reportedDate: newComplaint.reportedDate,
          status: 'ACTIVE'
        });
        target.complaints = complaints;
        updated[existingIdx] = target;
        return updated;
      } else {
        const newProb = {
          problem: newComplaint.issueType,
          count: 1,
          affectedVehicles: 1,
          affectedUsersCount: 1,
          percentageOfTotal: 5.0,
          avgVehicleAge: 1.5,
          avgBatterySoh: 82.0,
          serviceVisitsCaused: 1,
          affectedModels: { [newComplaint.model]: 1 },
          complaints: [{
            id: Date.now(),
            vehicleId: newComplaint.vehicleId,
            model: newComplaint.model,
            issueType: newComplaint.issueType,
            severity: newComplaint.severity,
            description: newComplaint.description,
            reportedDate: newComplaint.reportedDate,
            status: 'ACTIVE'
          }]
        };
        return [newProb, ...prev];
      }
    });
  };

  const [companyError, setCompanyError] = useState<string>('');

  const fetchCompanyDashboardData = async () => {
    setCompanyLoading(true);
    setCompanyError('');
    try {
      const headers = { ...getHeaders() };
      
      // Fetch summary
      const summaryRes = await fetch(`${BACKEND_URL}/api/company/dashboard/summary`, { headers });
      if (summaryRes.ok) setCompanySummary(await summaryRes.json());
      
      // Fetch sales rankings
      const salesRankRes = await fetch(`${BACKEND_URL}/api/company/sales/models`, { headers });
      if (salesRankRes.ok) setCompanyModelSales(await salesRankRes.json());

      // Fetch models list
      const modelsRes = await fetch(`${BACKEND_URL}/api/company/models`, { headers });
      if (modelsRes.ok) setCompanyModelsList(await modelsRes.json());

      // Fetch battery health
      const healthRes = await fetch(`${BACKEND_URL}/api/company/battery-health`, { headers });
      if (healthRes.ok) setCompanyBatteryHealth(await healthRes.json());

      // Fetch service insights
      const serviceRes = await fetch(`${BACKEND_URL}/api/company/service/summary`, { headers });
      if (serviceRes.ok) setCompanyServiceSummary(await serviceRes.json());

      // Fetch problems list
      const problemsRes = await fetch(`${BACKEND_URL}/api/company/service/problems`, { headers });
      if (problemsRes.ok) {
        const probs = await problemsRes.json();
        setCompanyProblems(probs);
        if (probs.length > 0) setSelectedCompanyProblem(probs[0]);
      }

      // Fetch problem matrix
      const matrixRes = await fetch(`${BACKEND_URL}/api/company/service/problems/by-model`, { headers });
      if (matrixRes.ok) setCompanyProblemMatrix(await matrixRes.json());

      // Fetch engineering insights
      const insightsRes = await fetch(`${BACKEND_URL}/api/company/insights`, { headers });
      if (insightsRes.ok) setCompanyInsights(await insightsRes.json());

    } catch (err) {
      console.error(err);
      setCompanyError('Unable to load company analytics. Please try again.');
    } finally {
      setCompanyLoading(false);
    }
  };

  const fetchCompanySalesData = async () => {
    try {
      const headers = { ...getHeaders() };
      const params = new URLSearchParams();
      params.append('range', salesRangeFilter);
      if (salesModelFilter) params.append('model', salesModelFilter);
      
      const res = await fetch(`${BACKEND_URL}/api/company/sales/monthly?${params.toString()}`, { headers });
      if (res.ok) setCompanySales(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanyModelDetail = async (modelName: string) => {
    try {
      const headers = { ...getHeaders() };
      const res = await fetch(`${BACKEND_URL}/api/company/models/${modelName}`, { headers });
      if (res.ok) setCompanyModelDetail(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanyComparison = async (m1: string, m2: string) => {
    try {
      const headers = { ...getHeaders() };
      const res = await fetch(`${BACKEND_URL}/api/company/models/compare?model1=${m1}&model2=${m2}`, { headers });
      if (res.ok) setCompanyComparisonData(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanyVehicleDetail = async (vid: string) => {
    if (!vid.trim()) return;
    setCompanyLoading(true);
    setSearchedVehicleDetail(null);
    try {
      const headers = { ...getHeaders() };
      const res = await fetch(`${BACKEND_URL}/api/company/vehicles/${vid.trim()}`, { headers });
      if (res.ok) {
        setSearchedVehicleDetail(await res.json());
      } else {
        alert('Vehicle not found.');
      }
    } catch (err) {
      console.error(err);
      alert('Error searching vehicle details.');
    } finally {
      setCompanyLoading(false);
    }
  };

  // Triggers for company fetches
  useEffect(() => {
    if (view === 'company') {
      fetchCompanyDashboardData();
    }
  }, [view, isLoggedIn]);

  useEffect(() => {
    if (view === 'company') {
      fetchCompanySalesData();
    }
  }, [view, salesRangeFilter, salesModelFilter, isLoggedIn]);

  useEffect(() => {
    if (view === 'company' && selectedCompanyModel) {
      fetchCompanyModelDetail(selectedCompanyModel);
    }
  }, [view, selectedCompanyModel, isLoggedIn]);

  useEffect(() => {
    if (view === 'company' && compModel1 && compModel2) {
      fetchCompanyComparison(compModel1, compModel2);
    }
  }, [view, compModel1, compModel2, isLoggedIn]);

  useEffect(() => {
    if (view === 'secondlife') {
      fetchListings();
    }
  }, [view, marketplaceLocation, vehicleTypeFilter, chemistryFilter, priceFilter, sohFilter]);

  const handleSendOtp = async () => {
    if (!registerEmail.trim()) {
      setError('Please enter your Gmail address.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail: registerEmail.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setOtpSent(true);
        setSuccessMsg(data.message || 'OTP sent successfully.');
        setOtpCooldown(30);
      } else {
        setError(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Could not connect to server to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!registerOtp) {
      setError('Please enter the 6-digit OTP verification code.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          phoneNumber: registerPhone,
          gmail: registerEmail,
          password: registerPassword,
          otp: registerOtp,
          role: registerRole
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Registration successful! You can now log in.');
        setRegisterName('');
        setRegisterPhone('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
        setRegisterOtp('');
        setOtpSent(false);
        setAuthMode('login');
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Could not connect to server to register.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVehicleId = async () => {
    if (!searchVehicleId.trim()) {
      setVehicleCheckStatus({ success: false, message: 'Please enter a valid Vehicle ID.' });
      return;
    }
    setLoading(true);
    setVehicleCheckStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle/${searchVehicleId.trim()}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const { vehicle, history: assessments } = data;
        
        // Auto-populate vehicle details
        setFormData(prev => ({
          ...prev,
          manufacturer: vehicle.manufacturer || '',
          model: vehicle.model || '',
          originalCapacity: assessments.length > 0 ? assessments[0].originalCapacity : prev.originalCapacity
        }));
        
        setVehicleType(vehicle.vehicleType || 'car');
        setSelectedVehicleId(vehicle.vehicleId);
        setVehicleHistory(assessments);
        
        if (assessments && assessments.length > 0) {
          const latest = assessments[assessments.length - 1];
          setLastAssessment(latest);
          
          setFormData(prev => ({
            ...prev,
            manufacturer: vehicle.manufacturer || '',
            model: vehicle.model || '',
            batteryAge: latest.batteryAge,
            odometer: latest.odometer,
            originalCapacity: latest.originalCapacity,
            currentUsableCapacity: latest.currentUsableCapacity,
            currentBatteryPercentage: latest.currentBatteryPercentage,
            chargingCycles: latest.chargingCycles,
            averageTemperature: latest.averageTemperature,
            averageRange: latest.averageRange,
            normalChargingPercentage: latest.normalChargingPercentage,
            fastChargingPercentage: latest.fastChargingPercentage
          }));
        } else {
          setLastAssessment(null);
        }
        
        setVehicleCheckStatus({
          success: true,
          message: `Vehicle ID verified: ${vehicle.manufacturer} ${vehicle.model} (${vehicle.vehicleId})`
        });
        if (isLoggedIn && authType === 'user') {
          fetchMyVehicles(user?.gmail || '');
        }
      } else {
        setVehicleCheckStatus({
          success: false,
          message: 'Vehicle ID not found or unauthorized.'
        });
      }
    } catch (err) {
      setVehicleCheckStatus({
        success: false,
        message: 'Could not connect to server to verify Vehicle ID.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetVehicleRegistration = () => {
    setSelectedVehicleId('');
    setSearchVehicleId('');
    setVehicleHistory([]);
    setLastAssessment(null);
    setVehicleCheckStatus(null);
    setFormData({
      manufacturer: '',
      model: '',
      batteryAge: 0,
      odometer: 0,
      originalCapacity: 0,
      currentUsableCapacity: 0,
      currentBatteryPercentage: 0,
      chargingCycles: 0,
      averageTemperature: 0,
      averageRange: 0,
      normalChargingPercentage: 0,
      fastChargingPercentage: 0,
    });
  };

  const fetchVehicleHistory = async (vid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicle/${vid}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setVehicleHistory(data.history || []);
        if (data.history && data.history.length > 1) {
          setLastAssessment(data.history[data.history.length - 2]);
        } else {
          setLastAssessment(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch vehicle history:', err);
    }
  };

  // Handle Scroll to highlight navigation links dynamically
  useEffect(() => {
    if (view === 'report') {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      const featuresSection = document.getElementById('features-section');
      const scrollPos = window.scrollY + window.innerHeight * 0.4;

      if (featuresSection && scrollPos >= featuresSection.offsetTop) {
        setActiveSection('features');
      } else {
        setActiveSection('home');
      }

      // Header background transition
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [view]);

  // Keep header scrolled when report view is active
  useEffect(() => {
    if (view === 'report') {
      setIsScrolled(true);
    }
  }, [view]);

  // Fetch History on startup
  useEffect(() => {
    fetchHistory();
  }, [isLoggedIn]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isString = name === 'manufacturer' || name === 'model';
    
    setFormData(prev => ({
      ...prev,
      [name]: isString ? value : parseFloat(value) || 0
    }));
  };

  const loadDemoData = () => {
    if (vehicleType === 'scooty') {
      setFormData({
        manufacturer: 'Ather',
        model: '450X Gen 3',
        batteryAge: 1.5,
        odometer: 12000,
        originalCapacity: 3.7,
        currentUsableCapacity: 3.33, // 90% SoH
        currentBatteryPercentage: 85,
        chargingCycles: 150,
        averageTemperature: 28,
        averageRange: 90,
        normalChargingPercentage: 90,
        fastChargingPercentage: 10,
      });
    } else if (vehicleType === 'bike') {
      setFormData({
        manufacturer: 'Revolt',
        model: 'RV400',
        batteryAge: 2.0,
        odometer: 22000,
        originalCapacity: 3.24,
        currentUsableCapacity: 2.85, // ~88% SoH
        currentBatteryPercentage: 70,
        chargingCycles: 220,
        averageTemperature: 25,
        averageRange: 110,
        normalChargingPercentage: 80,
        fastChargingPercentage: 20,
      });
    } else if (vehicleType === 'car') {
      setFormData({
        manufacturer: 'Tesla',
        model: 'Model Y Long Range',
        batteryAge: 2.8,
        odometer: 54000,
        originalCapacity: 75.0,
        currentUsableCapacity: 68.25, // Exactly 91% SoH
        currentBatteryPercentage: 82,
        chargingCycles: 360,
        averageTemperature: 22,
        averageRange: 460,
        normalChargingPercentage: 85,
        fastChargingPercentage: 15,
      });
    } else if (vehicleType === 'bus') {
      setFormData({
        manufacturer: 'BYD',
        model: 'K9 Electric Bus',
        batteryAge: 4.2,
        odometer: 145000,
        originalCapacity: 324.0,
        currentUsableCapacity: 272.16, // 84% SoH
        currentBatteryPercentage: 65,
        chargingCycles: 980,
        averageTemperature: 31,
        averageRange: 240,
        normalChargingPercentage: 55,
        fastChargingPercentage: 45,
      });
    }
    setSuccessMsg(`Demo data for EV ${vehicleType} loaded! Review and click Enter/Continue.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear the entire analysis database history?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/history`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (response.ok) {
        setHistory([]);
        setResult(null);
        setSuccessMsg('Database history cleared.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError('Failed to clear database logs.');
      }
    } catch (err) {
      setError('Connection to backend failed. Make sure Spring Boot is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Form Validaion checks
    if (!formData.manufacturer || !formData.model) {
      setError('Please provide manufacturer and model names.');
      setLoading(false);
      return;
    }
    if (formData.batteryAge < 0 || formData.odometer < 0 || formData.chargingCycles < 0 || formData.averageRange < 0) {
      setError('Battery age, odometer, charging cycles, and range must be positive values.');
      setLoading(false);
      return;
    }
    if (formData.originalCapacity <= 0 || formData.currentUsableCapacity <= 0) {
      setError('Original and Current Usable Capacities must be greater than 0.');
      setLoading(false);
      return;
    }
    if (formData.currentUsableCapacity > formData.originalCapacity) {
      setError('Current Usable Capacity cannot exceed Original Capacity.');
      setLoading(false);
      return;
    }
    if (formData.currentBatteryPercentage < 0 || formData.currentBatteryPercentage > 100) {
      setError('Current SoC (%) must be between 0 and 100.');
      setLoading(false);
      return;
    }
    
    const chargingSum = formData.normalChargingPercentage + formData.fastChargingPercentage;
    if (Math.abs(chargingSum - 100.0) > 0.01) {
      setError(`Normal charging (${formData.normalChargingPercentage}%) and Fast charging (${formData.fastChargingPercentage}%) must sum to exactly 100%. Current sum: ${chargingSum}%`);
      setLoading(false);
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getHeaders()
      };

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          vehicleId: selectedVehicleId || undefined,
          vehicleType: vehicleType
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        fetchHistory(); // Refresh history
        
        if (data.vehicleId) {
          setSelectedVehicleId(data.vehicleId);
          fetchVehicleHistory(data.vehicleId);
          if (isLoggedIn && authType === 'user') {
            fetchMyVehicles(user?.gmail || '');
          }
        }
        
        setView('report');
        window.scrollTo({ top: 0 });
      } else {
        const errMsg = await response.text();
        setError(`Analysis failed: ${errMsg || response.statusText}`);
      }
    } catch (err) {
      setError('Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to create custom SVG marker icon
  const createMarkerIcon = (color: string, iconType?: 'user' | 'station') => {
    const pinSvg = iconType === 'user' 
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
           <circle cx="12" cy="12" r="8" fill="${color}" opacity="0.3"/>
           <circle cx="12" cy="12" r="5" fill="${color}" stroke="#ffffff" stroke-width="2"/>
         </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
           <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
         </svg>`;
    
    return L.divIcon({
      html: `<div style="display:flex; justify-content:center; align-items:center;">${pinSvg}</div>`,
      className: 'custom-pin-icon',
      iconSize: iconType === 'user' ? [32, 32] : [36, 36],
      iconAnchor: iconType === 'user' ? [16, 16] : [18, 36],
      popupAnchor: [0, iconType === 'user' ? -10 : -32]
    });
  };

  // Browser geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(Number(position.coords.latitude.toFixed(6)));
        setUserLng(Number(position.coords.longitude.toFixed(6)));
        setLocationAccessGranted(true);
        setSelectedCityName('GPS Location');
      },
      (error) => {
        console.error(error);
        setLocationAccessGranted(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please enter coordinates manually.');
        } else {
          setGpsError(`Failed to retrieve location: ${error.message}`);
        }
      }
    );
  };

  // Find nearest stations
  const handleFindNearestCharging = async () => {
    if (userLat === '' || userLng === '') {
      setChargingSearchError('Please provide latitude and longitude coordinates.');
      return;
    }
    
    setChargingSearchLoading(true);
    setChargingSearchError('');
    setSelectedStation(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/charging-stations/nearby?latitude=${userLat}&longitude=${userLng}&radius=${searchRadius}`);
      if (response.ok) {
        const data = await response.json();
        setNearbyStations(data);
        
        // Wait for map container to render, then update map
        setTimeout(() => {
          initializeMapInstance();
          updateMap(Number(userLat), Number(userLng), data);
        }, 100);
      } else {
        const text = await response.text();
        setChargingSearchError(`Backend Error: ${text || response.statusText}`);
      }
    } catch (err) {
      setChargingSearchError('Failed to connect to backend server.');
    } finally {
      setChargingSearchLoading(false);
    }
  };

  const initializeMapInstance = () => {
    const mapDiv = document.getElementById('charging-map');
    if (mapDiv && !mapRef.current) {
      const mapInstance = L.map('charging-map').setView([Number(userLat) || 20.2961, Number(userLng) || 85.8245], 11);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance);
      
      mapRef.current = mapInstance;
      markersGroupRef.current = L.layerGroup().addTo(mapInstance);
    }
  };

  const updateMap = (lat: number, lng: number, stations: any[]) => {
    if (!mapRef.current) return;
    
    const mapInstance = mapRef.current;
    
    // Clear previous markers
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }
    
    // Create/update user location marker
    const userIcon = createMarkerIcon('#3b82f6', 'user');
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon })
        .bindPopup('<b>You are here</b>')
        .addTo(mapInstance);
    }
    
    const boundsPoints: L.LatLngExpression[] = [[lat, lng]];
    
    stations.forEach(station => {
      const stationColor = station.status === 'Available' ? '#0E8360' : (station.status === 'Busy' ? '#D97706' : '#DC2626');
      const stationIcon = createMarkerIcon(stationColor, 'station');
      
      const marker = L.marker([station.latitude, station.longitude], { icon: stationIcon });
      
      const statusClass = station.status === 'Available' ? 'status-avail' : (station.status === 'Busy' ? 'status-busy' : '#offline');
      const popupHtml = `
        <div class="map-popup-card">
          <h4 style="margin: 0 0 0.5rem; font-size: 0.95rem; font-weight: 800; font-family: Outfit, sans-serif;">${station.name}</h4>
          <span class="popup-status-badge ${statusClass}">${station.status}</span>
          <div style="font-size: 0.8rem; margin-top: 0.5rem; line-height: 1.35; font-family: Outfit, sans-serif;">
            <div>⚡ <b>Type:</b> ${station.chargerType || 'N/A'} (${station.powerKw ? station.powerKw + ' kW' : 'N/A'})</div>
            <div>🔌 <b>Ports:</b> ${station.availablePorts} / ${station.totalPorts} Available</div>
            <div>📍 <b>Address:</b> ${station.address || 'N/A'}</div>
            <div style="margin-top: 0.2rem; color: #3b82f6; font-weight: 600;">🚗 <b>Distance:</b> ${station.distanceKm} km</div>
          </div>
          <div style="margin-top: 0.6rem; border-top: 1px solid var(--border-color); padding-top: 0.4rem; font-family: Outfit, sans-serif;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: #0E8360; text-decoration: none; font-size: 0.8rem;">Directions →</a>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupHtml);
      
      marker.on('click', () => {
        setSelectedStation(station);
      });
      
      if (markersGroupRef.current) {
        marker.addTo(markersGroupRef.current);
      }
      
      boundsPoints.push([station.latitude, station.longitude]);
    });
    
    if (boundsPoints.length > 1) {
      mapInstance.fitBounds(L.latLngBounds(boundsPoints), { padding: [45, 45] });
    } else {
      mapInstance.setView([lat, lng], 13);
    }
  };

  // Clean up Leaflet map when unmounting or changing view
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
        userMarkerRef.current = null;
      }
    };
  }, [view]);

  // EV Comparison & Recommendation States & Handlers
  const [selectedRecIndexForDealers, setSelectedRecIndexForDealers] = useState<number | null>(null);

  // Fetch EV list for dropdown
  const fetchEvList = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/evs`);
      if (response.ok) {
        const data = await response.json();
        setAllEvsList(data);
      }
    } catch (err) {
      console.error('Failed to load EV list for comparison:', err);
    }
  };

  // Fetch EV list on startup and view change
  useEffect(() => {
    fetchEvList();
  }, [view]);

  // Personalized EV Recommendation
  const handleFindMyBestEv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recBudget === '' || recBudget <= 0) {
      setRecSearchError('Please specify a budget greater than 0.');
      return;
    }
    setRecSearchLoading(true);
    setRecSearchError('');
    setRecommendedEvs([]);
    setSelectedRecIndexForDealers(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/evs/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          budget: Number(recBudget),
          city: recCity,
          vehicleType: recType,
          minRange: recMinRange ? Number(recMinRange) : null,
          priority: recPriority
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendedEvs(data);
        if (data.length === 0) {
          setRecSearchError('No matching EVs found. Try adjusting your preferences or vehicle type.');
        }
      } else {
        const text = await response.text();
        setRecSearchError(`Backend Error: ${text || response.statusText}`);
      }
    } catch (err) {
      setRecSearchError('Failed to connect to backend server.');
    } finally {
      setRecSearchLoading(false);
    }
  };

  // Direct EV vs EV Comparison
  const handleCompareEvs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compEv1 || !compEv2) {
      setCompSearchError('Please select both EV models to compare.');
      return;
    }
    if (compEv1 === compEv2) {
      setCompSearchError('Please select two different EV models.');
      return;
    }

    setCompSearchLoading(true);
    setCompSearchError('');
    setComparisonResult(null);

    try {
      const params = new URLSearchParams();
      params.append('ev1', compEv1);
      params.append('ev2', compEv2);
      if (recBudget) params.append('budget', recBudget.toString());
      if (recCity) params.append('city', recCity);

      const response = await fetch(`${BACKEND_URL}/api/evs/compare?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setComparisonResult(data);
      } else {
        const text = await response.text();
        setCompSearchError(`Comparison Error: ${text || response.statusText}`);
      }
    } catch (err) {
      setCompSearchError('Failed to connect to backend.');
    } finally {
      setCompSearchLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (loginEmail === 'admin' && loginPassword === 'admin') {
      setIsLoggedIn(true);
      setAuthType('admin');
      setUser({ name: 'Admin', gmail: 'admin' });
      localStorage.setItem('ev_diagnostics_user', JSON.stringify({ name: 'Admin', gmail: 'admin' }));
      localStorage.setItem('ev_diagnostics_authtype', 'admin');
      setSuccessMsg('Logged in successfully as Administrator.');
      setError('');
      setTimeout(() => {
        setSuccessMsg('');
        setIsLoginOpen(false);
      }, 2000);
      setLoading(false);
      fetchHistory(); // Refresh history
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmail: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsLoggedIn(true);
        const resolvedAuthType = data.role === 'ROLE_COMPANY' ? 'company' : 'user';
        setAuthType(resolvedAuthType);
        const loggedInUser = { name: data.name, gmail: data.gmail };
        setUser(loggedInUser);
        localStorage.setItem('ev_diagnostics_user', JSON.stringify(loggedInUser));
        localStorage.setItem('ev_diagnostics_authtype', resolvedAuthType);
        setSuccessMsg('Logged in successfully.');
        setError('');
        setTimeout(() => {
          setSuccessMsg('');
          setIsLoginOpen(false);
          if (resolvedAuthType === 'company') {
            setView('company');
          }
        }, 2000);
        fetchMyVehicles(data.gmail);
        fetchHistory(); // Refresh user history
      } else {
        setError(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Failed to connect to server. Verify Spring Boot is running.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBackToData = () => {
    setView('main');
    setIsScrolled(false);
    setActiveSection('features');
    setTimeout(() => {
      scrollToSection('features-section');
    }, 100);
  };

  // Helper values for Gauges
  const sohVal = result?.soh || 0;
  const radius = 80;
  const circ = 2 * Math.PI * radius; // 502.65
  const strokeDashoffset = circ - (sohVal / 100) * circ;



  // Real-time capacity ratio for visual pack glow
  const liveSoh = formData.originalCapacity > 0 
    ? Math.min(100, Math.max(0, (formData.currentUsableCapacity / formData.originalCapacity) * 100)) 
    : 100;



  const getSohColor = (soh: number) => {
    if (soh >= 90) return '#0E8360'; // green
    if (soh >= 80) return '#0E8360'; // sky blue
    if (soh >= 70) return '#D97706'; // amber
    return '#DC2626'; // red
  };

  // Generate dynamic maintenance tips based on data
  const generateTips = (data: BatteryAnalysis) => {
    const tips = [];
    
    // High temperature check (>30°C)
    const isHot = data.averageTemperature > 30;
    tips.push({
      id: 'temp',
      text: 'Avoid charging or driving aggressively when the battery temperature is excessively hot.',
      highlight: isHot,
      reason: isHot ? `Your average temperature of ${data.averageTemperature}°C is elevated. High ambient and operational temperatures promote secondary chemical reactions that consume active lithium, leading to faster capacity loss.` : ''
    });

    // High fast charging check (>40%)
    const isHighFast = data.fastChargingPercentage > 40;
    tips.push({
      id: 'fast-charge',
      text: 'Use normal AC charging for daily needs and limit DC fast charging to long travel where possible.',
      highlight: isHighFast,
      reason: isHighFast ? `Your fast charging utilization is high (${data.fastChargingPercentage}%). High DC current subjects cells to elevated thermal levels and higher current density, accelerating capacity fade.` : ''
    });

    // Extreme charging/discharging
    tips.push({
      id: 'extreme',
      text: 'Avoid unnecessary extreme charging/discharging. Try to keep state of charge between 10% and 80-90% for daily operation.',
      highlight: false
    });

    // Manufacturer charging practices
    tips.push({
      id: 'practices',
      text: "Follow the manufacturer's recommended charging guidelines. Many suggest setting a charge limit to 80% or 90% for daily commutes.",
      highlight: false
    });

    // Range and health check
    tips.push({
      id: 'monitor',
      text: 'Monitor unusual changes in range and check battery health periodically to catch any cell imbalance early.',
      highlight: false
    });

    return tips;
  };

  // Render Vehicle SVG Illustrations
  const renderVehicleIllustration = (type: 'scooty' | 'bike' | 'car' | 'bus', soh: number) => {
    const sohColor = getSohColor(soh);
    
    switch (type) {
      case 'scooty':
        return (
          <svg viewBox="0 0 600 300" className="ev-chassis-svg">
            <defs>
              <linearGradient id="wheelsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <g opacity="0.15">
              <line x1="0" y1="240" x2="600" y2="240" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="300" cy="140" r="110" stroke="#94a3b8" strokeWidth="1" fill="none" />
            </g>
            
            {/* Scooty frame */}
            <path d="M 120 200 L 155 110 L 220 110 L 260 200 L 410 200 L 445 130 L 475 130" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
            <path d="M 445 130 L 420 70 L 350 70" fill="none" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            
            {/* Wheels */}
            <circle cx="150" cy="210" r="38" fill="url(#wheelsGrad)" />
            <circle cx="150" cy="210" r="18" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
            
            <circle cx="450" cy="210" r="38" fill="url(#wheelsGrad)" />
            <circle cx="450" cy="210" r="18" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
            
            {/* Seat */}
            <path d="M 220 105 C 240 105, 290 105, 310 120 C 320 130, 300 150, 260 150 Z" fill="#334155" />
            
            {/* Battery Pack */}
            <rect x="240" y="185" width="140" height="20" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Battery Pack Glow */}
            <rect 
              className="battery-pack-glow" 
              x="242" 
              y="187" 
              width="136" 
              height="16" 
              rx="3" 
              style={{ fill: sohColor, opacity: 0.8 }} 
            />
            <rect 
              className="battery-cells-glow" 
              x="242" 
              y="187" 
              width="136" 
              height="16" 
              rx="3" 
              style={{ stroke: sohColor }} 
            />
            
            {/* Motor */}
            <circle cx="410" cy="210" r="12" fill="#1e293b" />
            
            {/* Flow */}
            <path d="M 310 195 L 410 210" stroke="var(--color-secondary)" strokeWidth="3" strokeDasharray="4,4" className="battery-cells-glow" />
          </svg>
        );
      case 'bike':
        return (
          <svg viewBox="0 0 600 300" className="ev-chassis-svg">
            <defs>
              <linearGradient id="wheelsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <g opacity="0.15">
              <line x1="0" y1="240" x2="600" y2="240" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="300" cy="140" r="120" stroke="#94a3b8" strokeWidth="1" fill="none" />
            </g>
            
            {/* Bike frame */}
            <path d="M 160 200 L 250 110 L 400 110 L 470 200 L 250 110 L 290 190 L 400 190 L 400 110" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
            <line x1="470" y1="200" x2="420" y2="70" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            <line x1="420" y1="70" x2="370" y2="70" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
            
            {/* Wheels */}
            <circle cx="160" cy="200" r="48" fill="url(#wheelsGrad)" />
            <circle cx="160" cy="200" r="22" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
            
            <circle cx="470" cy="200" r="48" fill="url(#wheelsGrad)" />
            <circle cx="470" cy="200" r="22" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
            
            {/* Tank Cover */}
            <path d="M 270 105 C 290 80, 360 80, 395 105 Z" fill="#475569" />
            
            {/* Battery Pack */}
            <rect x="275" y="120" width="105" height="55" rx="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
            
            {/* Glow */}
            <rect 
              className="battery-pack-glow" 
              x="279" 
              y="124" 
              width="97" 
              height="47" 
              rx="4" 
              style={{ fill: sohColor, opacity: 0.8 }} 
            />
            <rect 
              className="battery-cells-glow" 
              x="279" 
              y="124" 
              width="97" 
              height="47" 
              rx="4" 
              style={{ stroke: sohColor }} 
            />
            
            {/* Motor */}
            <circle cx="260" cy="190" r="18" fill="#1e293b" />
            
            {/* Belt */}
            <line x1="160" y1="200" x2="260" y2="190" stroke="#475569" strokeWidth="3" />
          </svg>
        );
      case 'car':
        return (
          <svg viewBox="0 0 600 300" className="ev-chassis-svg">
            <defs>
              <linearGradient id="wheelsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <g opacity="0.15">
              <line x1="0" y1="240" x2="600" y2="240" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="300" cy="140" r="130" stroke="#94a3b8" strokeWidth="1" fill="none" />
            </g>
            
            {/* Car body */}
            <path 
              className="ev-chassis-outline" 
              d="M 80 190 L 100 190 A 42 42 0 0 1 184 190 L 416 190 A 42 42 0 0 1 500 190 L 540 190 C 565 190 575 175 575 150 L 560 115 C 545 90 520 75 480 75 L 380 75 C 340 75 300 35 230 35 L 140 35 C 95 35 65 75 55 115 L 45 140 C 40 155 40 190 80 190 Z" 
              stroke="#cbd5e1"
              strokeWidth="3"
              fill="none"
            />
            
            {/* Wheels */}
            <circle cx="142" cy="190" r="36" fill="url(#wheelsGrad)" />
            <circle cx="142" cy="190" r="18" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
            
            <circle cx="458" cy="190" r="36" fill="url(#wheelsGrad)" />
            <circle cx="458" cy="190" r="18" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
            
            {/* Battery Pack */}
            <rect x="200" y="155" width="200" height="25" rx="5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            
            {/* Glow */}
            <rect 
              className="battery-pack-glow" 
              x="203" 
              y="158" 
              width="194" 
              height="19" 
              rx="3" 
              style={{ fill: sohColor, opacity: 0.8 }} 
            />
            <rect 
              className="battery-cells-glow" 
              x="203" 
              y="158" 
              width="194" 
              height="19" 
              rx="3" 
              style={{ stroke: sohColor }} 
            />
            
            {/* Motor */}
            <rect x="415" y="150" width="25" height="22" rx="3" fill="#1e293b" />
            <path d="M 400 167 L 415 162" stroke="#64748b" strokeWidth="3" />
          </svg>
        );
      case 'bus':
        return (
          <svg viewBox="0 0 600 300" className="ev-chassis-svg">
            <defs>
              <linearGradient id="wheelsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            <g opacity="0.15">
              <line x1="0" y1="240" x2="600" y2="240" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
            </g>
            
            {/* Bus outline */}
            <rect x="50" y="50" width="500" height="150" rx="15" fill="none" stroke="#cbd5e1" strokeWidth="4" />
            
            {/* Split */}
            <line x1="480" y1="50" x2="480" y2="130" stroke="#cbd5e1" strokeWidth="3" />
            <rect x="70" y="65" width="75" height="50" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="165" y="65" width="75" height="50" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="260" y="65" width="75" height="50" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="355" y="65" width="75" height="50" rx="4" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            
            {/* Wheels */}
            <circle cx="150" cy="200" r="42" fill="url(#wheelsGrad)" />
            <circle cx="150" cy="200" r="20" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
            
            <circle cx="450" cy="200" r="42" fill="url(#wheelsGrad)" />
            <circle cx="450" cy="200" r="20" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" />
            
            {/* Roof battery packs */}
            <rect x="150" y="32" width="120" height="15" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <rect 
              className="battery-pack-glow" 
              x="152" 
              y="34" 
              width="116" 
              height="11" 
              rx="2" 
              style={{ fill: sohColor, opacity: 0.8 }} 
            />
            
            <rect x="300" y="32" width="120" height="15" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <rect 
              className="battery-pack-glow" 
              x="302" 
              y="34" 
              width="116" 
              height="11" 
              rx="2" 
              style={{ fill: sohColor, opacity: 0.8 }} 
            />
            
            {/* Floor pack */}
            <rect x="220" y="185" width="160" height="15" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <rect 
              className="battery-pack-glow" 
              x="222" 
              y="187" 
              width="156" 
              height="11" 
              rx="2" 
              style={{ fill: sohColor, opacity: 0.8 }} 
            />
            <rect 
              className="battery-cells-glow" 
              x="222" 
              y="187" 
              width="156" 
              height="11" 
              rx="2" 
              style={{ stroke: sohColor }} 
            />
          </svg>
        );
    }
  };

  if (isQrReportView) {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', gap: '1rem' }}>
          <div className="spinner" style={{ border: '4px solid rgba(14,165,233,0.1)', borderLeft: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ fontWeight: 600 }}>Verifying battery passport record...</p>
        </div>
      );
    }

    if (!qrReportData) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '2rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
            <AlertTriangle size={64} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Passport Verification Failed</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '1.5rem' }}>
            {qrVerificationStatus}
          </p>
          <button className="btn btn-primary" onClick={() => {
            window.location.href = window.location.origin + window.location.pathname;
          }}>
            Go to Main Application
          </button>
        </div>
      );
    }

    const result = qrReportData;
    const batteryId = result.vehicleId ? 'BAT-' + (result.vehicleId.includes('-') ? result.vehicleId.split('-').slice(1).join('-') : result.vehicleId) : 'BAT-TEMP';
    const reportId = qrReportId;
    const creationDate = result.createdAt ? new Date(result.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    const vehicleType = result.vehicleType || 'car';
    
    let passportState = 'GOOD';
    let stateColor = '#0E8360';
    let stateBg = 'var(--color-success-light)';
    if (result.condition?.toLowerCase() === 'moderate') {
      passportState = 'MODERATE';
      stateColor = '#D97706';
      stateBg = 'var(--color-warning-light)';
    } else if (result.condition?.toLowerCase() === 'degraded' || result.condition?.toLowerCase() === 'poor') {
      passportState = 'POOR';
      stateColor = '#DC2626';
      stateBg = 'var(--color-danger-light)';
    }

    const originalCapacity = result.originalCapacity;
    const currentCapacity = result.currentUsableCapacity;
    const capacityLost = Math.max(0, Math.round((originalCapacity - currentCapacity) * 100) / 100);
    const degradationPercent = Math.max(0, Math.round(((originalCapacity - currentCapacity) / originalCapacity) * 100 * 10) / 10);
    const degradationRate = result.batteryAge > 0 ? (degradationPercent / result.batteryAge).toFixed(1) : '0';

    const tempRisk = result.averageTemperature > 35 ? 'HIGH' : (result.averageTemperature > 30 || result.averageTemperature < 10 ? 'MODERATE' : 'LOW');
    const cycleRisk = result.chargingCycles > 1000 ? 'HIGH' : (result.chargingCycles > 500 ? 'MODERATE' : 'LOW');
    const socRisk = (result.currentBatteryPercentage > 90 || result.currentBatteryPercentage < 15) ? 'MODERATE' : 'LOW';
    const safetyLevel = result.safetyScore && result.safetyScore >= 90 ? 'EXCELLENT' : (result.safetyScore && result.safetyScore >= 75 ? 'STABLE' : 'WARNING');

    let safetyRisk = 'Low';
    if (result.safetyScore && result.safetyScore < 75) safetyRisk = 'High';
    else if (result.safetyScore && result.safetyScore < 90) safetyRisk = 'Moderate';

    let degradationRisk = 'Low';
    if ((result.soh ?? 0) < 80) degradationRisk = 'High';
    else if ((result.soh ?? 0) < 90) degradationRisk = 'Moderate';

    let usageRisk = 'Low';
    if (result.fastChargingPercentage > 50 || result.averageTemperature > 30) usageRisk = 'Moderate';
    if (result.fastChargingPercentage > 75 || result.averageTemperature > 35) usageRisk = 'High';

    let overallRisk = 'Low';
    if (safetyRisk === 'High' || degradationRisk === 'High') overallRisk = 'High';
    else if (safetyRisk === 'Moderate' || degradationRisk === 'Moderate' || usageRisk === 'Moderate') overallRisk = 'Moderate';

    const rul = Math.max(0.5, Math.round((((result.soh ?? 0) - 70) * (result.batteryAge / Math.max(0.1, 100 - (result.soh ?? 0)))) * 10) / 10);

    const capacityImpact = (result.soh ?? 0) < 92 ? 'HIGH IMPACT' : ((result.soh ?? 0) < 96 ? 'MEDIUM IMPACT' : 'LOW IMPACT');
    const cyclesImpact = result.chargingCycles > 600 ? 'HIGH IMPACT' : (result.chargingCycles > 250 ? 'MEDIUM IMPACT' : 'LOW IMPACT');
    const tempImpact = (result.averageTemperature > 35 || result.averageTemperature < 8) ? 'HIGH IMPACT' : ((result.averageTemperature > 28 || result.averageTemperature < 15) ? 'MEDIUM IMPACT' : 'LOW IMPACT');
    const socImpact = (result.currentBatteryPercentage > 95 || result.currentBatteryPercentage < 10) ? 'HIGH IMPACT' : ((result.currentBatteryPercentage > 85 || result.currentBatteryPercentage < 20) ? 'MEDIUM IMPACT' : 'LOW IMPACT');

    let chargingPattern = 'Balanced AC/DC';
    if (result.fastChargingPercentage > 60) chargingPattern = 'DC Fast Intensive';
    else if (result.fastChargingPercentage < 20) chargingPattern = 'Slow AC Dominant';

    const reportOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5175';
    const qrData = encodeURIComponent(`${reportOrigin}/?reportId=${reportId}`);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${qrData}`;

    const sortedHistory = [...qrReportHistory].sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());

    return (
      <div className="scroll-layout-container" style={{ padding: '2rem 2.5rem 3rem', background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .passport-container {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            color: var(--text-primary);
            font-family: var(--font-family);
          }
          .passport-header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 1.5rem;
          }
          .passport-badge-status {
            font-size: 1.1rem;
            font-weight: 800;
            padding: 0.5rem 1.25rem;
            border-radius: 30px;
            letter-spacing: 0.05em;
            display: inline-block;
          }
          .passport-grid-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }
          .passport-grid-3col {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
          .passport-info-row {
            display: flex;
            justify-content: space-between;
            padding: 0.6rem 0;
            border-bottom: 1px dashed var(--border-color);
            font-size: 0.9rem;
          }
          .passport-info-row:last-child {
            border-bottom: none;
          }
          .passport-label {
            color: var(--text-secondary);
            font-weight: 500;
          }
          .passport-value {
            font-weight: 700;
            color: var(--text-primary);
          }
          .risk-pill {
            padding: 0.2rem 0.6rem;
            border-radius: 4px;
            font-weight: 700;
            font-size: 0.78rem;
            text-transform: uppercase;
          }
          .risk-high { background: var(--color-danger-light); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.2); }
          .risk-moderate { background: var(--color-warning-light); color: var(--color-warning); border: 1px solid rgba(245, 158, 11, 0.2); }
          .risk-low { background: var(--color-success-light); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.2); }
          
          .timeline-wrapper {
            position: relative;
            padding-left: 2rem;
            border-left: 2px solid var(--border-color);
            margin: 1rem 0;
          }
          .timeline-node {
            position: relative;
            margin-bottom: 1.75rem;
          }
          .timeline-node::before {
            content: '';
            position: absolute;
            left: calc(-2rem - 6px);
            top: 4px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--color-secondary);
            border: 2px solid var(--bg-primary);
            box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
          }
          .timeline-node.current::before {
            background: var(--color-success);
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
            width: 12px;
            height: 12px;
            left: calc(-2rem - 7px);
          }
          .timeline-content-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-sm);
            padding: 0.85rem 1.25rem;
            transition: all var(--transition-normal);
          }
          .timeline-content-card:hover {
            box-shadow: var(--shadow-soft);
            border-color: var(--color-secondary);
          }

          @media print {
            body {
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            .scroll-layout-container {
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .passport-container {
              max-width: 100% !important;
              gap: 1.5rem !important;
            }
            .card {
              border: 1px solid #94a3b8 !important;
              box-shadow: none !important;
              background: #ffffff !important;
            }
            .passport-header-section {
              border-bottom: 2px solid #000000 !important;
            }
            .timeline-content-card {
              background: #ffffff !important;
              border: 1px solid #94a3b8 !important;
            }
          }
        ` }} />

        <div className="passport-container">
          
          {/* Header Action Buttons (no-print) */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                window.location.href = window.location.origin + window.location.pathname;
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              Go to Main App
            </button>

            <button 
              className="btn btn-primary"
              onClick={downloadPdf}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
            >
              <Printer size={16} />
              Download Report
            </button>
          </div>

          {/* VERIFICATION STATUS CARD */}
          <div className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-success)', background: 'var(--color-success-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={28} style={{ color: 'var(--color-success)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success-hover)' }}>
                  {qrVerificationStatus}
                </h3>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Secure cryptographic matching successfully confirmed. Verified by EV Global Alliance.
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '0.75rem', marginTop: '0.25rem', fontSize: '0.85rem' }}>
              <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Vehicle ID</span><strong style={{ textTransform: 'uppercase' }}>{result.vehicleId}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Battery ID</span><strong style={{ textTransform: 'uppercase' }}>{batteryId}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Report ID</span><strong>{reportId}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Assessment Date</span><strong>{creationDate}</strong></div>
            </div>
          </div>

          {/* MAIN PASSPORT CONTAINER FOR PRINT / PDF */}
          <div id="passport-print-area" className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.25rem', boxShadow: 'var(--shadow-card)', position: 'relative', background: 'var(--bg-primary)' }}>
            
            {/* Stamp */}
            <div style={{ position: 'absolute', top: '2rem', right: '2rem', opacity: 0.03, pointerEvents: 'none' }} className="no-print">
              <FileText size={400} />
            </div>

            {/* Header & Logo */}
            <div className="passport-header-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--color-secondary-light)', color: 'var(--color-secondary)', padding: '0.75rem', borderRadius: '12px' }}>
                  <ShieldCheck size={36} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Digital Battery Passport</h1>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                    Global EV Alliance Standard (EVS-2026)
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="passport-badge-status" style={{ color: stateColor, background: stateBg, border: `1px solid ${stateColor}` }}>
                  STATE: {passportState}
                </span>
              </div>
            </div>

            {/* SECTION 1: BATTERY IDENTITY */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '2rem', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  1. Battery Identity
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div className="passport-info-row">
                      <span className="passport-label">Vehicle ID</span>
                      <span className="passport-value" style={{ textTransform: 'uppercase' }}>{result.vehicleId}</span>
                    </div>
                    <div className="passport-info-row">
                      <span className="passport-label">Battery ID</span>
                      <span className="passport-value" style={{ textTransform: 'uppercase' }}>{batteryId}</span>
                    </div>
                    <div className="passport-info-row">
                      <span className="passport-label">Manufacturer</span>
                      <span className="passport-value">{result.manufacturer}</span>
                    </div>
                  </div>
                  <div>
                    <div className="passport-info-row">
                      <span className="passport-label">Model</span>
                      <span className="passport-value">{result.model}</span>
                    </div>
                    <div className="passport-info-row">
                      <span className="passport-label">Passport Date</span>
                      <span className="passport-value">{creationDate}</span>
                    </div>
                    <div className="passport-info-row">
                      <span className="passport-label">Unique Report ID</span>
                      <span className="passport-value">{reportId}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <img src={qrCodeUrl} alt="Report Verification QR Code" style={{ width: '130px', height: '130px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#ffffff', padding: '4px' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>VERIFY REPORT</span>
              </div>
            </div>

            {/* SECTION 2: BATTERY SPECIFICATIONS */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                2. Battery Technical Specifications
              </h3>
              <div className="passport-grid-3col">
                <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Capacity Metrics</span>
                  <div className="passport-info-row"><span className="passport-label">Original Capacity</span><span className="passport-value">{result.originalCapacity} kWh</span></div>
                  <div className="passport-info-row"><span className="passport-label">Current Usable</span><span className="passport-value">{result.currentUsableCapacity} kWh</span></div>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Usage Metrics</span>
                  <div className="passport-info-row"><span className="passport-label">Odometer Reading</span><span className="passport-value">{result.odometer.toLocaleString()} km</span></div>
                  <div className="passport-info-row"><span className="passport-label">Battery Age</span><span className="passport-value">{result.batteryAge} Years</span></div>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Lifecycle Metrics</span>
                  <div className="passport-info-row"><span className="passport-label">Charging Cycles</span><span className="passport-value">{result.chargingCycles} Cycles</span></div>
                  <div className="passport-info-row"><span className="passport-label">Vehicle Type</span><span className="passport-value" style={{ textTransform: 'uppercase' }}>{vehicleType}</span></div>
                </div>
              </div>
            </div>

            {/* SECTION 3: CURRENT BATTERY CONDITION */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                3. Current Battery Condition
              </h3>
              <div className="passport-grid-2col">
                <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${stateColor}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stateColor }}>{result.soh}%</div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>State of Health</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: stateColor }}>{passportState} Condition</span>
                    </div>
                  </div>
                  <div className="passport-info-row"><span className="passport-label">Active Capacity Degradation</span><span className="passport-value">{degradationPercent}%</span></div>
                  <div className="passport-info-row"><span className="passport-label">Model Engine Prediction</span><span className="passport-value">GBRT Regression ({result.soh}% SoH)</span></div>
                </div>

                <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>
                    AI Condition recommendation
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.45', margin: 0 }}>
                    {passportState === 'GOOD' ? (
                      "The battery remains in excellent state with minimal capacity wear. Continue current charging habits and limit charging to 80-90% for normal daily commuting."
                    ) : passportState === 'MODERATE' ? (
                      "Moderate degradation has been logged. Maintain operational temperatures below 30°C and prioritize AC trickle charging to optimize cell life expectancy."
                    ) : (
                      "Significant battery degradation observed. Recommend cell health evaluation or balancing. Limit high-rate DC charging and keep State of Charge between 20% and 80%."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: BATTERY LIFETIME TIMELINE */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                4. Battery Lifetime Timeline
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Chronological summary of battery assessments logged for vehicle {result.vehicleId}
              </p>
              
              <div className="timeline-wrapper">
                {sortedHistory.map((item, idx) => {
                  const dateObj = new Date(item.createdAt || '');
                  const displayDate = dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' });
                  
                  let sohDiffText = '';
                  let capDiffText = '';
                  let cycleDiffText = '';
                  let milestone = '';

                  if (idx === 0) {
                    milestone = 'Baseline Registration Assessment';
                  } else {
                    const prev = sortedHistory[idx - 1];
                    const sohDiff = (item.soh ?? 0) - (prev.soh ?? 0);
                    const capDiff = Math.round((item.currentUsableCapacity - prev.currentUsableCapacity) * 100) / 100;
                    const cycleDiff = item.chargingCycles - prev.chargingCycles;

                    sohDiffText = sohDiff === 0 ? 'No SoH change' : `${sohDiff > 0 ? '+' : ''}${sohDiff}% SoH`;
                    capDiffText = capDiff === 0 ? 'No capacity change' : `${capDiff > 0 ? '+' : ''}${capDiff} kWh`;
                    cycleDiffText = cycleDiff > 0 ? `+${cycleDiff} cycles logged` : '';

                    if ((prev.soh ?? 0) >= 90 && (item.soh ?? 0) < 90) milestone = 'Milestone: Battery health fell below 90% (Moderate Wear)';
                    else if ((prev.soh ?? 0) >= 80 && (item.soh ?? 0) < 80) milestone = 'Milestone: Battery health fell below 80% (High Wear)';
                    else if (item.odometer > 100000 && prev.odometer <= 100000) milestone = 'Milestone: High Mileage Landmark (100,000 km)';
                    else milestone = `Follow-up Diagnostic assessment #${idx + 1}`;
                  }

                  const isCurrent = item.id === result.id;

                  return (
                    <div key={item.id || idx} className={`timeline-node ${isCurrent ? 'current' : ''}`}>
                      <div className="timeline-content-card" style={isCurrent ? { borderColor: 'var(--color-success)', background: 'var(--color-success-light)' } : {}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{displayDate} {isCurrent && <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', marginLeft: '0.5rem', fontWeight: 800 }}>(CURRENT)</span>}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Odometer: {item.odometer.toLocaleString()} km</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                            <span style={{ fontWeight: 700 }}>Health: {item.soh}% SoH</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Capacity: {item.currentUsableCapacity} kWh</span>
                            <span style={{ color: 'var(--text-secondary)' }}>Cycles: {item.chargingCycles}</span>
                          </div>
                          {idx > 0 && (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-secondary-hover)' }}>
                              {sohDiffText} | {capDiffText} {cycleDiffText ? `| ${cycleDiffText}` : ''}
                            </span>
                          )}
                        </div>
                        {milestone && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Info size={12} className="text-secondary" />
                            <span>{milestone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 5: DEGRADATION ANALYSIS */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                5. Battery Degradation Analysis
              </h3>
              <div className="passport-grid-2col">
                <div>
                  <div className="passport-info-row"><span className="passport-label">Original Capacity Baseline</span><span className="passport-value">{originalCapacity} kWh</span></div>
                  <div className="passport-info-row"><span className="passport-label">Current Usable Capacity</span><span className="passport-value">{currentCapacity} kWh</span></div>
                  <div className="passport-info-row"><span className="passport-label">Total Capacity Lost</span><span className="passport-value">{capacityLost} kWh</span></div>
                </div>
                <div>
                  <div className="passport-info-row"><span className="passport-label">Degradation Percentage</span><span className="passport-value">{degradationPercent}% Capacity Loss</span></div>
                  <div className="passport-info-row"><span className="passport-label">Annualized Degradation Rate</span><span className="passport-value">{degradationRate}% / Year</span></div>
                  <div className="passport-info-row"><span className="passport-label">Primary Stress Factors</span><span className="passport-value">{result.fastChargingPercentage > 40 ? 'DC Rate, ' : ''}Calendar, Thermal</span></div>
                </div>
              </div>
            </div>

            {/* SECTION 6: SAFETY ASSESSMENT */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                6. Battery Safety Audit
              </h3>
              <div className="passport-grid-2col" style={{ gap: '2rem' }}>
                <div>
                  <div className="passport-info-row">
                    <span className="passport-label">Temperature Exposure Risk</span>
                    <span className={`risk-pill risk-${tempRisk.toLowerCase()}`}>{tempRisk}</span>
                  </div>
                  <div className="passport-info-row">
                    <span className="passport-label">Charging Cycle Wearing Risk</span>
                    <span className={`risk-pill risk-${cycleRisk.toLowerCase()}`}>{cycleRisk}</span>
                  </div>
                  <div className="passport-info-row">
                    <span className="passport-label">SoC extreme Range stress</span>
                    <span className={`risk-pill risk-${socRisk.toLowerCase()}`}>{socRisk}</span>
                  </div>
                  <div className="passport-info-row">
                    <span className="passport-label">Overall Safety Evaluation</span>
                    <span className="passport-value" style={{ color: 'var(--color-success)', fontWeight: 800 }}>{safetyLevel} ({result.safetyScore ?? 92}/100)</span>
                  </div>
                </div>
                <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Safety recommendations</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                    {result.averageTemperature > 30 ? (
                      "Thermal stress warning: Avoid heavy loads or DC charging immediately after long drives in hot weather. Let packs cool down first."
                    ) : (
                      "Thermal ranges are optimal. Keep utilizing smart-charge preconditioning during winters or hot summers to minimize cold/heat wear stress."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 7: BATTERY USAGE PROFILE */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                7. Battery Operational & Usage Profile
              </h3>
              <div className="passport-grid-3col">
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Thermal Envelope</span>
                  <div className="passport-info-row"><span className="passport-label">Avg Temperature</span><span className="passport-value">{result.averageTemperature}°C</span></div>
                  <div className="passport-info-row"><span className="passport-label">Thermal Zone</span><span className="passport-value">{result.averageTemperature > 30 ? 'Elevated' : (result.averageTemperature < 10 ? 'Cold' : 'Optimal')}</span></div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Charging Characteristics</span>
                  <div className="passport-info-row"><span className="passport-label">Charging Pattern</span><span className="passport-value">{chargingPattern}</span></div>
                  <div className="passport-info-row"><span className="passport-label">Normal AC Charge</span><span className="passport-value">{result.normalChargingPercentage}%</span></div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Operational Distance</span>
                  <div className="passport-info-row"><span className="passport-label">Average Range</span><span className="passport-value">{result.averageRange} km</span></div>
                  <div className="passport-info-row"><span className="passport-label">Odometer Total</span><span className="passport-value">{result.odometer.toLocaleString()} km</span></div>
                </div>
              </div>
            </div>

            {/* SECTION 8: EXPLAINABLE AI */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                8. Explainable AI (XAI) Model Diagnostics
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                Indicative influence of inputs on the State of Health (SoH) assessment:
              </p>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  SOH Result: {result.soh}% ({passportState})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                      <span className="passport-label">• Usable Capacity wear</span>
                      <span style={{ fontWeight: 700, color: capacityImpact === 'HIGH IMPACT' ? 'var(--color-danger)' : (capacityImpact === 'MEDIUM IMPACT' ? 'var(--color-warning)' : 'var(--color-success)') }}>{capacityImpact}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                      <span className="passport-label">• Charging cycles wore</span>
                      <span style={{ fontWeight: 700, color: cyclesImpact === 'HIGH IMPACT' ? 'var(--color-danger)' : (cyclesImpact === 'MEDIUM IMPACT' ? 'var(--color-warning)' : 'var(--color-success)') }}>{cyclesImpact}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                      <span className="passport-label">• Operational Temperature</span>
                      <span style={{ fontWeight: 700, color: tempImpact === 'HIGH IMPACT' ? 'var(--color-danger)' : (tempImpact === 'MEDIUM IMPACT' ? 'var(--color-warning)' : 'var(--color-success)') }}>{tempImpact}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                      <span className="passport-label">• Current State of Charge</span>
                      <span style={{ fontWeight: 700, color: socImpact === 'HIGH IMPACT' ? 'var(--color-danger)' : (socImpact === 'MEDIUM IMPACT' ? 'var(--color-warning)' : 'var(--color-success)') }}>{socImpact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 9: BATTERY RISK SCORE */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                9. Battery Risk Score Card
              </h3>
              <div className="passport-grid-2col" style={{ alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 1rem' }}>
                  <div style={{ 
                    width: '76px', 
                    height: '76px', 
                    borderRadius: '50%', 
                    background: overallRisk === 'High' ? 'var(--color-danger-light)' : (overallRisk === 'Moderate' ? 'var(--color-warning-light)' : 'var(--color-success-light)'), 
                    border: `3px solid ${overallRisk === 'High' ? 'var(--color-danger)' : (overallRisk === 'Moderate' ? 'var(--color-warning)' : 'var(--color-success)')}`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>OVERALL</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: overallRisk === 'High' ? 'var(--color-danger)' : (overallRisk === 'Moderate' ? 'var(--color-warning)' : 'var(--color-success)'), marginTop: '-4px' }}>{overallRisk.toUpperCase()}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Integrated Safety Risk Index</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Risk levels calculated from usage profile, cycle count, and safety grades.</span>
                  </div>
                </div>
                <div>
                  <div className="passport-info-row">
                    <span className="passport-label">Safety Risk</span>
                    <span className={`risk-pill risk-${safetyRisk.toLowerCase()}`}>{safetyRisk}</span>
                  </div>
                  <div className="passport-info-row">
                    <span className="passport-label">Degradation Risk</span>
                    <span className={`risk-pill risk-${degradationRisk.toLowerCase()}`}>{degradationRisk}</span>
                  </div>
                  <div className="passport-info-row">
                    <span className="passport-label">Usage Profile Risk</span>
                    <span className={`risk-pill risk-${usageRisk.toLowerCase()}`}>{usageRisk}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 10: PREDICTED BATTERY LIFETIME */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                10. Predicted Battery Lifetime & Prognostics
              </h3>
              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-success)', background: 'var(--color-success-light)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Est. Remaining Useful Life (RUL)
                    </span>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success-hover)', display: 'block', marginTop: '0.2rem' }}>
                      ~{rul} Years
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
                      (Threshold: 70% SoH)
                    </span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      Estimated Lifetime Capacity Projection Trend
                    </span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 0.5rem 0' }}>
                      Under current operational patterns (Degradation rate ~{degradationRate}% / year), capacity is expected to degrade from {currentCapacity} kWh to approximately {Math.max(0, Math.round((originalCapacity * 0.7) * 100) / 100)} kWh in {rul} years.
                    </p>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(239, 68, 68, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                      Disclaimer: AI/model-based estimate, not a guaranteed lifespan.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Alliance Certificate Standard */}
            <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>This passport was dynamically compiled and signed on {creationDate}.</p>
              <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600 }}>Global Battery Alliance (GBA) Compliant Template — EV Battery Diagnostics System</p>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="scroll-layout-container">
      
      {/* Header (Dynamic scroll transition) */}
      <header className={`app-header ${isScrolled || view !== 'main' ? 'scrolled' : 'transparent'}`}>
        <div className="brand-info">
          <div className="brand-logo" id="header-logo">
            <img src="/logo.jpg" alt="Team EcoCare Logo" className="brand-logo-img" />
          </div>
          <div className="brand-text-container">
            <h1 className="brand-project-name">Team EcoCare</h1>
            <div className="brand-tagline">From Battery Health to a Smarter Second Life</div>
          </div>
        </div>

        {/* Top-Right Navigation */}
        <nav className="top-nav">
          {view === 'main' || view === 'secondlife' ? (
            <>
              <button 
                className={`nav-link ${view === 'main' && activeSection === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setView('main');
                  scrollToSection('home-section');
                }}
              >
                Home
              </button>
              <button 
                className={`nav-link ${view === 'main' && activeSection === 'features' ? 'active' : ''}`}
                onClick={() => {
                  setView('main');
                  scrollToSection('features-section');
                }}
              >
                Features
              </button>
              <button 
                className={`nav-link ${view === 'secondlife' ? 'active' : ''}`}
                onClick={() => {
                  setView('secondlife');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Second Life
              </button>
              {isLoggedIn && authType === 'company' && (
                <button 
                  className="nav-link"
                  onClick={() => {
                    setView('company');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Company Dashboard
                </button>
              )}
              <button 
                className="nav-link"
                onClick={() => setIsLoginOpen(true)}
              >
                {isLoggedIn ? `Account (${user?.name})` : 'Login'}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              {view === 'company' && (
                <button className="nav-link" onClick={() => {
                  setView('main');
                  scrollToSection('home-section');
                }}>
                  Customer Portal
                </button>
              )}
              {(view === 'passport' || view === 'report') && (
                <button className="nav-link" onClick={() => {
                  setView('main');
                  scrollToSection('home-section');
                }}>
                  Back to Dashboard
                </button>
              )}
              {view === 'company' && (
                <button className="nav-link" onClick={() => setIsLoginOpen(true)}>
                  Account ({user?.name})
                </button>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* Loading Overlay */}
      {loading && (
        <div className="loader-overlay" id="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {/* Administrative Login Modal Overlay */}
      {isLoginOpen && (
        <div className="modal-backdrop">
          <div className="card login-card modal-content" style={{ animation: 'fade-in 0.3s ease-out' }}>
            <button className="modal-close" onClick={() => setIsLoginOpen(false)}>
              <X size={20} />
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Diagnostics Terminal</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Access administrative configurations and telemetry controls.
              </p>
            </div>

            {error && (
              <div style={{
                background: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: 'var(--color-success-light)',
                color: 'var(--color-success-hover)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}

            {isLoggedIn ? (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <CheckCircle size={44} className="text-success" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{authType === 'admin' ? 'Administrator' : user?.name} Authenticated</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                  Secure session active. User database access authorized.
                </p>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    localStorage.removeItem('ev_diagnostics_user');
                    localStorage.removeItem('ev_diagnostics_authtype');
                    setUser(null);
                    setAuthType(null);
                    setIsLoggedIn(false);
                    setLoginEmail('');
                    setLoginPassword('');
                    setMyVehicles([]);
                    resetVehicleRegistration();
                  }}
                  style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
                >
                  Log Out
                </button>
              </div>
            ) : authMode === 'login' ? (
              <>
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="loginEmail">Terminal Username / Gmail</label>
                    <input
                      id="loginEmail"
                      type="text"
                      placeholder="e.g. admin or gmail"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="loginPassword">Password</label>
                    <input
                      id="loginPassword"
                      type="password"
                      placeholder="e.g. admin"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                    Authenticate
                    <Zap size={16} />
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>New user? </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Register
                  </button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label htmlFor="registerName">Name</label>
                    <input
                      id="registerName"
                      type="text"
                      placeholder="Your Full Name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="registerPhone">Phone Number</label>
                    <input
                      id="registerPhone"
                      type="tel"
                      placeholder="e.g. +91 99999 99999"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="registerEmail">Gmail Address</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        id="registerEmail"
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        style={{ flexGrow: 1 }}
                        disabled={otpSent}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleSendOtp}
                        disabled={loading || otpCooldown > 0}
                        style={{ padding: '0 0.75rem', fontSize: '0.78rem', height: '38px', whiteSpace: 'nowrap' }}
                      >
                        {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {otpSent && (
                    <div className="form-group" style={{ animation: 'fade-in 0.3s ease-out' }}>
                      <label htmlFor="registerOtp" style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Enter 6-Digit OTP</label>
                      <input
                        id="registerOtp"
                        type="text"
                        maxLength={6}
                        placeholder="Enter the code sent to your email"
                        value={registerOtp}
                        onChange={(e) => setRegisterOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        style={{ borderColor: 'var(--color-secondary)' }}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="registerPassword">Password</label>
                    <input
                      id="registerPassword"
                      type="password"
                      placeholder="Min 6 characters"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="registerConfirmPassword">Reconfirm Password</label>
                    <input
                      id="registerConfirmPassword"
                      type="password"
                      placeholder="Retype password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="registerRole">Account Type</label>
                    <select
                      id="registerRole"
                      value={registerRole}
                      onChange={(e) => setRegisterRole(e.target.value as 'ROLE_USER' | 'ROLE_COMPANY')}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: 'var(--border-radius-md)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: '#fff',
                        fontSize: '0.9rem',
                        fontFamily: 'Outfit, sans-serif'
                      }}
                    >
                      <option value="ROLE_USER">Customer (Owner)</option>
                      <option value="ROLE_COMPANY">EV Manufacturer (Company)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={!otpSent}>
                    Verify & Register
                    <Zap size={16} />
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'main' ? (
        <>
          {/* SECTION 1: HOME (Hero Video) */}
      <section id="home-section" className="scroll-section-block home-section-video">
        <div className="video-background-container">
          <video autoPlay muted loop playsInline className="hero-video">
            <source src="/BINEET_VIDEO.mp4" type="video/mp4" />
            <source src="/ev_charging.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="video-overlay"></div>
        </div>



        {/* Floating Scroll Indicator */}
        <button className="scroll-down-indicator" onClick={() => scrollToSection('about-website-section')}>
          <ChevronDown size={32} />
        </button>
      </section>

      {/* SECTION 1B: ABOUT WEBSITE */}
      <section id="about-website-section" className="scroll-section-block" style={{ 
        padding: '5rem 2.5rem', 
        background: 'linear-gradient(135deg, #f2f9f6 0%, #e6f4ee 100%)', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="card about-platform-card" style={{ 
          maxWidth: '1100px', 
          padding: '3rem', 
          background: '#ffffff', 
          border: '1px solid rgba(14, 90, 68, 0.15)', 
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(14, 90, 68, 0.05)'
        }}>
          
          {/* Left Side: Content */}
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '1.5rem'
          }}>
            {/* Subtle tech badge */}
            <div style={{ 
              background: '#0e5a44', 
              border: 'none', 
              padding: '0.45rem 1.25rem', 
              borderRadius: '50px', 
              fontSize: '0.78rem', 
              fontWeight: 800, 
              color: '#ffffff', 
              textTransform: 'uppercase', 
              letterSpacing: '2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚡ NEXT-GEN EV INTELLIGENCE</span>
            </div>

            <h2 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 900, 
              margin: 0, 
              fontFamily: 'Outfit, sans-serif', 
              color: '#073b2e',
              letterSpacing: '-0.5px'
            }}>
              About the Platform
            </h2>

            <p style={{ 
              color: '#2e4e46', 
              lineHeight: '1.75', 
              fontSize: '1.02rem', 
              margin: 0,
              fontWeight: 450,
              textAlign: 'left'
            }}>
              <strong style={{ color: '#073b2e' }}>EV-Battery360</strong> is a comprehensive, advanced state-of-health analysis and diagnostics platform designed for modern electric vehicles. By leveraging <span style={{ color: '#0f9f74', fontWeight: 700 }}>real-time telemetry inputs</span>—including usable capacity wear, cycle counts, operating temperature profiles, and calendar age—our system delivers <span style={{ color: '#0f9f74', fontWeight: 700 }}>precise degradation modeling</span> and safety audits to optimize battery life and support stationary second-life reuse applications.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', width: '100%', marginTop: '1rem', borderTop: '1px solid rgba(14, 90, 68, 0.12)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0e5a44' }}>99.8%</span>
                <span style={{ fontSize: '0.72rem', color: '#2e4e46', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Analysis Accuracy</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0e5a44' }}>&lt; 5 Sec</span>
                <span style={{ fontSize: '0.72rem', color: '#2e4e46', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Diagnostic Speed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0e5a44' }}>100%</span>
                <span style={{ fontSize: '0.72rem', color: '#2e4e46', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Data Privacy</span>
              </div>
            </div>

          </div>

          {/* Right Side: Tata Harrier EV SUV */}
          <div style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '380px', 
            borderRadius: '12px', 
            overflow: 'hidden',
            border: '1px solid rgba(14, 90, 68, 0.08)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/harrier_ev.jpg" 
              alt="Tata Harrier EV Crossover" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                maxHeight: '100%',
                objectFit: 'contain', 
                display: 'block' 
              }} 
            />
          </div>

        </div>
      </section>

      {/* SECTION 2: FEATURES (Parameters Entry Form & Illustration) */}
      <section id="features-section" className="scroll-section-block features-entry-block">
        <div className="features-page-grid">
          
          {/* Form Side */}
          <div className="card form-column-container" aria-labelledby="form-title">
            <h2 className="card-title" id="form-title">
              <Activity size={20} className="text-secondary" />
              Vehicle & Battery Parameters
            </h2>

            {/* Already Registered Vehicle check or My Vehicles list */}
            {isLoggedIn && authType === 'user' ? (
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.9rem'
              }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BatteryCharging size={16} className="text-secondary" />
                  My Vehicles ({myVehicles.length})
                </h3>
                
                {myVehicles.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>No vehicles registered yet. Submit your first analysis to register a vehicle.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.25rem', marginBottom: '0.75rem' }}>
                    {myVehicles.map((v) => (
                      <div 
                        key={v.vehicleId}
                        onClick={async () => {
                          setSelectedVehicleId(v.vehicleId);
                          setSearchVehicleId(v.vehicleId);
                          setLoading(true);
                          try {
                            const headers: HeadersInit = {};
                            headers['X-User-Email'] = user?.gmail || '';
                            const response = await fetch(`${API_BASE_URL}/vehicle/${v.vehicleId}`, { headers });
                            if (response.ok) {
                              const data = await response.json();
                              const { vehicle, history: assessments } = data;
                              setFormData(prev => ({
                                ...prev,
                                manufacturer: vehicle.manufacturer || '',
                                model: vehicle.model || '',
                                originalCapacity: assessments.length > 0 ? assessments[0].originalCapacity : prev.originalCapacity
                              }));
                              setVehicleType(vehicle.vehicleType || 'car');
                              setVehicleHistory(assessments);
                              if (assessments && assessments.length > 0) {
                                const latest = assessments[assessments.length - 1];
                                setLastAssessment(latest);
                                setFormData(prev => ({
                                  ...prev,
                                  manufacturer: vehicle.manufacturer || '',
                                  model: vehicle.model || '',
                                  batteryAge: latest.batteryAge,
                                  odometer: latest.odometer,
                                  originalCapacity: latest.originalCapacity,
                                  currentUsableCapacity: latest.currentUsableCapacity,
                                  currentBatteryPercentage: latest.currentBatteryPercentage,
                                  chargingCycles: latest.chargingCycles,
                                  averageTemperature: latest.averageTemperature,
                                  averageRange: latest.averageRange,
                                  normalChargingPercentage: latest.normalChargingPercentage,
                                  fastChargingPercentage: latest.fastChargingPercentage
                                }));
                              }
                            }
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          background: selectedVehicleId === v.vehicleId ? 'var(--color-secondary-light)' : 'rgba(255,255,255,0.02)',
                          border: selectedVehicleId === v.vehicleId ? '1px solid var(--color-secondary)' : '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '0.6rem 0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: selectedVehicleId === v.vehicleId ? 'var(--color-secondary)' : 'var(--text-primary)' }}>{v.vehicleId}</span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: v.lastStatus?.toLowerCase() === 'excellent' || v.lastStatus?.toLowerCase() === 'good' ? 'rgba(14, 131, 96, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                            color: v.lastStatus?.toLowerCase() === 'excellent' || v.lastStatus?.toLowerCase() === 'good' ? '#0E8360' : '#DC2626'
                          }}>{v.lastStatus?.toUpperCase() || 'UNKNOWN'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <span>{v.manufacturer} {v.model}</span>
                          <span style={{ fontWeight: 600 }}>Score: {v.lastScore}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          <span>Last Checked: {new Date(v.lastChecked).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>Assessments: {v.assessmentsCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedVehicleId ? (
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={resetVehicleRegistration}
                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.25rem 0.75rem', height: '30px', fontSize: '0.78rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', background: 'var(--color-danger-light)', justifyContent: 'center' }}
                  >
                    Deselect / Register New Vehicle
                  </button>
                ) : (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    <div 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} 
                      onClick={() => setIsReturningToggle(!isReturningToggle)}
                    >
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <Search size={14} className="text-secondary" />
                        Link Existing Vehicle?
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {isReturningToggle ? 'Collapse' : 'Expand'}
                      </span>
                    </div>
                    
                    {isReturningToggle && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Enter Vehicle Number (e.g. JH-05-AB-1234)"
                            value={searchVehicleId}
                            onChange={(e) => setSearchVehicleId(e.target.value.toUpperCase())}
                            style={{ flexGrow: 1, textTransform: 'uppercase', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'Outfit', fontSize: '0.85rem' }}
                          />
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={handleCheckVehicleId}
                            style={{ padding: '0 1rem', height: '34px', fontSize: '0.82rem' }}
                          >
                            Check
                          </button>
                        </div>
                        {vehicleCheckStatus && (
                          <div style={{ fontSize: '0.78rem', color: vehicleCheckStatus.success ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                            {vehicleCheckStatus.success ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                            <span>{vehicleCheckStatus.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '1rem',
                marginBottom: '1.25rem',
                fontSize: '0.9rem'
              }}>
                {!selectedVehicleId ? (
                  <>
                    <div 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} 
                      onClick={() => setIsReturningToggle(!isReturningToggle)}
                    >
                      <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={16} className="text-secondary" />
                        Already Registered Vehicle?
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {isReturningToggle ? 'Collapse' : 'Expand'}
                      </span>
                    </div>
                    
                    {isReturningToggle && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Enter Vehicle ID (e.g. EV-2026-8F42K7)"
                            value={searchVehicleId}
                            onChange={(e) => setSearchVehicleId(e.target.value.toUpperCase())}
                            style={{ flexGrow: 1, textTransform: 'uppercase', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'Outfit' }}
                          />
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={handleCheckVehicleId}
                            style={{ padding: '0 1.25rem', height: '38px', fontSize: '0.88rem' }}
                          >
                            Check
                          </button>
                        </div>
                        {vehicleCheckStatus && (
                          <div style={{ fontSize: '0.82rem', color: vehicleCheckStatus.success ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                            {vehicleCheckStatus.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                            <span>{vehicleCheckStatus.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                        Recognized Returning Vehicle
                      </span>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {selectedVehicleId}
                      </span>
                      {lastAssessment && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          Last check: {lastAssessment.soh}% SoH ({lastAssessment.condition === 'Degraded' ? 'POOR' : lastAssessment.condition?.toUpperCase()})
                        </span>
                      )}
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={resetVehicleRegistration}
                      style={{ padding: '0.25rem 0.75rem', height: '30px', fontSize: '0.78rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', background: 'var(--color-danger-light)' }}
                    >
                      Reset / Register New
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{
                background: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }} id="error-alert">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: 'var(--color-success-light)',
                color: 'var(--color-success-hover)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }} id="success-alert">
                <CheckCircle size={18} />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} id="battery-input-form">
              <div className="form-grid">
                
                <div className="form-group">
                  <label htmlFor="inputVehicleId">Vehicle Number (Unique ID)</label>
                  <input
                    id="inputVehicleId"
                    type="text"
                    placeholder="Enter Vehicle Number (e.g. JH-05-AB-1234)"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value.toUpperCase())}
                    disabled={vehicleHistory.length > 0}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vehicleType">Vehicle Type</label>
                  <select
                    id="vehicleType"
                    name="vehicleType"
                    value={vehicleType}
                    onChange={(e) => {
                      const type = e.target.value as 'scooty' | 'bike' | 'car' | 'bus';
                      setVehicleType(type);
                    }}
                    className="form-select"
                  >
                    <option value="scooty">Scooty</option>
                    <option value="bike">Bike</option>
                    <option value="car">Car</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="manufacturer">Manufacturer</label>
                  <input
                    id="manufacturer"
                    name="manufacturer"
                    type="text"
                    placeholder="e.g. Tesla, Ather, BYD"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="model">Model</label>
                  <input
                    id="model"
                    name="model"
                    type="text"
                    placeholder="e.g. Model Y, 450X"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="batteryAge">Battery Age (years)</label>
                  <input
                    id="batteryAge"
                    name="batteryAge"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    value={formData.batteryAge || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="odometer">Odometer (km)</label>
                  <input
                    id="odometer"
                    name="odometer"
                    type="number"
                    placeholder="e.g. 64000"
                    value={formData.odometer || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="originalCapacity">Original Capacity (kWh)</label>
                  <input
                    id="originalCapacity"
                    name="originalCapacity"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 75"
                    value={formData.originalCapacity || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currentUsableCapacity">Current Usable Capacity (kWh)</label>
                  <input
                    id="currentUsableCapacity"
                    name="currentUsableCapacity"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 68.5"
                    value={formData.currentUsableCapacity || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="currentBatteryPercentage">Current SoC (%)</label>
                  <input
                    id="currentBatteryPercentage"
                    name="currentBatteryPercentage"
                    type="number"
                    placeholder="e.g. 80"
                    value={formData.currentBatteryPercentage || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="chargingCycles">Charging Cycles</label>
                  <input
                    id="chargingCycles"
                    name="chargingCycles"
                    type="number"
                    placeholder="e.g. 420"
                    value={formData.chargingCycles || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="averageTemperature">Average Temperature (°C)</label>
                  <input
                    id="averageTemperature"
                    name="averageTemperature"
                    type="number"
                    placeholder="e.g. 21"
                    value={formData.averageTemperature || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="averageRange">Average Range (km)</label>
                  <input
                    id="averageRange"
                    name="averageRange"
                    type="number"
                    placeholder="e.g. 450"
                    value={formData.averageRange || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="normalChargingPercentage">Normal Charging AC (%)</label>
                  <input
                    id="normalChargingPercentage"
                    name="normalChargingPercentage"
                    type="number"
                    placeholder="e.g. 80"
                    value={formData.normalChargingPercentage || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fastChargingPercentage">Fast Charging DC (%)</label>
                  <input
                    id="fastChargingPercentage"
                    name="fastChargingPercentage"
                    type="number"
                    placeholder="e.g. 20"
                    value={formData.fastChargingPercentage || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>

              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={loadDemoData}
                  disabled={loading}
                  id="btn-load-demo"
                >
                  Load Demo Data
                </button>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                  id="btn-analyze"
                >
                  {loading ? 'Processing...' : 'Enter / Continue'}
                  <Zap size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Vehicle Illustration */}
          <div className="illustration-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ flexGrow: 0 }}>
              <h3 className="illustration-title">EV Layout & Power Unit</h3>
              <div className="illustration-transition-container">
                <div key={vehicleType} className="illustration-svg-wrapper">
                  {renderVehicleIllustration(vehicleType, liveSoh)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: getSohColor(liveSoh) }}></div>
                  <span>Battery pack ({liveSoh.toFixed(0)}% SOH)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#1e293b' }}></div>
                  <span>Drive Unit</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Assessment Section DIRECTLY BELOW */}
            {result && (
              <div className="card" id="diagnostics-panel" style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', animation: 'fade-in 0.4s ease-out' }}>
                <div className="assessment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Diagnostic Assessment</h3>
                  <span className={`badge badge-${result.condition?.toLowerCase()}`} id="badge-condition">
                    {result.condition}
                  </span>
                </div>
                <div className="explanation-text" id="value-explanation" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {result.explanation}
                </div>
              </div>
            )}
          </div>

        </div>
      </section>
          {/* SECTION 3: ESTIMATED HEALTH & TIPS (SOH Gauge + tips below form) */}
          <section id="analysis-section" className="scroll-section-block analysis-results-block" style={{ borderBottom: 'none', padding: '4rem 2.5rem' }}>
            {!result ? (
              <div className="card empty-diagnostic-state" style={{ minHeight: '30vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
                <HelpCircle size={48} className="text-muted" style={{ animation: 'pulse-dot 2.5s infinite' }} />
                <h2 style={{ fontSize: '1.25rem' }}>Diagnostic Output Pending</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', textAlign: 'center', lineHeight: '1.6', fontSize: '0.9rem' }}>
                  Please enter your EV telemetry and battery parameters in Section 2 and click **Enter / Continue** to view the battery health gauge here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', animation: 'fade-in 0.6s ease-out' }}>
                
                {/* PAGE 2 — Estimated Battery Health */}
                <div className="card health-hero-card" id="health-hero-container" style={{ maxWidth: '500px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
                    Estimated Battery Health
                  </h3>
                  
                  <div className="gauge-container" style={{ marginBottom: '1.5rem' }}>
                    <svg className="gauge-svg">
                      <circle className="gauge-bg" cx="100" cy="100" r={radius}></circle>
                      <circle 
                        className="gauge-fill" 
                        cx="100" 
                        cy="100" 
                        r={radius}
                        strokeDasharray={circ}
                        strokeDashoffset={strokeDashoffset}
                        style={{ stroke: getSohColor(sohVal) }}
                      ></circle>
                    </svg>
                    <div className="gauge-center-text">
                      <span className="gauge-percentage" id="value-soh">{result.soh}%</span>
                      <span className="gauge-label">SoH</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', lineHeight: '1.4' }}>
                    <Info size={14} className="text-primary" />
                    <span>Estimated health model based on pack capacities</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        setView('passport');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{ width: '100%', justifyContent: 'center', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <FileText size={18} />
                      Generate Digital Battery Passport
                    </button>

                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setView('report');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <TrendingUp size={18} />
                      View Detailed Data Charts
                    </button>
                  </div>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem', fontStyle: 'italic', textAlign: 'center', lineHeight: '1.4' }}>
                    Note: This is an estimated battery state of health calculation and not an official/certified battery test.
                  </p>
                </div>
              </div>
            )}
          </section>

                    {/* SECTION 3D: SMART VEHICLES (Groups Charging Stations and Recommendations Side-by-Side) */}
          <section id="smart-vehicles-section" className="scroll-section-block" style={{ padding: '4rem 2.5rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
              
              {/* CARD 1: FIND NEAREST CHARGING STATION */}
              <div className="card shadow-card-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '8px' }}>
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>Find Nearest Charging Station</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Locate compatible EV charging hubs near you.</span>
                  </div>
                </div>

                <div className="charging-control-panel" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
                  <div className="charging-input-row" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="charging-input-group" style={{ width: '100%' }}>
                      <label htmlFor="citySelect" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>SELECT CITY</label>
                      <select
                        id="citySelect"
                        className="form-select"
                        value={selectedCityName}
                        onChange={(e) => {
                          const cityName = e.target.value;
                          setSelectedCityName(cityName);
                          const city = CITIES.find(c => c.name === cityName);
                          if (city) {
                            setUserLat(city.lat);
                            setUserLng(city.lng);
                          } else {
                            setUserLat('');
                            setUserLng('');
                          }
                        }}
                      >
                        <option value="">-- Choose a City --</option>
                        {locationAccessGranted && (
                          <option value="GPS Location">📍 My Location (GPS)</option>
                        )}
                        {CITIES.map(city => (
                          <option key={city.name} value={city.name}>{city.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="charging-input-group" style={{ width: '100%' }}>
                      <label htmlFor="searchRadius" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>SEARCH RADIUS (KM)</label>
                      <select
                        id="searchRadius"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                      >
                        <option value={5}>5 km</option>
                        <option value={10}>10 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                        <option value={100}>100 km</option>
                      </select>
                    </div>
                  </div>

                  {userLat !== '' && userLng !== '' && (
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-color)', width: 'fit-content', marginTop: '1rem' }}>
                      <div>🛰️ <strong>Lat:</strong> {userLat}</div>
                      <div>🛰️ <strong>Lng:</strong> {userLng}</div>
                    </div>
                  )}

                  {gpsError && (
                    <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                      ⚠️ {gpsError}
                    </div>
                  )}

                  <div className="charging-btn-group" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleUseCurrentLocation}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                    >
                      <MapPin size={16} />
                      Use My Current Location
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleFindNearestCharging}
                      disabled={userLat === '' || userLng === '' || chargingSearchLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', opacity: (userLat === '' || userLng === '') ? 0.6 : 1 }}
                    >
                      {chargingSearchLoading ? 'Searching...' : 'Find Nearest Charging'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                {chargingSearchError && (
                  <div style={{
                    background: 'var(--color-danger-light)',
                    color: 'var(--color-danger)',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem'
                  }}>
                    <AlertTriangle size={18} />
                    {chargingSearchError}
                  </div>
                )}
              </div>

              {/* CARD 2: EV COMPARISON & RECOMMENDATION */}
              <div className="card shadow-card-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '8px' }}>
                    <BatteryCharging size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>EV Comparison & Recommendation</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Find your ideal electric vehicle or compare models side-by-side.</span>
                  </div>
                </div>

                {/* Sub-form 1: Find the Best EV for You */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
                    🔍 Find the Best EV for You
                  </h3>
                  
                  <form onSubmit={handleFindMyBestEv} className="charging-control-panel" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="charging-input-group">
                          <label htmlFor="recBudget" style={{ fontSize: '0.72rem', fontWeight: 700 }}>YOUR BUDGET (₹)</label>
                          <input
                            id="recBudget"
                            type="number"
                            placeholder="e.g. 1500000"
                            value={recBudget}
                            onChange={(e) => setRecBudget(e.target.value === '' ? '' : Number(e.target.value))}
                            required
                          />
                        </div>

                        <div className="charging-input-group">
                          <label htmlFor="recCity" style={{ fontSize: '0.72rem', fontWeight: 700 }}>CITY</label>
                          <select
                            id="recCity"
                            value={recCity}
                            onChange={(e) => setRecCity(e.target.value)}
                            required
                          >
                            <option value="Jamshedpur">Jamshedpur</option>
                            <option value="Bhubaneswar">Bhubaneswar</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Bengaluru">Bengaluru</option>
                            <option value="Pune">Pune</option>
                            <option value="Hyderabad">Hyderabad</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="charging-input-group">
                          <label htmlFor="recType" style={{ fontSize: '0.72rem', fontWeight: 700 }}>VEHICLE TYPE</label>
                          <select
                            id="recType"
                            value={recType}
                            onChange={(e) => setRecType(e.target.value)}
                            required
                          >
                            <option value="ELECTRIC_CAR">Electric Car 🚗</option>
                            <option value="ELECTRIC_BIKE">Electric Bike 🏍️</option>
                            <option value="ELECTRIC_SCOOTER">Electric Scooter 🛵</option>
                            <option value="ANY">Any</option>
                          </select>
                        </div>

                        <div className="charging-input-group">
                          <label htmlFor="recPriority" style={{ fontSize: '0.72rem', fontWeight: 700 }}>PRIMARY PRIORITY</label>
                          <select
                            id="recPriority"
                            value={recPriority}
                            onChange={(e) => setRecPriority(e.target.value)}
                          >
                            <option value="Price">Lowest Price / Best Fit</option>
                            <option value="Range">Longest Driving Range</option>
                            <option value="Charging">Fastest Charging Speed</option>
                            <option value="Reviews">Highest Customer Rating</option>
                          </select>
                        </div>
                      </div>

                      <div className="charging-input-group">
                        <label htmlFor="recMinRange" style={{ fontSize: '0.72rem', fontWeight: 700 }}>MIN RANGE (KM - OPTIONAL)</label>
                        <input
                          id="recMinRange"
                          type="number"
                          placeholder="e.g. 150"
                          value={recMinRange}
                          onChange={(e) => setRecMinRange(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {recSearchError && (
                      <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                        ⚠️ {recSearchError}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ fontSize: '0.88rem' }} disabled={recSearchLoading}>
                        {recSearchLoading ? 'Analyzing...' : 'Find My Best EV'}
                      </button>
                    </div>
                  </form>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
                    ⚖️ Compare Two EVs
                  </h3>
                  
                  <form onSubmit={handleCompareEvs} className="charging-control-panel" style={{ background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="charging-input-group">
                        <label htmlFor="compEv1" style={{ fontSize: '0.72rem', fontWeight: 700 }}>FIRST EV</label>
                        <select
                          id="compEv1"
                          value={compEv1}
                          onChange={(e) => setCompEv1(e.target.value)}
                          required
                        >
                          <option value="">-- Select EV 1 --</option>
                          {allEvsList.map(item => (
                            <option key={item.id} value={item.id}>{item.company} - {item.model} ({item.vehicleType.replace('ELECTRIC_', '').toLowerCase()})</option>
                          ))}
                        </select>
                      </div>

                      <div className="charging-input-group">
                        <label htmlFor="compEv2" style={{ fontSize: '0.72rem', fontWeight: 700 }}>SECOND EV</label>
                        <select
                          id="compEv2"
                          value={compEv2}
                          onChange={(e) => setCompEv2(e.target.value)}
                          required
                        >
                          <option value="">-- Select EV 2 --</option>
                          {allEvsList.map(item => (
                            <option key={item.id} value={item.id}>{item.company} - {item.model} ({item.vehicleType.replace('ELECTRIC_', '').toLowerCase()})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {compSearchError && (
                      <div style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                        ⚠️ {compSearchError}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" style={{ fontSize: '0.88rem' }} disabled={compSearchLoading}>
                        {compSearchLoading ? 'Comparing...' : 'Compare EVs'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* RESULTS BLOCKS */}
            
            {/* 1. Nearest Charging Results */}
            {(nearbyStations.length > 0 || locationAccessGranted !== null) && (
              <div className="charging-results-layout" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', marginTop: '2rem', paddingBottom: '2.5rem' }}>
                {/* Left Column: Interactive Map */}
                <div className="map-container-wrapper">
                  <div id="charging-map" className="charging-map-element"></div>
                  {nearbyStations.length === 0 && !chargingSearchLoading && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 100,
                      pointerEvents: 'none'
                    }}>
                      <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-card)',
                        textAlign: 'center',
                        maxWidth: '300px'
                      }}>
                        <HelpCircle size={32} className="text-muted" style={{ margin: '0 auto 0.75rem' }} />
                        <h4 style={{ margin: '0 0 0.25rem' }}>No Stations Found</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          No compatible charging stations found within {searchRadius}km of your location. Try a larger radius.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Station list */}
                <div className="stations-sidebar">
                  {nearbyStations.length === 0 ? (
                    <div style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '2rem 1.5rem',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem'
                    }}>
                      No nearby charging stations found. Please execute a search using the controls above.
                    </div>
                  ) : (
                    nearbyStations.map((station) => {
                      const isSelected = selectedStation?.id === station.id;
                      const statusClass = station.status === 'Available' ? 'status-avail' : (station.status === 'Busy' ? 'status-busy' : 'status-offline');
                      return (
                        <div
                          key={station.id}
                          className={`station-item-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedStation(station);
                            if (mapRef.current) {
                              mapRef.current.setView([station.latitude, station.longitude], 14);
                              // Find and open popup for this station
                              mapRef.current.eachLayer((layer: any) => {
                                if (layer instanceof L.Marker && layer.getLatLng) {
                                  const latLng = layer.getLatLng();
                                  if (Math.abs(latLng.lat - station.latitude) < 0.0001 && Math.abs(latLng.lng - station.longitude) < 0.0001) {
                                    layer.openPopup();
                                  }
                                }
                              });
                            }
                          }}
                        >
                          <div className="station-header">
                            <h3 className="station-title">{station.name}</h3>
                            <span className="station-distance-badge">{station.distanceKm} km</span>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                            <div className="station-info-row">
                              <span>Connector Type:</span>
                              <strong>{station.chargerType || 'Standard Charger'}</strong>
                            </div>
                            <div className="station-info-row">
                              <span>Charging Power:</span>
                              <strong>{station.powerKw ? `${station.powerKw} kW` : 'N/A'}</strong>
                            </div>
                            <div className="station-info-row">
                              <span>Ports Available:</span>
                              <strong>{station.availablePorts} / {station.totalPorts}</strong>
                            </div>
                            <div className="station-info-row" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              📍 {station.address}
                            </div>
                          </div>

                          <div className="station-status-row">
                            <span className={`station-status-badge ${statusClass}`}>{station.status}</span>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}
                            >
                              Directions
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 2. EV Recommendation Results */}
            {recommendedEvs.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', marginTop: '2rem', paddingBottom: '2.5rem' }} className="fade-in">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                  ⭐ Your Top 3 EV Matches
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  We compared the available EV models based on budget, variant features, charging speed, local service networks in {recCity}, and safety.
                </p>

                <div className="ev-rec-grid">
                  {recommendedEvs.map((resultItem, idx) => {
                    const { ev, overallMatchScore, scoreBudget, scoreRange, scoreService, scoreReviews, scoreCharging, scoreValue, explanation, thingsToConsider, localDealers, localServiceCentersCount } = resultItem;
                    return (
                      <div key={ev.id} className="ev-rec-card">
                        <div className="ev-rec-header">
                          <div>
                            <span className="ev-rec-badge-rank">#{idx + 1} Best Match</span>
                            <h4 style={{ margin: '0.25rem 0 0', fontSize: '1.2rem', fontWeight: 800 }}>{ev.company} {ev.model}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ev.bodyType}</span>
                          </div>
                          <div className="ev-rec-match-score">
                            <span>{overallMatchScore}%</span>
                            <span style={{ fontSize: '0.65rem' }}>Match</span>
                          </div>
                        </div>

                        <div className="ev-rec-image-container">
                          <img src={ev.imageUrl} alt={ev.model} className="ev-rec-image" />
                          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ⭐ {ev.userRating} ({ev.reviewsCount} reviews)
                          </div>
                        </div>

                        <div className="ev-rec-price-row">
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ex-Showroom Price:</span>
                          <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                            ₹{ev.minPrice >= 100000 ? `${(ev.minPrice / 100000).toFixed(2)}L` : `${(ev.minPrice / 1000).toFixed(0)}k`} 
                            {ev.minPrice !== ev.maxPrice && ` - ₹${ev.maxPrice >= 100000 ? `${(ev.maxPrice / 100000).toFixed(2)}L` : `${(ev.maxPrice / 1000).toFixed(0)}k`}`}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '-0.75rem' }}>
                          <span>Type: {ev.vehicleType.replace('ELECTRIC_', '').toLowerCase()}</span>
                          <span>Warranty: {ev.warrantyYears} Years</span>
                        </div>

                        <div className="ev-rec-spec-list">
                          <div className="ev-rec-spec-item">
                            <span>Driving Range</span>
                            <strong>{ev.rangeKm} km</strong>
                          </div>
                          <div className="ev-rec-spec-item">
                            <span>Battery Capacity</span>
                            <strong>{ev.batteryCapacityKwh} kWh</strong>
                          </div>
                          <div className="ev-rec-spec-item">
                            <span>Fast Charging</span>
                            <strong>{ev.fastCharging || 'No'}</strong>
                          </div>
                          <div className="ev-rec-spec-item">
                            <span>Top Speed</span>
                            <strong>{ev.topSpeedKmh ? `${ev.topSpeedKmh} km/h` : 'N/A'}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.15rem' }}>Match Score Breakdown</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Budget Fit:</span>
                            <strong>{scoreBudget}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Range Suitability:</span>
                            <strong>{scoreRange}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Service Availability:</span>
                            <strong>{scoreService}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>User Rating:</span>
                            <strong>{scoreReviews}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Charging Suitability:</span>
                            <strong>{scoreCharging}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Overall Value:</span>
                            <strong>{scoreValue}%</strong>
                          </div>
                        </div>

                        {/* Why this EV & Things to consider */}
                        <div style={{ fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>Why this EV?</span>
                          <ul style={{ margin: 0, paddingLeft: '1.15rem', color: 'var(--color-success)' }}>
                            {explanation.map((exp: string, i: number) => (
                              <li key={i} style={{ marginBottom: '0.25rem' }}>{exp}</li>
                            ))}
                          </ul>
                        </div>

                        {thingsToConsider && thingsToConsider.length > 0 && (
                          <div style={{ fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>Things to consider</span>
                            <ul style={{ margin: 0, paddingLeft: '1.15rem', color: 'var(--color-warning)' }}>
                              {thingsToConsider.map((con: string, i: number) => (
                                <li key={i} style={{ marginBottom: '0.25rem' }}>{con}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <span>🔧 Local Service Centers:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{localServiceCentersCount} center(s)</strong>
                        </div>

                        {/* Local Dealers */}
                        <div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
                            onClick={() => setSelectedRecIndexForDealers(selectedRecIndexForDealers === idx ? null : idx)}
                          >
                            {selectedRecIndexForDealers === idx ? 'Hide Dealerships 🏠' : 'Show Dealerships 🏠'}
                          </button>

                          {selectedRecIndexForDealers === idx && (
                            <div className="ev-dealer-grid">
                              {localDealers.length === 0 ? (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.5rem' }}>
                                  ℹ️ No direct dealerships found in {recCity}. Listing is shown as demo sample data.
                                </div>
                              ) : (
                                localDealers.map((dlr: any) => (
                                  <div key={dlr.id} className="ev-dealer-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                      <span>{dlr.name}</span>
                                      <span style={{ color: 'var(--color-primary)' }}>⭐ {dlr.rating}</span>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)' }}>📍 {dlr.address}</div>
                                    <div style={{ color: 'var(--text-secondary)' }}>📞 {dlr.phoneNumber}</div>
                                    <div className="ev-dealer-actions">
                                      <a href={`tel:${dlr.phoneNumber}`} className="btn btn-sm btn-primary" style={{ flexGrow: 1, justifyContent: 'center', fontSize: '0.72rem', padding: '0.2rem' }}>
                                        Call Dealer
                                      </a>
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dlr.name + ' ' + dlr.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm btn-secondary"
                                        style={{ flexGrow: 1, justifyContent: 'center', fontSize: '0.72rem', padding: '0.2rem' }}
                                      >
                                        Get Directions
                                      </a>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. EV Comparison Results */}
            {comparisonResult && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', marginTop: '2rem', paddingBottom: '2.5rem' }} className="fade-in">
                <div className="ev-compare-table-wrapper">
                  <table className="ev-compare-table">
                    <thead>
                      <tr>
                        <th>Specifications</th>
                        <th className={comparisonResult.recommendedEvId === comparisonResult.ev1.id ? 'ev-compare-highlight' : ''}>
                          {comparisonResult.ev1.company} {comparisonResult.ev1.model} {comparisonResult.recommendedEvId === comparisonResult.ev1.id && ' 🏆'}
                        </th>
                        <th className={comparisonResult.recommendedEvId === comparisonResult.ev2.id ? 'ev-compare-highlight' : ''}>
                          {comparisonResult.ev2.company} {comparisonResult.ev2.model} {comparisonResult.recommendedEvId === comparisonResult.ev2.id && ' 🏆'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Ex-Showroom Price</strong></td>
                        <td>
                          ₹{comparisonResult.ev1.minPrice >= 100000 ? `${(comparisonResult.ev1.minPrice / 100000).toFixed(2)}L` : `${(comparisonResult.ev1.minPrice / 1000).toFixed(0)}k`}
                          {comparisonResult.ev1.minPrice !== comparisonResult.ev1.maxPrice && ` - ₹${comparisonResult.ev1.maxPrice >= 100000 ? `${(comparisonResult.ev1.maxPrice / 100000).toFixed(2)}L` : `${(comparisonResult.ev1.maxPrice / 1000).toFixed(0)}k`}`}
                        </td>
                        <td>
                          ₹{comparisonResult.ev2.minPrice >= 100000 ? `${(comparisonResult.ev2.minPrice / 100000).toFixed(2)}L` : `${(comparisonResult.ev2.minPrice / 1000).toFixed(0)}k`}
                          {comparisonResult.ev2.minPrice !== comparisonResult.ev2.maxPrice && ` - ₹${comparisonResult.ev2.maxPrice >= 100000 ? `${(comparisonResult.ev2.maxPrice / 100000).toFixed(2)}L` : `${(comparisonResult.ev2.maxPrice / 1000).toFixed(0)}k`}`}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Body Type</strong></td>
                        <td>{comparisonResult.ev1.bodyType}</td>
                        <td>{comparisonResult.ev2.bodyType}</td>
                      </tr>
                      <tr>
                        <td><strong>Battery Capacity</strong></td>
                        <td>{comparisonResult.ev1.batteryCapacityKwh} kWh</td>
                        <td>{comparisonResult.ev2.batteryCapacityKwh} kWh</td>
                      </tr>
                      <tr>
                        <td><strong>Driving Range</strong></td>
                        <td>{comparisonResult.ev1.rangeKm} km</td>
                        <td>{comparisonResult.ev2.rangeKm} km</td>
                      </tr>
                      <tr>
                        <td><strong>Charging Time</strong></td>
                        <td>{comparisonResult.ev1.chargingTimeMins} mins</td>
                        <td>{comparisonResult.ev2.chargingTimeMins} mins</td>
                      </tr>
                      <tr>
                        <td><strong>Fast Charging</strong></td>
                        <td>{comparisonResult.ev1.fastCharging || 'No'}</td>
                        <td>{comparisonResult.ev2.fastCharging || 'No'}</td>
                      </tr>
                      <tr>
                        <td><strong>Top Speed</strong></td>
                        <td>{comparisonResult.ev1.topSpeedKmh ? `${comparisonResult.ev1.topSpeedKmh} km/h` : 'N/A'}</td>
                        <td>{comparisonResult.ev2.topSpeedKmh ? `${comparisonResult.ev2.topSpeedKmh} km/h` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Warranty Period</strong></td>
                        <td>{comparisonResult.ev1.warrantyYears} Years</td>
                        <td>{comparisonResult.ev2.warrantyYears} Years</td>
                      </tr>
                      <tr>
                        <td><strong>Boot Space</strong></td>
                        <td>{comparisonResult.ev1.bootSpaceLiters ? `${comparisonResult.ev1.bootSpaceLiters} Liters` : 'N/A'}</td>
                        <td>{comparisonResult.ev2.bootSpaceLiters ? `${comparisonResult.ev2.bootSpaceLiters} Liters` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Safety Rating</strong></td>
                        <td>{comparisonResult.ev1.safetyRating ? `${comparisonResult.ev1.safetyRating}/5 ★` : 'N/A'}</td>
                        <td>{comparisonResult.ev2.safetyRating ? `${comparisonResult.ev2.safetyRating}/5 ★` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>User Rating</strong></td>
                        <td>⭐ {comparisonResult.ev1.userRating} / 5</td>
                        <td>⭐ {comparisonResult.ev2.userRating} / 5</td>
                      </tr>
                      <tr>
                        <td><strong>Running Cost</strong></td>
                        <td>₹{comparisonResult.ev1.estimatedRunningCostPerKm} / km</td>
                        <td>₹{comparisonResult.ev2.estimatedRunningCostPerKm} / km</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Recommendation Summary */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderLeft: '4px solid var(--color-primary)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '1.25rem',
                  marginTop: '1.5rem',
                  boxShadow: 'var(--shadow-soft)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏆 Recommendation: {comparisonResult.recommendedEvName}
                  </h4>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem' }}>
                    Why is this model recommended for you?
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {comparisonResult.reasons.map((rsn: string, i: number) => (
                      <li key={i} style={{ marginBottom: '0.25rem' }}>{rsn}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 4: CONTACT US & ABOUT US */}
          <section id="contact-about-section" className="contact-us-layout">
        
        {/* Left Column: Brand, details and buttons */}
        <div style={{ 
          background: '#2b2320', 
          color: '#ffffff', 
          padding: '4rem 3.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          gap: '2.5rem'
        }}>
          
          {/* Brand Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                border: '1.5px solid #ffffff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#D97706'
              }}>
                <Zap size={18} fill="#D97706" stroke="none" />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '1px', fontFamily: 'Outfit, sans-serif' }}>EV-BATTERY360</span>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#c4b5b0', letterSpacing: '1.5px' }}>
              AI-POWERED EV DIAGNOSTICS & LIFECYCLE PLATFORM
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn" 
              style={{ 
                background: 'transparent', 
                border: '1.5px solid rgba(255, 255, 255, 0.4)', 
                color: '#ffffff', 
                padding: '0.65rem 1.75rem', 
                fontWeight: 700,
                fontSize: '0.85rem',
                borderRadius: '0px',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.color = '#2b2320';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#ffffff';
              }}
            >
              FEEDBACK
            </button>
            <button 
              type="button" 
              className="btn" 
              style={{ 
                background: '#ece4db', 
                border: 'none', 
                color: '#2b2320', 
                padding: '0.65rem 1.75rem', 
                fontWeight: 800,
                fontSize: '0.85rem',
                borderRadius: '0px',
                letterSpacing: '1px'
              }}
            >
              PARTNER WITH US
            </button>
          </div>

          {/* Contact details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            <h4 style={{ 
              fontSize: '1rem', 
              fontWeight: 800, 
              letterSpacing: '1.5px', 
              color: '#ffffff', 
              margin: 0,
              fontFamily: 'Outfit, sans-serif'
            }}>
              CONTACT & COLLABORATION
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#ece4db', lineHeight: '1.5' }}>
              <div><strong>Tel:</strong> +91 98765 43210</div>
              <div><strong>Email:</strong> contact@evbattery360.com</div>
              <div><strong>Social:</strong> @EVBattery360</div>
            </div>
          </div>

          {/* Social Icons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              border: '1.2px solid rgba(255, 255, 255, 0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '0.8rem'
            }}>f</a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              border: '1.2px solid rgba(255, 255, 255, 0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '0.8rem'
            }}>𝕏</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              border: '1.2px solid rgba(255, 255, 255, 0.4)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '0.8rem'
            }}>📸</a>
          </div>

        </div>

        {/* Right Column: EV Charging Side View Image */}
        <div className="contact-us-image-side"></div>

      </section>

        </>
      ) : view === 'report' ? (
        /* SECTION 4: DASHBOARD REPORT (Telemetry cards and Recharts graphs on separate page) */
        <section id="dashboard-section" className="scroll-section-block analysis-results-block" style={{ borderBottom: 'none', padding: '6rem 2.5rem 3rem' }}>
          {!result ? (
            <div className="card empty-diagnostic-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
              <HelpCircle size={64} className="text-muted" style={{ animation: 'pulse-dot 2.5s infinite' }} />
              <h2 style={{ fontSize: '1.4rem' }}>Diagnostic Output Pending</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto', textAlign: 'center', lineHeight: '1.6' }}>
                Please enter your EV telemetry and battery parameters and click **Enter / Continue** to load the diagnostics dashboard.
              </p>
              <button className="btn btn-primary" onClick={handleBackToData}>
                Go to Parameters Section
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="report-two-column-layout" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', animation: 'fade-in 0.6s ease-out' }}>
              
              {/* LEFT COLUMN: Battery Health Report details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Header Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <BatteryCharging size={24} className="text-success" />
                      Battery Diagnostic Analysis
                      {result.vehicleId && (
                        <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', marginLeft: '0.5rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid rgba(14,165,233,0.2)' }}>
                          ID: {result.vehicleId}
                        </span>
                      )}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      State of Health Telemetry for {result.manufacturer} {result.model} ({vehicleType.toUpperCase()})
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleBackToData}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <ArrowLeft size={16} />
                      Back to Data
                    </button>
                  </div>
                </div>



                {/* Comparison Box against previous assessment */}
                {result.sohChange !== undefined && result.sohChange !== null && (
                  <div style={{
                    background: 'var(--bg-secondary)',
                    borderLeft: '4px solid var(--color-primary)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: 'var(--shadow-soft)',
                    animation: 'fade-in 0.5s ease-out'
                  }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                      <Activity size={16} className="text-primary" />
                      Comparison with Latest Previous Assessment
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      marginTop: '0.25rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SoH Change</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: (result.sohChange ?? 0) < 0 ? 'var(--color-danger)' : ((result.sohChange ?? 0) > 0 ? 'var(--color-success)' : 'var(--text-primary)') }}>
                          {(result.sohChange ?? 0) > 0 ? `+${result.sohChange}` : result.sohChange}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Usable Capacity Change</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: (result.usableCapacityChange ?? 0) < 0 ? 'var(--color-danger)' : ((result.usableCapacityChange ?? 0) > 0 ? 'var(--color-success)' : 'var(--text-primary)') }}>
                          {(result.usableCapacityChange ?? 0) > 0 ? `+${result.usableCapacityChange}` : result.usableCapacityChange} kWh
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Odometer Increase</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          +{(result.odometerChange ?? 0).toLocaleString()} km
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cycles Logged</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          +{result.cyclesChange ?? 0} cycles
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Battery Age Change</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          +{result.ageChange ?? 0} yrs
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avg Range Change</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: (result.rangeChange ?? 0) < 0 ? 'var(--color-danger)' : ((result.rangeChange ?? 0) > 0 ? 'var(--color-success)' : 'var(--text-primary)') }}>
                          {(result.rangeChange ?? 0) > 0 ? `+${result.rangeChange}` : result.rangeChange} km
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-grid: Telemetry Stats Cards */}
                <div className="stats-subgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div className="stat-item-card" id="stat-usable-capacity">
                    <div className="stat-icon green"><Battery /></div>
                    <div className="stat-details">
                      <span className="value">{result.currentUsableCapacity} kWh</span>
                      <span className="label">Remaining Usable</span>
                    </div>
                  </div>
                  <div className="stat-item-card" id="stat-capacity-loss">
                    <div className="stat-icon" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}><TrendingUp /></div>
                    <div className="stat-details">
                      <span className="value">{result.capacityLoss} kWh</span>
                      <span className="label">Capacity Loss</span>
                    </div>
                  </div>
                  <div className="stat-item-card" id="stat-cycles">
                    <div className="stat-icon"><BatteryCharging /></div>
                    <div className="stat-details">
                      <span className="value">{result.chargingCycles}</span>
                      <span className="label">Charging Cycles</span>
                    </div>
                  </div>
                  <div className="stat-item-card" id="stat-soc">
                    <div className="stat-icon"><Zap /></div>
                    <div className="stat-details">
                      <span className="value">{result.currentBatteryPercentage}%</span>
                      <span className="label">Current Charge</span>
                    </div>
                  </div>
                  <div className="stat-item-card" id="stat-range">
                    <div className="stat-icon"><MapPin /></div>
                    <div className="stat-details">
                      <span className="value">{result.averageRange} km</span>
                      <span className="label">Est. Range</span>
                    </div>
                  </div>
                  <div className="stat-item-card" id="stat-age">
                    <div className="stat-icon"><Calendar /></div>
                    <div className="stat-details">
                      <span className="value">{result.batteryAge} yrs</span>
                      <span className="label">Battery Age</span>
                    </div>
                  </div>
                  <div className="stat-item-card" id="stat-temperature">
                    <div className="stat-icon"><Thermometer /></div>
                    <div className="stat-details">
                      <span className="value">{result.averageTemperature} °C</span>
                      <span className="label">Avg Temp</span>
                    </div>
                  </div>
                </div>

                {/* Graphs Grid */}
                <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                  
                  {/* Battery Health Trend */}
                  <div className="chart-card">
                    <h3 className="card-title"><TrendingUp size={18} className="text-success" />Battery Health Trend</h3>
                    <div className="chart-container">
                      {vehicleHistory.length < 2 ? (
                        <div className="empty-chart-state">
                          <HelpCircle size={28} className="empty-chart-icon" />
                          <h4>Historical logs required</h4>
                          <p>Run diagnostics with other parameters to populate trend lines.</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={[...vehicleHistory].sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())} 
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                              dataKey="createdAt"
                              tickFormatter={(t) => {
                                const d = new Date(t);
                                return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
                              }}
                              tick={{ fontSize: 9 }}
                            />
                            <YAxis domain={[50, 100]} tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontFamily: 'Outfit', fontSize: 11, borderRadius: 8 }} />
                            <Line type="monotone" dataKey="soh" stroke="var(--color-success)" strokeWidth={3} name="SoH %" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Original vs Current Capacity */}
                  <div className="chart-card">
                    <h3 className="card-title"><Battery size={18} className="text-secondary" />Original vs Current Capacity</h3>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Original', capacity: result.originalCapacity },
                          { name: 'Usable', capacity: result.currentUsableCapacity }
                        ]} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontFamily: 'Outfit', fontSize: 11, borderRadius: 8 }} />
                          <Bar dataKey="capacity" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                            <Cell fill="var(--color-primary-light)" />
                            <Cell fill="var(--color-success)" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Normal vs Fast Charging */}
                  <div className="chart-card">
                    <h3 className="card-title"><BatteryCharging size={18} className="text-success" />Normal vs Fast Charging</h3>
                    <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Normal AC', value: result.normalChargingPercentage, color: 'var(--color-success)' },
                              { name: 'Fast DC', value: result.fastChargingPercentage, color: 'var(--color-danger)' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="var(--color-success)" />
                            <Cell fill="var(--color-danger)" />
                          </Pie>
                          <Tooltip contentStyle={{ fontFamily: 'Outfit', fontSize: 11, borderRadius: 8 }} />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Thermal Envelope */}
                  <div className="chart-card">
                    <h3 className="card-title"><Thermometer size={18} style={{ color: 'var(--color-warning)' }} />Thermal Envelope</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', height: '100%', padding: '0 0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>Avg Operating Temp:</span>
                        <strong>{result.averageTemperature}°C</strong>
                      </div>
                      <div className="progress-bar-container" style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.min(100, (result.averageTemperature / 50) * 100)}%`, 
                          height: '100%', 
                          background: result.averageTemperature > 35 ? 'var(--color-danger)' : (result.averageTemperature > 25 ? 'var(--color-warning)' : 'var(--color-success)') 
                        }}></div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {result.averageTemperature > 35 
                          ? '⚠️ Elevated temperature accelerates degradation rates.' 
                          : '✔️ Operating inside ideal thermal envelope boundaries.'}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Action Controls: Raise Complaint & Historical Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setRaiseComplaintModalOpen(true)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      color: '#ffffff', 
                      background: '#0E8360', 
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.6rem 1.25rem',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(14, 131, 96, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                    id="btn-raise-complaint"
                    title="Report a battery problem, capacity drop or charging issue"
                  >
                    <AlertCircle size={16} />
                    Raise a Complaint
                  </button>

                  {history.length > 0 && (
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={clearHistory}
                      disabled={loading}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.15)', background: 'var(--color-danger-light)' }}
                      id="btn-clear-history"
                    >
                      <Trash2 size={16} />
                      Reset Database Telemetry Logs
                    </button>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: Battery Maintenance Tips cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" id="maintenance-tips-panel" style={{ borderLeft: '4px solid var(--color-success)', display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                  <div className="card-title" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={20} className="text-success" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Battery Maintenance Tips</h3>
                  </div>
                  
                  <div className="tips-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
                    {generateTips(result).map((tip) => (
                      <div 
                        key={tip.id} 
                        className={`tip-item ${tip.highlight ? 'tip-highlighted' : ''}`}
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--border-radius-sm)',
                          background: tip.highlight ? 'var(--color-warning-light)' : 'var(--bg-secondary)',
                          border: tip.highlight ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
                          boxShadow: tip.highlight ? '0 4px 12px rgba(245, 158, 11, 0.08)' : 'none',
                          transition: 'all var(--transition-normal)'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          {tip.highlight ? (
                            <AlertTriangle size={20} className="text-warning" style={{ flexShrink: 0, marginTop: '2px' }} />
                          ) : (
                            <CheckCircle size={20} className="text-success" style={{ flexShrink: 0, marginTop: '2px' }} />
                          )}
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>
                              {tip.text}
                            </p>
                            {tip.reason && (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                                {tip.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Degradation Analysis */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <h3 className="card-title" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', margin: 0 }}>
                    📉 Degradation Analysis
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
                    <div>
                      <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Wear Mechanisms</span>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.82rem' }}>
                        Degradation is primary capacity loss. Internal wear mechanisms include SEI layer growth, active material loss, and lithium plating check triggers.
                      </p>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Capacity Retained</span>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.82rem' }}>
                        Your battery has retained <strong>{result.soh}%</strong> of its original capacity. Total lost capacity is <strong>{result.capacityLoss} kWh</strong> from initial values.
                      </p>
                    </div>
                  </div>
                </div>



                {/* Peer Group EV Comparison */}
                <div className="card" style={{ padding: '2rem', borderLeft: '4px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <TrendingUp size={24} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>📊 Peer Group EV Comparison</h3>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.45' }}>
                    Comparing your EV battery's current metrics against the standard fleet average for vehicles of similar age ({result.batteryAge} years) and usage telemetry.
                  </p>

                  <div style={{ height: '220px', width: '100%', marginTop: '0.75rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: 'SOH (%)',
                            'Your Battery': result.soh,
                            'Average EV': Math.max(70, Math.round(100 - (result.batteryAge * 2.2)))
                          },
                          {
                            name: 'Safety Score',
                            'Your Battery': result.safetyScore ?? 92,
                            'Average EV': 88
                          }
                        ]}
                        margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontFamily: 'Outfit', fontSize: 11, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11, marginTop: 10 }} />
                        <Bar dataKey="Your Battery" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Average EV" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                    {(() => {
                      const fleetAvgSoh = Math.max(70, Math.round(100 - (result.batteryAge * 2.2)));
                      const currentSoh = result.soh ?? 0;
                      const isBetterSoh = currentSoh >= fleetAvgSoh;
                      const sohDiff = Math.abs(currentSoh - fleetAvgSoh).toFixed(0);
                      
                      return (
                        <span>
                          ℹ️ Your battery's State of Health is <strong>{currentSoh}%</strong> compared to the peer fleet average of <strong>{fleetAvgSoh}%</strong> for its age. This means your battery is performing <strong>{sohDiff}% {isBetterSoh ? 'better than' : 'below'}</strong> the typical EV database benchmark.
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>
      ) : view === 'passport' ? (
        /* SECTION 5: DIGITAL BATTERY PASSPORT */
        (() => {
          if (!result) return null;
          
          const batteryId = result.vehicleId ? 'BAT-' + (result.vehicleId.includes('-') ? result.vehicleId.split('-').slice(1).join('-') : result.vehicleId) : 'BAT-TEMP';
          const reportId = `REP-${result.id ?? 'NEW'}-${(result.createdAt ? new Date(result.createdAt) : new Date()).getTime().toString().substring(8)}`;
          const creationDate = result.createdAt ? new Date(result.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
          
          let passportState = 'GOOD';
          let stateColor = '#0E8360';
          let stateBg = 'var(--color-success-light)';
          if (result.condition?.toLowerCase() === 'moderate') {
            passportState = 'MODERATE';
            stateColor = '#D97706';
            stateBg = 'var(--color-warning-light)';
          } else if (result.condition?.toLowerCase() === 'degraded' || result.condition?.toLowerCase() === 'poor') {
            passportState = 'POOR';
            stateColor = '#DC2626';
            stateBg = 'var(--color-danger-light)';
          }

          const originalCapacity = result.originalCapacity;
          const currentCapacity = result.currentUsableCapacity;
          const capacityLost = Math.max(0, Math.round((originalCapacity - currentCapacity) * 100) / 100);
          const degradationPercent = Math.max(0, Math.round(((originalCapacity - currentCapacity) / originalCapacity) * 100 * 10) / 10);
          const degradationRate = result.batteryAge > 0 ? (degradationPercent / result.batteryAge).toFixed(1) : '0';

          const tempRisk = result.averageTemperature > 35 ? 'HIGH' : (result.averageTemperature > 30 || result.averageTemperature < 10 ? 'MODERATE' : 'LOW');
          const cycleRisk = result.chargingCycles > 1000 ? 'HIGH' : (result.chargingCycles > 500 ? 'MODERATE' : 'LOW');
          const socRisk = (result.currentBatteryPercentage > 90 || result.currentBatteryPercentage < 15) ? 'MODERATE' : 'LOW';
          const safetyLevel = result.safetyScore && result.safetyScore >= 90 ? 'EXCELLENT' : (result.safetyScore && result.safetyScore >= 75 ? 'STABLE' : 'WARNING');

          let safetyRisk = 'Low';
          if (result.safetyScore && result.safetyScore < 75) safetyRisk = 'High';
          else if (result.safetyScore && result.safetyScore < 90) safetyRisk = 'Moderate';

          let degradationRisk = 'Low';
          if ((result.soh ?? 0) < 80) degradationRisk = 'High';
          else if ((result.soh ?? 0) < 90) degradationRisk = 'Moderate';

          let usageRisk = 'Low';
          if (result.fastChargingPercentage > 50 || result.averageTemperature > 30) usageRisk = 'Moderate';
          if (result.fastChargingPercentage > 75 || result.averageTemperature > 35) usageRisk = 'High';

          let overallRisk = 'Low';
          if (safetyRisk === 'High' || degradationRisk === 'High') overallRisk = 'High';
          else if (safetyRisk === 'Moderate' || degradationRisk === 'Moderate' || usageRisk === 'Moderate') overallRisk = 'Moderate';

          const rul = Math.max(0.5, Math.round((((result.soh ?? 0) - 70) * (result.batteryAge / Math.max(0.1, 100 - (result.soh ?? 0)))) * 10) / 10);

          const capacityImpact = (result.soh ?? 0) < 92 ? 'HIGH IMPACT' : ((result.soh ?? 0) < 96 ? 'MEDIUM IMPACT' : 'LOW IMPACT');
          const cyclesImpact = result.chargingCycles > 600 ? 'HIGH IMPACT' : (result.chargingCycles > 250 ? 'MEDIUM IMPACT' : 'LOW IMPACT');
          const tempImpact = (result.averageTemperature > 35 || result.averageTemperature < 8) ? 'HIGH IMPACT' : ((result.averageTemperature > 28 || result.averageTemperature < 15) ? 'MEDIUM IMPACT' : 'LOW IMPACT');
          const socImpact = (result.currentBatteryPercentage > 95 || result.currentBatteryPercentage < 10) ? 'HIGH IMPACT' : ((result.currentBatteryPercentage > 85 || result.currentBatteryPercentage < 20) ? 'MEDIUM IMPACT' : 'LOW IMPACT');

          let chargingPattern = 'Balanced AC/DC';
          if (result.fastChargingPercentage > 60) chargingPattern = 'DC Fast Intensive';
          else if (result.fastChargingPercentage < 20) chargingPattern = 'Slow AC Dominant';

          const reportOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5175';
          const qrData = encodeURIComponent(`${reportOrigin}/?reportId=${reportId}`);
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${qrData}`;

          const sortedHistory = [...vehicleHistory].sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());

          return (
            <div className="scroll-layout-container" style={{ padding: '6rem 2.5rem 3rem' }}>
              <style dangerouslySetInnerHTML={{ __html: `
                .passport-container {
                  max-width: 1000px;
                  margin: 0 auto;
                  display: flex;
                  flex-direction: column;
                  gap: 2rem;
                  color: var(--text-primary);
                  font-family: var(--font-family);
                }
                .passport-header-section {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border-bottom: 2px solid var(--border-color);
                  padding-bottom: 1.5rem;
                }
                .passport-badge-status {
                  font-size: 1.1rem;
                  font-weight: 800;
                  padding: 0.5rem 1.25rem;
                  border-radius: 30px;
                  letter-spacing: 0.05em;
                  display: inline-block;
                }
                .passport-grid-2col {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 1.5rem;
                }
                .passport-grid-3col {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 1.5rem;
                }
                .passport-info-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 0.6rem 0;
                  border-bottom: 1px dashed var(--border-color);
                  font-size: 0.9rem;
                }
                .passport-info-row:last-child {
                  border-bottom: none;
                }
                .passport-label {
                  color: var(--text-secondary);
                  font-weight: 500;
                }
                .passport-value {
                  font-weight: 700;
                  color: var(--text-primary);
                }
                .risk-pill {
                  padding: 0.2rem 0.6rem;
                  border-radius: 4px;
                  font-weight: 700;
                  font-size: 0.78rem;
                  text-transform: uppercase;
                }
                .risk-high { background: var(--color-danger-light); color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.2); }
                .risk-moderate { background: var(--color-warning-light); color: var(--color-warning); border: 1px solid rgba(245, 158, 11, 0.2); }
                .risk-low { background: var(--color-success-light); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.2); }
                
                /* Timeline */
                .timeline-wrapper {
                  position: relative;
                  padding-left: 2rem;
                  border-left: 2px solid var(--border-color);
                  margin: 1rem 0;
                }
                .timeline-node {
                  position: relative;
                  margin-bottom: 1.75rem;
                }
                .timeline-node::before {
                  content: '';
                  position: absolute;
                  left: calc(-2rem - 6px);
                  top: 4px;
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background: var(--color-secondary);
                  border: 2px solid var(--bg-primary);
                  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
                }
                .timeline-node.current::before {
                  background: var(--color-success);
                  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
                  width: 12px;
                  height: 12px;
                  left: calc(-2rem - 7px);
                }
                .timeline-content-card {
                  background: var(--bg-secondary);
                  border: 1px solid var(--border-color);
                  border-radius: var(--border-radius-sm);
                  padding: 0.85rem 1.25rem;
                  transition: all var(--transition-normal);
                }
                .timeline-content-card:hover {
                  box-shadow: var(--shadow-soft);
                  border-color: var(--color-secondary);
                }

                /* Print Stylesheet */
                @media print {
                  body {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                  }
                  .scroll-layout-container {
                    padding: 0 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  .passport-container {
                    max-width: 100% !important;
                    gap: 1.5rem !important;
                  }
                  .card {
                    border: 1px solid #94a3b8 !important;
                    box-shadow: none !important;
                    background: #ffffff !important;
                  }
                  .passport-header-section {
                    border-bottom: 2px solid #000000 !important;
                  }
                  .timeline-content-card {
                    background: #ffffff !important;
                    border: 1px solid #94a3b8 !important;
                  }
                }
              ` }} />

              <div className="passport-container">
                
                {/* Header Action Buttons (no-print) */}
                <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setView('report')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ArrowLeft size={16} />
                    Back to Diagnostics
                  </button>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.print()}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Printer size={16} />
                      Print Battery Passport
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleBackToData}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      Back to Data Entry
                    </button>
                  </div>
                </div>

                {/* MAIN PASSPORT CONTAINER */}
                <div className="card" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.25rem', boxShadow: 'var(--shadow-card)', position: 'relative' }}>
                  
                  {/* Stamp / Decorative Background */}
                  <div style={{ position: 'absolute', top: '2rem', right: '2rem', opacity: 0.03, pointerEvents: 'none' }} className="no-print">
                    <FileText size={400} />
                  </div>

                  {/* Header & Logo */}
                  <div className="passport-header-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'var(--color-secondary-light)', color: 'var(--color-secondary)', padding: '0.75rem', borderRadius: '12px' }}>
                        <ShieldCheck size={36} />
                      </div>
                      <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Digital Battery Passport</h1>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                          Global EV Alliance Standard (EVS-2026)
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="passport-badge-status" style={{ color: stateColor, background: stateBg, border: `1px solid ${stateColor}` }}>
                        STATE: {passportState}
                      </span>
                    </div>
                  </div>

                  {/* SECTION 1: BATTERY IDENTITY */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '2rem', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                        1. Battery Identity
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <div className="passport-info-row">
                            <span className="passport-label">Vehicle ID</span>
                            <span className="passport-value" style={{ textTransform: 'uppercase' }}>{result.vehicleId}</span>
                          </div>
                          <div className="passport-info-row">
                            <span className="passport-label">Battery ID</span>
                            <span className="passport-value" style={{ textTransform: 'uppercase' }}>{batteryId}</span>
                          </div>
                          <div className="passport-info-row">
                            <span className="passport-label">Manufacturer</span>
                            <span className="passport-value">{result.manufacturer}</span>
                          </div>
                        </div>
                        <div>
                          <div className="passport-info-row">
                            <span className="passport-label">Model</span>
                            <span className="passport-value">{result.model}</span>
                          </div>
                          <div className="passport-info-row">
                            <span className="passport-label">Passport Date</span>
                            <span className="passport-value">{creationDate}</span>
                          </div>
                          <div className="passport-info-row">
                            <span className="passport-label">Unique Report ID</span>
                            <span className="passport-value">{reportId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                      <img src={qrCodeUrl} alt="Report Verification QR Code" style={{ width: '130px', height: '130px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#ffffff', padding: '4px' }} />
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>VERIFY REPORT</span>
                    </div>
                  </div>

                  {/* SECTION 2: BATTERY SPECIFICATIONS */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      2. Battery Technical Specifications
                    </h3>
                    <div className="passport-grid-3col">
                      <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Capacity Metrics</span>
                        <div className="passport-info-row"><span className="passport-label">Original Capacity</span><span className="passport-value">{result.originalCapacity} kWh</span></div>
                        <div className="passport-info-row"><span className="passport-label">Current Usable</span><span className="passport-value">{result.currentUsableCapacity} kWh</span></div>
                      </div>
                      <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Usage Metrics</span>
                        <div className="passport-info-row"><span className="passport-label">Odometer Reading</span><span className="passport-value">{result.odometer.toLocaleString()} km</span></div>
                        <div className="passport-info-row"><span className="passport-label">Battery Age</span><span className="passport-value">{result.batteryAge} Years</span></div>
                      </div>
                      <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Lifecycle Metrics</span>
                        <div className="passport-info-row"><span className="passport-label">Charging Cycles</span><span className="passport-value">{result.chargingCycles} Cycles</span></div>
                        <div className="passport-info-row"><span className="passport-label">Vehicle Type</span><span className="passport-value" style={{ textTransform: 'uppercase' }}>{vehicleType}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: CURRENT BATTERY CONDITION */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      3. Current Battery Condition
                    </h3>
                    <div className="passport-grid-2col">
                      <div className="card" style={{ padding: '1.25rem', borderLeft: `4px solid ${stateColor}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stateColor }}>{result.soh}%</div>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>State of Health</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: stateColor }}>{passportState} Condition</span>
                          </div>
                        </div>
                        <div className="passport-info-row"><span className="passport-label">Active Capacity Degradation</span><span className="passport-value">{degradationPercent}%</span></div>
                        <div className="passport-info-row"><span className="passport-label">Model Engine Prediction</span><span className="passport-value">GBRT Regression ({result.soh}% SoH)</span></div>
                      </div>

                      <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>
                          AI Condition recommendation
                        </span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.45', margin: 0 }}>
                          {passportState === 'GOOD' ? (
                            "The battery remains in excellent state with minimal capacity wear. Continue current charging habits and limit charging to 80-90% for normal daily commuting."
                          ) : passportState === 'MODERATE' ? (
                            "Moderate degradation has been logged. Maintain operational temperatures below 30°C and prioritize AC trickle charging to optimize cell life expectancy."
                          ) : (
                            "Significant battery degradation observed. Recommend cell health evaluation or balancing. Limit high-rate DC charging and keep State of Charge between 20% and 80%."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: BATTERY LIFETIME TIMELINE */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      4. Battery Lifetime Timeline
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                      Chronological summary of battery assessments logged for vehicle {result.vehicleId}
                    </p>
                    
                    <div className="timeline-wrapper">
                      {sortedHistory.map((item, idx) => {
                        const dateObj = new Date(item.createdAt || '');
                        const displayDate = dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' });
                        
                        let sohDiffText = '';
                        let capDiffText = '';
                        let cycleDiffText = '';
                        let milestone = '';

                        if (idx === 0) {
                          milestone = 'Baseline Registration Assessment';
                        } else {
                          const prev = sortedHistory[idx - 1];
                          const sohDiff = (item.soh ?? 0) - (prev.soh ?? 0);
                          const capDiff = Math.round((item.currentUsableCapacity - prev.currentUsableCapacity) * 100) / 100;
                          const cycleDiff = item.chargingCycles - prev.chargingCycles;

                          sohDiffText = sohDiff === 0 ? 'No SoH change' : `${sohDiff > 0 ? '+' : ''}${sohDiff}% SoH`;
                          capDiffText = capDiff === 0 ? 'No capacity change' : `${capDiff > 0 ? '+' : ''}${capDiff} kWh`;
                          cycleDiffText = cycleDiff > 0 ? `+${cycleDiff} cycles logged` : '';

                          if ((prev.soh ?? 0) >= 90 && (item.soh ?? 0) < 90) milestone = 'Milestone: Battery health fell below 90% (Moderate Wear)';
                          else if ((prev.soh ?? 0) >= 80 && (item.soh ?? 0) < 80) milestone = 'Milestone: Battery health fell below 80% (High Wear)';
                          else if (item.odometer > 100000 && prev.odometer <= 100000) milestone = 'Milestone: High Mileage Landmark (100,000 km)';
                          else milestone = `Follow-up Diagnostic assessment #${idx + 1}`;
                        }

                        const isCurrent = item.id === result.id;

                        return (
                          <div key={item.id || idx} className={`timeline-node ${isCurrent ? 'current' : ''}`}>
                            <div className="timeline-content-card" style={isCurrent ? { borderColor: 'var(--color-success)', background: 'var(--color-success-light)' } : {}}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{displayDate} {isCurrent && <span style={{ color: 'var(--color-success)', fontSize: '0.75rem', marginLeft: '0.5rem', fontWeight: 800 }}>(CURRENT)</span>}</span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Odometer: {item.odometer.toLocaleString()} km</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                  <span style={{ fontWeight: 700 }}>Health: {item.soh}% SoH</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>Capacity: {item.currentUsableCapacity} kWh</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>Cycles: {item.chargingCycles}</span>
                                </div>
                                {idx > 0 && (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-secondary-hover)' }}>
                                    {sohDiffText} | {capDiffText} {cycleDiffText ? `| ${cycleDiffText}` : ''}
                                  </span>
                                )}
                              </div>
                              {milestone && (
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Info size={12} className="text-secondary" />
                                  <span>{milestone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 5: DEGRADATION ANALYSIS */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      5. Battery Degradation Analysis
                    </h3>
                    <div className="passport-grid-2col">
                      <div>
                        <div className="passport-info-row"><span className="passport-label">Original Capacity Baseline</span><span className="passport-value">{originalCapacity} kWh</span></div>
                        <div className="passport-info-row"><span className="passport-label">Current Usable Capacity</span><span className="passport-value">{currentCapacity} kWh</span></div>
                        <div className="passport-info-row"><span className="passport-label">Total Capacity Lost</span><span className="passport-value">{capacityLost} kWh</span></div>
                      </div>
                      <div>
                        <div className="passport-info-row"><span className="passport-label">Degradation Percentage</span><span className="passport-value">{degradationPercent}% Capacity Loss</span></div>
                        <div className="passport-info-row"><span className="passport-label">Annualized Degradation Rate</span><span className="passport-value">{degradationRate}% / Year</span></div>
                        <div className="passport-info-row"><span className="passport-label">Primary Stress Factors</span><span className="passport-value">{result.fastChargingPercentage > 40 ? 'DC Rate, ' : ''}Calendar, Thermal</span></div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 6: SAFETY ASSESSMENT */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      6. Battery Safety Audit
                    </h3>
                    <div className="passport-grid-2col" style={{ gap: '2rem' }}>
                      <div>
                        <div className="passport-info-row">
                          <span className="passport-label">Temperature Exposure Risk</span>
                          <span className={`risk-pill risk-${tempRisk.toLowerCase()}`}>{tempRisk}</span>
                        </div>
                        <div className="passport-info-row">
                          <span className="passport-label">Charging Cycle Wearing Risk</span>
                          <span className={`risk-pill risk-${cycleRisk.toLowerCase()}`}>{cycleRisk}</span>
                        </div>
                        <div className="passport-info-row">
                          <span className="passport-label">SoC extreme Range stress</span>
                          <span className={`risk-pill risk-${socRisk.toLowerCase()}`}>{socRisk}</span>
                        </div>
                        <div className="passport-info-row">
                          <span className="passport-label">Overall Safety Evaluation</span>
                          <span className="passport-value" style={{ color: 'var(--color-success)', fontWeight: 800 }}>{safetyLevel} ({result.safetyScore ?? 92}/100)</span>
                        </div>
                      </div>
                      <div className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Safety recommendations</span>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                          {result.averageTemperature > 30 ? (
                            "Thermal stress warning: Avoid heavy loads or DC charging immediately after long drives in hot weather. Let packs cool down first."
                          ) : (
                            "Thermal ranges are optimal. Keep utilizing smart-charge preconditioning during winters or hot summers to minimize cold/heat wear stress."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 7: BATTERY USAGE PROFILE */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      7. Battery Operational & Usage Profile
                    </h3>
                    <div className="passport-grid-3col">
                      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Thermal Envelope</span>
                        <div className="passport-info-row"><span className="passport-label">Avg Temperature</span><span className="passport-value">{result.averageTemperature}°C</span></div>
                        <div className="passport-info-row"><span className="passport-label">Thermal Zone</span><span className="passport-value">{result.averageTemperature > 30 ? 'Elevated' : (result.averageTemperature < 10 ? 'Cold' : 'Optimal')}</span></div>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Charging Characteristics</span>
                        <div className="passport-info-row"><span className="passport-label">Charging Pattern</span><span className="passport-value">{chargingPattern}</span></div>
                        <div className="passport-info-row"><span className="passport-label">Normal AC Charge</span><span className="passport-value">{result.normalChargingPercentage}%</span></div>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Operational Distance</span>
                        <div className="passport-info-row"><span className="passport-label">Average Range</span><span className="passport-value">{result.averageRange} km</span></div>
                        <div className="passport-info-row"><span className="passport-label">Odometer Total</span><span className="passport-value">{result.odometer.toLocaleString()} km</span></div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 8: EXPLAINABLE AI */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      8. Explainable AI (XAI) Model Diagnostics
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                      Indicative influence of inputs on the State of Health (SoH) assessment:
                    </p>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '1.25rem' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                        SOH Result: {result.soh}% ({passportState})
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                            <span className="passport-label">• Usable Capacity wear</span>
                            <span style={{ fontWeight: 700, color: capacityImpact === 'HIGH IMPACT' ? 'var(--color-danger)' : (capacityImpact === 'MEDIUM IMPACT' ? 'var(--color-warning)' : 'var(--color-success)') }}>{capacityImpact}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                            <span className="passport-label">• Charging cycles wore</span>
                            <span style={{ fontWeight: 700, color: cyclesImpact === 'HIGH IMPACT' ? 'var(--color-danger)' : (cyclesImpact === 'MEDIUM IMPACT' ? 'var(--color-warning)' : 'var(--color-success)') }}>{cyclesImpact}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                            <span className="passport-label">• Operational Temperature</span>
                            <span style={{ fontWeight: 700, color: tempImpact === 'HIGH IMPACT' ? 'var(--color-danger)' : (tempImpact === 'MEDIUM IMPACT' ? 'var(--color-warning)' : 'var(--color-success)') }}>{tempImpact}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                            <span className="passport-label">• Current State of Charge</span>
                            <span style={{ fontWeight: 700, color: socImpact === 'HIGH IMPACT' ? 'var(--color-danger)' : (socImpact === 'MEDIUM IMPACT' ? 'var(--color-warning)' : 'var(--color-success)') }}>{socImpact}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 9: BATTERY RISK SCORE */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      9. Battery Risk Score Card
                    </h3>
                    <div className="passport-grid-2col" style={{ alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 1rem' }}>
                        <div style={{ 
                          width: '76px', 
                          height: '76px', 
                          borderRadius: '50%', 
                          background: overallRisk === 'High' ? 'var(--color-danger-light)' : (overallRisk === 'Moderate' ? 'var(--color-warning-light)' : 'var(--color-success-light)'), 
                          border: `3px solid ${overallRisk === 'High' ? 'var(--color-danger)' : (overallRisk === 'Moderate' ? 'var(--color-warning)' : 'var(--color-success)')}`,
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>OVERALL</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: overallRisk === 'High' ? 'var(--color-danger)' : (overallRisk === 'Moderate' ? 'var(--color-warning)' : 'var(--color-success)'), marginTop: '-4px' }}>{overallRisk.toUpperCase()}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Integrated Safety Risk Index</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Risk levels calculated from usage profile, cycle count, and safety grades.</span>
                        </div>
                      </div>
                      <div>
                        <div className="passport-info-row">
                          <span className="passport-label">Safety Risk</span>
                          <span className={`risk-pill risk-${safetyRisk.toLowerCase()}`}>{safetyRisk}</span>
                        </div>
                        <div className="passport-info-row">
                          <span className="passport-label">Degradation Risk</span>
                          <span className={`risk-pill risk-${degradationRisk.toLowerCase()}`}>{degradationRisk}</span>
                        </div>
                        <div className="passport-info-row">
                          <span className="passport-label">Usage Profile Risk</span>
                          <span className={`risk-pill risk-${usageRisk.toLowerCase()}`}>{usageRisk}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 10: PREDICTED BATTERY LIFETIME */}
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      10. Predicted Battery Lifetime & Prognostics
                    </h3>
                    <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-success)', background: 'var(--color-success-light)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Est. Remaining Useful Life (RUL)
                          </span>
                          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success-hover)', display: 'block', marginTop: '0.2rem' }}>
                            ~{rul} Years
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
                            (Threshold: 70% SoH)
                          </span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            Estimated Lifetime Capacity Projection Trend
                          </span>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 0.5rem 0' }}>
                            Under current operational patterns (Degradation rate ~{degradationRate}% / year), capacity is expected to degrade from {currentCapacity} kWh to approximately {Math.max(0, Math.round((originalCapacity * 0.7) * 100) / 100)} kWh in {rul} years.
                          </p>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(239, 68, 68, 0.08)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                            Disclaimer: AI/model-based estimate, not a guaranteed lifespan.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Alliance Certificate Standard */}
                  <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: 0 }}>This passport was dynamically compiled and signed on {creationDate}.</p>
                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600 }}>Global Battery Alliance (GBA) Compliant Template — EV Battery Diagnostics System</p>
                  </div>

                </div>

              </div>
            </div>
          );
        })()
      ) : view === 'company' ? (
        <CompanyDashboardView
          user={user}
          setView={setView}
          companyTab={companyTab}
          setCompanyTab={setCompanyTab}
          companySummary={companySummary}
          companySales={companySales}
          companyModelSales={companyModelSales}
          companyModelsList={companyModelsList}
          selectedCompanyModel={selectedCompanyModel}
          setSelectedCompanyModel={setSelectedCompanyModel}
          companyModelDetail={companyModelDetail}
          companyBatteryHealth={companyBatteryHealth}
          companyServiceSummary={companyServiceSummary}
          companyProblems={companyProblems}
          selectedCompanyProblem={selectedCompanyProblem}
          setSelectedCompanyProblem={setSelectedCompanyProblem}
          companyProblemMatrix={companyProblemMatrix}
          companyInsights={companyInsights}
          compModel1={compModel1}
          setCompModel1={setCompModel1}
          compModel2={compModel2}
          setCompModel2={setCompModel2}
          companyComparisonData={companyComparisonData}
          searchCompanyVehicleId={searchCompanyVehicleId}
          setSearchCompanyVehicleId={setSearchCompanyVehicleId}
          searchedVehicleDetail={searchedVehicleDetail}
          setSearchedVehicleDetail={setSearchedVehicleDetail}
          fetchCompanyVehicleDetail={fetchCompanyVehicleDetail}
          salesRangeFilter={salesRangeFilter}
          setSalesRangeFilter={setSalesRangeFilter}
          salesModelFilter={salesModelFilter}
          setSalesModelFilter={setSalesModelFilter}
          companyLoading={companyLoading}
          companyError={companyError}
        />
      ) : (
        /* SECTION 6: SECOND LIFE PAGE */
        (() => {
          return (
            <div className="scroll-layout-container" style={{ padding: '6rem 2.5rem 3rem' }}>
              <style dangerouslySetInnerHTML={{ __html: `
                .secondlife-container {
                  max-width: 1200px;
                  margin: 0 auto;
                  display: flex;
                  flex-direction: column;
                  gap: 2.5rem;
                  color: var(--text-primary);
                  font-family: var(--font-family);
                }
                .sl-card-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 1.5rem;
                }
                .sl-card {
                  background: var(--bg-secondary);
                  border: 1px solid var(--border-color);
                  border-radius: var(--border-radius-lg);
                  padding: 1.75rem;
                  display: flex;
                  flex-direction: column;
                  gap: 1rem;
                  transition: all var(--transition-normal);
                  position: relative;
                  overflow: hidden;
                }
                .sl-card:hover {
                  box-shadow: var(--shadow-card);
                  transform: translateY(-2px);
                  border-color: var(--color-primary-hover);
                }
                .sl-card-active {
                  border-color: var(--color-primary);
                  background: rgba(16, 185, 129, 0.02);
                }
                .sl-icon-container {
                  background: var(--color-primary-light);
                  color: var(--color-primary);
                  width: 48px;
                  height: 48px;
                  border-radius: 12px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .marketplace-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                  gap: 1.5rem;
                }
                .listing-card {
                  background: var(--bg-secondary);
                  border: 1px solid var(--border-color);
                  border-radius: var(--border-radius-sm);
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                  transition: all var(--transition-normal);
                }
                .listing-card:hover {
                  box-shadow: var(--shadow-soft);
                  border-color: var(--color-secondary);
                }
                .listing-img {
                  width: 100%;
                  height: 180px;
                  object-fit: cover;
                  background: #f1f5f9;
                }
                .listing-content {
                  padding: 1.25rem;
                  display: flex;
                  flex-direction: column;
                  gap: 0.75rem;
                  flex-grow: 1;
                }
                .listing-price {
                  font-size: 1.35rem;
                  font-weight: 800;
                  color: var(--color-success-hover);
                }
                .filter-bar {
                  display: flex;
                  gap: 1rem;
                  flex-wrap: wrap;
                  background: var(--bg-secondary);
                  border: 1px solid var(--border-color);
                  border-radius: var(--border-radius-sm);
                  padding: 1.25rem;
                  align-items: center;
                }
                .filter-item {
                  display: flex;
                  flex-direction: column;
                  gap: 0.35rem;
                }
                .filter-item select, .filter-item input {
                  padding: 0.45rem 0.75rem;
                  border: 1px solid var(--border-color);
                  border-radius: 4px;
                  background: var(--bg-primary);
                  color: var(--text-primary);
                  font-size: 0.85rem;
                }
                .compatibility-badge {
                  font-weight: 800;
                  font-size: 1.1rem;
                  padding: 0.35rem 1rem;
                  border-radius: 6px;
                  display: inline-block;
                }
                .notice-box {
                  background: rgba(245, 158, 11, 0.06);
                  border: 1px solid rgba(245, 158, 11, 0.2);
                  border-radius: var(--border-radius-sm);
                  padding: 1rem 1.25rem;
                  color: var(--text-primary);
                  font-size: 0.85rem;
                  display: flex;
                  align-items: flex-start;
                  gap: 0.75rem;
                }
              ` }} />

              <div className="secondlife-container">
                
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                    Give Your EV Battery a Second Life
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto' }}>
                    Reuse, sell or repurpose batteries that are no longer ideal for vehicle use.
                  </p>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '1.25rem auto 0 auto', fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    «A battery that is no longer suitable for an EV may still have useful capacity for other applications, subject to proper safety testing.»
                  </p>
                </div>

                {/* THREE MAIN CARDS */}
                <div className="sl-card-grid">
                  
                  {/* CARD 1: Buy / Sell Marketplace */}
                  <div className={`sl-card ${activeSlTab === 'marketplace' ? 'sl-card-active' : ''}`} onClick={() => setActiveSlTab('marketplace')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="sl-icon-container"><Zap size={24} /></div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'var(--color-secondary-light)', color: 'var(--color-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>MARKETPLACE</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0' }}>Buy & Sell EV Batteries</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.45', margin: 0 }}>
                        Sell your old EV battery or find a suitable used battery from another user nearby.
                      </p>
                    </div>
                  </div>

                  {/* CARD 2: Solar Energy Storage */}
                  <div className={`sl-card ${activeSlTab === 'solar' ? 'sl-card-active' : ''}`} onClick={() => setActiveSlTab('solar')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="sl-icon-container" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706' }}><TrendingUp size={24} /></div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(217, 119, 6, 0.1)', color: '#D97706', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>SOLAR REUSE</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0' }}>Solar Energy Storage</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.45', margin: 0 }}>
                        Repurpose suitable retired EV batteries as stationary energy storage for solar-generated electricity.
                      </p>
                    </div>
                  </div>

                  {/* CARD 3: Home / Building Backup */}
                  <div className={`sl-card ${activeSlTab === 'backup' ? 'sl-card-active' : ''}`} onClick={() => setActiveSlTab('backup')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="sl-icon-container" style={{ background: 'rgba(14, 131, 96, 0.1)', color: '#0E8360' }}><Activity size={24} /></div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(14, 131, 96, 0.1)', color: '#0E8360', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>BUILDING BACKUP</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0' }}>Home & Building Backup</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.45', margin: 0 }}>
                        Use suitable retired EV batteries as stationary backup energy storage, subject to professional testing and compatible power systems.
                      </p>
                    </div>
                  </div>

                </div>

                {/* TAB CONTENT: MARKETPLACE */}
                {activeSlTab === 'marketplace' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Marketplace safety notice */}
                    <div className="notice-box">
                      <AlertTriangle size={20} style={{ color: '#D97706', flexShrink: 0 }} />
                      <div>
                        <strong>Marketplace Safety Notice:</strong> ⚠️ Marketplace listings are user-generated. Battery condition and safety must be professionally verified before purchase, installation or reuse.
                        <div style={{ marginTop: '0.35rem', display: 'flex', gap: '1rem', fontSize: '0.78rem' }}>
                          <span>🏷️ <strong>Seller-provided information</strong></span>
                          <span>📜 <strong>Certified Test Report</strong> — Only when uploaded/verified.</span>
                        </div>
                      </div>
                    </div>

                    {/* Filter and Action Bar */}
                    <div className="filter-bar">
                      <div className="filter-item">
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>YOUR LOCATION</label>
                        <input 
                          type="text" 
                          value={marketplaceLocation} 
                          onChange={(e) => setMarketplaceLocation(e.target.value)} 
                          placeholder="e.g. Jamshedpur, Jharkhand"
                        />
                      </div>
                      
                      <div className="filter-item">
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>RADIUS</label>
                        <select value={radiusFilter} onChange={(e) => setRadiusFilter(Number(e.target.value))}>
                          <option value={10}>10 km</option>
                          <option value={25}>25 km</option>
                          <option value={50}>50 km</option>
                          <option value={100}>100+ km</option>
                        </select>
                      </div>

                      <div className="filter-item">
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>VEHICLE TYPE</label>
                        <select value={vehicleTypeFilter} onChange={(e) => setVehicleTypeFilter(e.target.value)}>
                          <option value="">All Vehicles</option>
                          <option value="scooty">Scooty</option>
                          <option value="bike">Bike</option>
                          <option value="car">Car</option>
                          <option value="bus">Bus</option>
                        </select>
                      </div>

                      <div className="filter-item">
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>CHEMISTRY</label>
                        <select value={chemistryFilter} onChange={(e) => setChemistryFilter(e.target.value)}>
                          <option value="">All Chemistries</option>
                          <option value="LFP">LFP (Lithium Iron Phosphate)</option>
                          <option value="NMC">NMC (Nickel Manganese Cobalt)</option>
                          <option value="LTO">LTO (Lithium Titanate)</option>
                        </select>
                      </div>

                      <div className="filter-item">
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MAX PRICE (₹)</label>
                        <input 
                          type="number" 
                          value={priceFilter} 
                          onChange={(e) => setPriceFilter(e.target.value ? Number(e.target.value) : '')} 
                          placeholder="Any Price"
                        />
                      </div>

                      <div className="filter-item">
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>MIN SOH (%)</label>
                        <input 
                          type="number" 
                          value={sohFilter} 
                          onChange={(e) => setSohFilter(e.target.value ? Number(e.target.value) : '')} 
                          placeholder="Min SOH"
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto', alignSelf: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={fetchListings} style={{ padding: '0.5rem 1.1rem' }}>
                          Apply Filters
                        </button>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => {
                            if (!isLoggedIn) {
                              setError('Please login to list a battery for sale.');
                              setIsLoginOpen(true);
                              return;
                            }
                            setIsCreatingListing(true);
                          }}
                          style={{ padding: '0.5rem 1.25rem' }}
                        >
                          Sell Your Battery
                        </button>
                      </div>
                    </div>

                    {/* Listing Creation Form Modal */}
                    {isCreatingListing && (
                      <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card modal-content" style={{ maxWidth: '600px', width: '92%', padding: '2rem', animation: 'fade-in 0.3s ease-out' }}>
                          <button className="modal-close" onClick={() => setIsCreatingListing(false)}>
                            <X size={20} />
                          </button>
                          
                          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Sell Your Battery</h3>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Vehicle Type</label>
                              <select value={listingForm.vehicleType} onChange={(e) => setListingForm({...listingForm, vehicleType: e.target.value})}>
                                <option value="scooty">Scooty</option>
                                <option value="bike">Bike</option>
                                <option value="car">Car</option>
                                <option value="bus">Bus</option>
                              </select>
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Manufacturer</label>
                              <input type="text" value={listingForm.manufacturer} onChange={(e) => setListingForm({...listingForm, manufacturer: e.target.value})} placeholder="e.g. Ola" required />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Model</label>
                              <input type="text" value={listingForm.model} onChange={(e) => setListingForm({...listingForm, model: e.target.value})} placeholder="e.g. S1 Pro" required />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Battery Chemistry</label>
                              <select value={listingForm.chemistry} onChange={(e) => setListingForm({...listingForm, chemistry: e.target.value})}>
                                <option value="LFP">LFP (Lithium Iron Phosphate)</option>
                                <option value="NMC">NMC (Nickel Manganese Cobalt)</option>
                                <option value="LTO">LTO (Lithium Titanate)</option>
                              </select>
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Battery Capacity (kWh)</label>
                              <input type="number" step="0.1" value={listingForm.capacity} onChange={(e) => setListingForm({...listingForm, capacity: Number(e.target.value)})} placeholder="e.g. 3.2" required />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Current Estimated SoH (%)</label>
                              <input type="number" value={listingForm.estimatedSoH} onChange={(e) => setListingForm({...listingForm, estimatedSoH: Number(e.target.value)})} placeholder="e.g. 72" required />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Charging Cycles</label>
                              <input type="number" value={listingForm.chargingCycles} onChange={(e) => setListingForm({...listingForm, chargingCycles: Number(e.target.value)})} placeholder="e.g. 1120" />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Battery Age (Years)</label>
                              <input type="number" step="0.1" value={listingForm.batteryAge} onChange={(e) => setListingForm({...listingForm, batteryAge: Number(e.target.value)})} placeholder="e.g. 3.5" />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Price (₹)</label>
                              <input type="number" value={listingForm.price} onChange={(e) => setListingForm({...listingForm, price: Number(e.target.value)})} placeholder="e.g. 25000" required />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>City</label>
                              <input type="text" value={listingForm.city} onChange={(e) => setListingForm({...listingForm, city: e.target.value})} placeholder="e.g. Jamshedpur" required />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>State</label>
                              <input type="text" value={listingForm.state} onChange={(e) => setListingForm({...listingForm, state: e.target.value})} placeholder="e.g. Jharkhand" required />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Image URL</label>
                              <input type="text" value={listingForm.imageUrl} onChange={(e) => setListingForm({...listingForm, imageUrl: e.target.value})} placeholder="Image URL" />
                            </div>
                            <div className="filter-item">
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Phone Number</label>
                              <input type="text" value={listingForm.phoneNumber} onChange={(e) => setListingForm({...listingForm, phoneNumber: e.target.value})} placeholder="e.g. 9876543210" required />
                            </div>
                            <div className="filter-item" style={{ gridColumn: 'span 2' }}>
                              <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Description</label>
                              <textarea value={listingForm.description} onChange={(e) => setListingForm({...listingForm, description: e.target.value})} placeholder="Additional details..." rows={3} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}></textarea>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsCreatingListing(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateListing}>Submit Listing</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Listings Display Grid */}
                    {listings.length === 0 ? (
                      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Info size={48} style={{ margin: '0 auto 1rem auto', display: 'block', color: 'var(--text-muted)' }} />
                        <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>No listings found matching your location filters.</p>
                        <p style={{ fontSize: '0.85rem' }}>Try broadening your search criteria or add a new battery listing.</p>
                      </div>
                    ) : (
                      <div className="marketplace-grid">
                        {listings.map((item) => {
                          const isNearby = item.city.toLowerCase().trim() === (marketplaceLocation.split(',')[0].toLowerCase().trim());
                          const distanceText = isNearby ? '0-10 km (Nearby)' : '25-50 km (Farther)';
                          
                          return (
                            <div key={item.id} className="listing-card" style={{ animation: 'fade-in 0.4s ease-out' }}>
                              <img src={item.imageUrl || 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=300&q=80'} alt="Battery image" className="listing-img" />
                              <div className="listing-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.2rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                                    {item.vehicleType}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {distanceText}
                                  </span>
                                </div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0' }}>
                                  🔋 EV Battery
                                </h4>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                  <div>{item.manufacturer} {item.model} Battery</div>
                                  <div><strong>{item.estimatedSoH}% Estimated Health</strong></div>
                                  <div>{item.capacity} kWh</div>
                                  <div>{item.chargingCycles} cycles</div>
                                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                    📍 {item.city}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                                  <span className="listing-price">₹{item.price.toLocaleString()}</span>
                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <button 
                                      className="btn btn-secondary" 
                                      onClick={() => setSelectedListing(item)}
                                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                    >
                                      View Details
                                    </button>
                                    <button 
                                      className="btn btn-primary"
                                      onClick={() => setContactSellerModal(item)}
                                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                                    >
                                      Contact Seller
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Listing Details Modal */}
                    {selectedListing && (
                      <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card modal-content" style={{ maxWidth: '500px', width: '92%', padding: '2rem', animation: 'fade-in 0.3s ease-out' }}>
                          <button className="modal-close" onClick={() => setSelectedListing(null)}>
                            <X size={20} />
                          </button>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Listing Details</h3>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <img src={selectedListing.imageUrl} alt="Battery details" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px' }} />
                            <div>
                              <h4 style={{ fontSize: '1.2rem', fontWeight: 850, margin: 0 }}>{selectedListing.manufacturer} {selectedListing.model} Battery</h4>
                              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success-hover)', display: 'block', marginTop: '0.25rem' }}>₹{selectedListing.price.toLocaleString()}</span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Vehicle Type:</span> <strong style={{ textTransform: 'uppercase' }}>{selectedListing.vehicleType}</strong></div>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Chemistry:</span> <strong>{selectedListing.chemistry}</strong></div>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Capacity:</span> <strong>{selectedListing.capacity} kWh</strong></div>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Estimated SoH:</span> <strong>{selectedListing.estimatedSoH}%</strong></div>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Cycles:</span> <strong>{selectedListing.chargingCycles}</strong></div>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Age:</span> <strong>{selectedListing.batteryAge} Years</strong></div>
                            </div>

                            <div style={{ fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontWeight: 600, marginBottom: '0.25rem' }}>Seller Description:</span>
                              <p style={{ margin: 0, lineHeight: '1.45', color: 'var(--text-primary)' }}>{selectedListing.description || 'No description provided by the seller.'}</p>
                            </div>

                            <div style={{ fontSize: '0.82rem', background: 'rgba(16, 185, 129, 0.05)', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Listing Source:</span> <strong>Seller-provided information</strong></div>
                              <div><span style={{ color: 'var(--text-secondary)' }}>Location:</span> <strong>📍 {selectedListing.city}, {selectedListing.state}</strong></div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedListing(null)}>Close</button>
                            <button className="btn btn-primary" onClick={() => { setSelectedListing(null); setContactSellerModal(selectedListing); }}>Contact Seller</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contact Seller Modal */}
                    {contactSellerModal && (
                      <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="card modal-content" style={{ maxWidth: '400px', width: '92%', padding: '2rem', textAlign: 'center', animation: 'fade-in 0.3s ease-out' }}>
                          <button className="modal-close" onClick={() => setContactSellerModal(null)}>
                            <X size={20} />
                          </button>
                          <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                            <ShieldCheck size={32} />
                          </div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Contact Seller</h3>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.45' }}>
                            Listing: <strong>{contactSellerModal.manufacturer} {contactSellerModal.model} Battery</strong>
                          </p>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div>📞 Phone: <strong>{contactSellerModal.phoneNumber || 'Not provided'}</strong></div>
                            <div>✉️ Email: <strong>{contactSellerModal.sellerEmail}</strong></div>
                          </div>

                          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                            You can reach out directly via email or call the seller to negotiate, request diagnostics, or arrange nearby collection.
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={() => setContactSellerModal(null)}>Close</button>
                            {contactSellerModal.phoneNumber && (
                              <a href={`tel:${contactSellerModal.phoneNumber}`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>Call Seller</a>
                            )}
                            <a href={`mailto:${contactSellerModal.sellerEmail}?subject=Inquiry about your EV Battery Listing (${contactSellerModal.manufacturer})`} className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>Email Seller</a>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* TAB CONTENT: SOLAR REUSE */}
                {activeSlTab === 'solar' && (
                  <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fade-in 0.4s ease-out' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                      <div className="sl-icon-container" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706' }}><TrendingUp size={24} /></div>
                      <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Solar Energy Storage Repurposing</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assess battery specifications for solar stationary grids.</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                      
                      {/* Left Column: Process & Cost Table */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>How it Repurposes</span>
                          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.45' }}>
                            Retired EV batteries (retaining 60-80% capacity) can store solar energy generated during midday and discharge it during peak grid demand or nighttime, extending the battery life by another 5-10 years.
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-primary)', borderRadius: '6px', marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                            <span>☀️ Solar Panels</span>
                            <span>➔</span>
                            <span>🔋 EV Battery</span>
                            <span>➔</span>
                            <span>🏠 Stored Energy</span>
                          </div>
                        </div>

                        {/* Repurposing Flowchart */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🔄 Repurposing Process Flowchart</span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }} className="flowchart-container">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: '90px', textAlign: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>1</div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Diagnostics</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Check SOH &gt; 65%</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 300 }}>➔</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: '90px', textAlign: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>2</div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Extraction</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Isolate Modules</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 300 }}>➔</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: '90px', textAlign: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>3</div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>BMS Setup</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Smart Balancer</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 300 }}>➔</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: '90px', textAlign: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>4</div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Grid Sync</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Solar Inverter</span>
                            </div>
                          </div>
                        </div>

                        {/* Step by Step Process */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>🛠️ Step-by-Step Repurposing Process</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            <div><strong>1. Health Diagnostics:</strong> Test individual cells to ensure State of Health (SoH) is above 65% with stable internal resistance.</div>
                            <div><strong>2. Module Extraction:</strong> Disassemble pack frames to extract individual prismatic/pouch cell blocks.</div>
                            <div><strong>3. BMS Setup:</strong> Install a custom balancer Battery Management System (BMS) with thermal sensors.</div>
                            <div><strong>4. Inverter Connection:</strong> Sync the battery bank to a compatible Hybrid Solar Inverter with standard charge cutoff safety margins.</div>
                          </div>
                        </div>

                        {/* Cost & Product Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>💰 Extra Components & Cost Analysis</h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                                <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Product Required</th>
                                <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Specifications</th>
                                <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Estimated Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Hybrid Solar Inverter</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>5kW, 48V DC input sync</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₹65,000 - ₹85,000</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Stationary Smart BMS</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Active balancing, temperature sensor</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₹12,000 - ₹18,000</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Fireproof Battery Cabinet</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Insulated enclosure, safety exhaust</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₹8,000 - ₹15,000</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>DC Circuit Breakers & Cables</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Heavy copper, 150A fuse blocks</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₹4,000 - ₹7,000</td>
                              </tr>
                              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                                <td style={{ padding: '0.55rem 0.75rem' }}>Total Extra Cost</td>
                                <td style={{ padding: '0.55rem 0.75rem' }}>Excluding solar panels</td>
                                <td style={{ padding: '0.55rem 0.75rem', color: 'var(--color-primary)' }}>₹89,000 - ₹1,25,000</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                      </div>

                      {/* Right Column: YouTube, Stats & Compatibility */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* YouTube Tutorial */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🎥 Repurposing Video Tutorial</span>
                          <iframe 
                            width="100%" 
                            height="200" 
                            src="https://www.youtube.com/embed/Zv_7wTxrvL0" 
                            title="Solar battery tutorial" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen 
                            style={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}
                          ></iframe>
                        </div>

                        {/* Adoption Stats */}
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>📊 Global Adoption Stats</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>Active Solar installations:</span>
                            <strong>250,000+ homes</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>CO2 reduction impact:</span>
                            <strong>1.8M tons/year</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>Avg solar grid efficiency:</span>
                            <strong>91%</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Solar Storage Potential</span>
                          {result ? (
                            (() => {
                              const isHigh = (result.soh ?? 0) >= 75 && (result.safetyScore ?? 0) >= 80;
                              const isMod = (result.soh ?? 0) >= 65 && (result.safetyScore ?? 0) >= 70;
                              const text = isHigh ? 'HIGH' : (isMod ? 'MODERATE' : 'LOW');
                              const color = isHigh ? 'var(--color-success)' : (isMod ? 'var(--color-warning)' : 'var(--color-danger)');
                              const bg = isHigh ? 'var(--color-success-light)' : (isMod ? 'var(--color-warning-light)' : 'var(--color-danger-light)');
                              return (
                                <div style={{ textAlign: 'center' }}>
                                  <span className="compatibility-badge" style={{ color, background: bg, border: `1px solid ${color}`, fontSize: '1.5rem', padding: '0.35rem 1.5rem', borderRadius: '4px', fontWeight: 800 }}>{text}</span>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.75rem', maxWidth: '220px', lineHeight: '1.35', margin: '0.75rem 0 0 0' }}>
                                    {isHigh ? 'Highly recommended for stationary solar grid support.' : (isMod ? 'Suitable with balanced AC charging operational envelopes.' : 'Not suitable for solar storage due to degradation levels.')}
                                  </p>
                                </div>
                              );
                            })()
                          ) : (
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)' }}>PENDING DIAGNOSTICS</span>
                          )}
                        </div>

                        {/* Advantages & 2-Year Cost Savings */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem', width: '100%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🌟 Key Advantages</span>
                            <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <li><strong>Grid Tariff Shield:</strong> Charge off-peak and discharge during heavy midday/evening solar windows.</li>
                              <li><strong>Extended Lifecycle:</strong> Grants cells 5–10 extra useful years in low-stress stationary grids.</li>
                              <li><strong>Zero Extraction Footprint:</strong> Direct recycling delay reduces battery manufacturing carbon overheads.</li>
                            </ul>
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>💸 Estimated 2-Year Cost Savings</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>₹1,80,000 - ₹2,30,000</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                              Compared against buying a new 10kWh home solar lithium storage unit (~₹2.8L) + standard utility bill reductions.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: BUILDING BACKUP */}
                {activeSlTab === 'backup' && (
                  <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', animation: 'fade-in 0.4s ease-out' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                      <div className="sl-icon-container" style={{ background: 'rgba(14, 131, 96, 0.1)', color: '#0E8360' }}><Activity size={24} /></div>
                      <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Home & Building Backup Repurposing Check</h2>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assess battery specifications for building stationary grid backup.</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                      
                      {/* Left Column: Process & Cost Table */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>How it Repurposes</span>
                          <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: '1.45' }}>
                            Retired EV batteries can serve as backup energy blocks for critical building grids or home lighting, subject to professional power systems and inverter testing. This provides reliable emergency backup power.
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-primary)', borderRadius: '6px', marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}>
                            <span>⚡ Grid Power</span>
                            <span>➔</span>
                            <span>🔋 EV Battery</span>
                            <span>➔</span>
                            <span>🏠 Home / Office Backup</span>
                          </div>
                        </div>

                        {/* Repurposing Flowchart */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🔄 Repurposing Process Flowchart</span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }} className="flowchart-container">
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: '90px', textAlign: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>1</div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Suitability</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Check Swelling</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 300 }}>➔</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: '90px', textAlign: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>2</div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Wiring Setup</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>48V / 96V Pack</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 300 }}>➔</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: '90px', textAlign: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>3</div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>ATS Switch</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Millisecond Transfer</span>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 300 }}>➔</div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1, minWidth: '90px', textAlign: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>4</div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Vent Safety</span>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Dry Cooler Box</span>
                            </div>
                          </div>
                        </div>

                        {/* Step by Step Process */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>🛠️ Step-by-Step Repurposing Process</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            <div><strong>1. Suitability & Leak Check:</strong> Inspect modular cell blocks for structural defects, swelling, and leakage.</div>
                            <div><strong>2. Voltage Configuration:</strong> Wire modular cell groups in series and parallel to create a standard 48V or 96V DC system.</div>
                            <div><strong>3. ATS Installation:</strong> Install an Automatic Transfer Switch (ATS) next to the main panel for instant cutover.</div>
                            <div><strong>4. Vent & Safety Setup:</strong> Deploy in a dry, ventilated, temperature-regulated enclosure to avoid thermal runaways.</div>
                          </div>
                        </div>

                        {/* Cost & Product Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>💰 Extra Components & Cost Analysis</h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                                <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Product Required</th>
                                <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Specifications</th>
                                <th style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Estimated Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Off-Grid / Hybrid Inverter</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>8kW or 10kW, pure sine wave</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₹95,000 - ₹1,30,000</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Automatic Transfer Switch (ATS)</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>100A automatic transfer utility switch</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₹7,500 - ₹14,000</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Industrial Balancer BMS</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Supports high discharge currents, active fan</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₹16,000 - ₹25,000</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>Active Cool-Air Exhaust</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>12V thermo-regulated exhaust fans</td>
                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₹5,000 - ₹9,500</td>
                              </tr>
                              <tr style={{ background: 'var(--bg-secondary)', fontWeight: 700 }}>
                                <td style={{ padding: '0.55rem 0.75rem' }}>Total Extra Cost</td>
                                <td style={{ padding: '0.55rem 0.75rem' }}>Excluding custom cell enclosures</td>
                                <td style={{ padding: '0.55rem 0.75rem', color: 'var(--color-primary)' }}>₹1,23,500 - ₹1,78,500</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                      </div>

                      {/* Right Column: YouTube, Stats & Compatibility */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* YouTube Tutorial */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🎥 Repurposing Video Tutorial</span>
                          <iframe 
                            width="100%" 
                            height="200" 
                            src="https://www.youtube.com/embed/lZkhlfI44kY" 
                            title="Home backup tutorial" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen 
                            style={{ borderRadius: '8px', border: '1px solid var(--border-color)' }}
                          ></iframe>
                        </div>

                        {/* Adoption Stats */}
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>📊 Global Adoption Stats</span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>Active Backup complex installs:</span>
                            <strong>180,000+ locations</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>Datacenter emergency grids:</span>
                            <strong>12,500+ systems</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>Avg grid switch response time:</span>
                            <strong>16 milliseconds</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Backup Compatibility Potential</span>
                          {result ? (
                            (() => {
                              const isGood = (result.soh ?? 0) >= 70 && (result.safetyScore ?? 0) >= 75;
                              const isMod = (result.soh ?? 0) >= 60 && (result.safetyScore ?? 0) >= 65;
                              const text = isGood ? 'GOOD' : (isMod ? 'MODERATE' : 'POOR');
                              const color = isGood ? 'var(--color-success)' : (isMod ? 'var(--color-warning)' : 'var(--color-danger)');
                              const bg = isGood ? 'var(--color-success-light)' : (isMod ? 'var(--color-warning-light)' : 'var(--color-danger-light)');
                              return (
                                <div style={{ textAlign: 'center' }}>
                                  <span className="compatibility-badge" style={{ color, background: bg, border: `1px solid ${color}`, fontSize: '1.5rem', padding: '0.35rem 1.5rem', borderRadius: '4px', fontWeight: 800 }}>{text}</span>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.75rem', maxWidth: '220px', lineHeight: '1.35', margin: '0.75rem 0 0 0' }}>
                                    {isGood ? 'Optimal capacity remaining for general backup support.' : (isMod ? 'Adequate for low-rate trickle backup systems.' : 'Not suitable for backup systems due to safety thresholds.')}
                                  </p>
                                </div>
                              );
                            })()
                          ) : (
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-muted)' }}>PENDING DIAGNOSTICS</span>
                          )}
                        </div>

                        {/* Advantages & 2-Year Cost Savings */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem', width: '100%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🌟 Key Advantages</span>
                            <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <li><strong>Millisecond Cutover:</strong> Automatic switchboard integration provides instant backup power during grid cuts.</li>
                              <li><strong>Eco-Clean Backup:</strong> Operates silently with zero emissions, replacing noisy diesel generators.</li>
                              <li><strong>Heavy Load Capacity:</strong> High discharge configuration handles motor start-up surges easily.</li>
                            </ul>
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>💸 Estimated 2-Year Cost Savings</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>₹2,60,000 - ₹3,10,000</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.35' }}>
                              Savings computed against buying a new 15kVA commercial diesel backup system + estimated fuel costs over 24 months.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* SMART RECOMMENDATION SECTION */}
                <div className="card" style={{ padding: '2rem', borderLeft: '4px solid var(--color-primary)', animation: 'fade-in 0.4s ease-out' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Activity size={24} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>🧠 Smart Second-Life Recommendation</h3>
                  </div>

                  {result ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'center' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Your Battery</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                          <div>SoH: <strong>{result.soh}%</strong></div>
                          <div>Safety Score: <strong>{result.safetyScore ?? 92}/100</strong></div>
                          <div>Capacity: <strong>{result.currentUsableCapacity} kWh</strong></div>
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>SMART MATCHING</span>
                        
                        {(() => {
                          const solarGood = (result.soh ?? 0) >= 75 && (result.safetyScore ?? 0) >= 80;
                          const solarMod = (result.soh ?? 0) >= 65 && (result.safetyScore ?? 0) >= 70;
                          const backupGood = (result.soh ?? 0) >= 70 && (result.safetyScore ?? 0) >= 75;
                          const backupMod = (result.soh ?? 0) >= 60 && (result.safetyScore ?? 0) >= 65;

                          const solarTag = solarGood ? 'HIGH POTENTIAL' : (solarMod ? 'GOOD POTENTIAL' : 'LOW POTENTIAL');
                          const backupTag = backupGood ? 'HIGH POTENTIAL' : (backupMod ? 'GOOD POTENTIAL' : 'LOW POTENTIAL');

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                                <span>🥇 Solar Storage</span>
                                <strong style={{ color: solarGood ? 'var(--color-success)' : (solarMod ? 'var(--color-warning)' : 'var(--color-danger)') }}>{solarTag}</strong>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                                <span>🥈 Home/Building Backup</span>
                                <strong style={{ color: backupGood ? 'var(--color-success)' : (backupMod ? 'var(--color-warning)' : 'var(--color-danger)') }}>{backupTag}</strong>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
                                <span>🥉 Marketplace</span>
                                <strong style={{ color: 'var(--color-secondary)' }}>Available for evaluation</strong>
                              </div>

                              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                Smart Matching calculations evaluate current capacity, usage cycles, and degradation factors to prioritize repurposing tracks. All estimations are for guidance only.
                              </p>

                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>No active battery analysis found. Recommend completing a diagnostic check first to see compatibility matching.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })()
      )}

      {/* Raise Customer Complaint Modal */}
      <RaiseComplaintModal
        isOpen={raiseComplaintModalOpen}
        onClose={() => setRaiseComplaintModalOpen(false)}
        onSuccess={handleRaiseComplaintSuccess}
        currentVehicleId={result?.vehicleId || 'VIN-1001'}
        currentModel={result?.model || 'EV 360'}
        currentManufacturer={result?.manufacturer || 'EV Company'}
        userEmail={user?.gmail || (user as any)?.email || 'owner@evcompany.com'}
      />

    </div>
  );
}

export type BatteryHealthStatus = 'Healthy' | 'Warning' | 'Critical';

export interface BatteryAssessmentData {
  id: string;
  assessmentDate: string; // ISO format or YYYY-MM-DD
  serviceCenter: string;
  assessedBy: string;
  soh: number; // e.g. 94.2
  usableCapacityKwh: number; // e.g. 42.4
  originalCapacityKwh: number; // e.g. 45.0
  internalResistanceMohm: number; // e.g. 14.2
  cellVoltageImbalanceMv: number; // e.g. 12
  avgTempCelsius: number; // e.g. 26.5
  peakTempCelsius: number; // e.g. 33.8
  chargeCycles: number;
  odometerKm: number;
  dtcCodes: string[]; // e.g. ["None"] or ["B204-1"]
  remarks: string;
  result: 'PASS' | 'WARNING' | 'FAIL';
}

export interface SoldVehicleData {
  vehicleId: string;
  vin: string;
  model: string; // e.g. "EV 360", "E1", "E2", "E3"
  batteryPackId: string; // e.g. "BP-LFP-30-8834"
  batteryType: string; // e.g. "30kWh LFP", "45kWh NMC", "50kWh LFP"
  saleDate: string;
  customerName: string;
  customerPhone: string;
  currentSoh: number;
  healthStatus: BatteryHealthStatus;
  odometerKm: number;
  chargeCycles: number;
  assessments: BatteryAssessmentData[];
}

export interface ShowroomData {
  id: string;
  name: string;
  code: string;
  address: string;
  manager: string;
  contact: string;
  email: string;
  cityId: string;
  cityName: string;
  stateId: string;
  stateName: string;
  totalVehiclesSold: number;
  averageSoh: number;
  vehicles: SoldVehicleData[];
}

export interface CityData {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  totalShowrooms: number;
  totalVehiclesSold: number;
  averageSoh: number;
  showrooms: ShowroomData[];
}

export interface StateData {
  id: string;
  name: string;
  code: string;
  totalCities: number;
  totalShowrooms: number;
  totalVehiclesSold: number;
  averageSoh: number;
  cities: CityData[];
}

export interface SelectedSalesLocation {
  state: StateData | null;
  city: CityData | null;
  showroom: ShowroomData | null;
}

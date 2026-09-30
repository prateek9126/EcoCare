export type ModelHealthStatus = 'Healthy' | 'Watch' | 'Critical';
export type BatteryChemistry = 'LFP' | 'NMC';

export interface ModelHealthMetric {
  model: string;
  chemistry: BatteryChemistry;
  avgSoh: number;
  nominalCapacityKwh: number;
  retainedCapacityKwh: number;
  capacityRetentionPercent: number;
  avgBatteryAgeYears: number;
  avgChargingCycles: number;
  problemRate: number; // e.g. 16.7
  avgInternalResistanceMohm: number; // e.g. 14.5
  cellVoltageImbalanceMv: number; // e.g. 11
  degradationRatePer100Cycles: number; // e.g. 0.82 (% SoH drop per 100 cycles)
  predictedMonthsTo80Soh: number; // e.g. 36
  status: ModelHealthStatus;
  // Detail expansion telemetry
  minCellVoltage: number;
  maxCellVoltage: number;
  voltageStdDevMv: number;
  thermalVarianceCelsius: number;
  packTempRange: string;
  monthlyTrend: { month: string; soh: number }[];
}

export interface HealthDistributionBucket {
  name: string; // 'Healthy (>90%)' | 'Good (80-90%)' | 'Warning (70-80%)' | 'Critical (<70%)'
  key: 'healthy' | 'good' | 'warning' | 'critical';
  count: number;
  percentage: number;
  color: string;
}

export interface MonthlyModelSohPoint {
  month: string;
  [modelName: string]: string | number;
}

export interface AtRiskBatteryRecord {
  vehicleId: string;
  vin: string;
  model: string;
  chemistry: BatteryChemistry;
  batteryPackId: string;
  soh: number;
  capacityKwh: number;
  city: string;
  state: string;
  showroomName: string;
  chargeCycles: number;
  lastAssessmentDate: string;
  internalResistanceMohm: number;
  cellVoltageImbalanceMv: number;
  status: 'Healthy' | 'Good' | 'Warning' | 'Critical';
  rawVehicleRef?: any;
}

export interface BatteryHealthFilters {
  models: string[]; // empty means all
  chemistry: 'ALL' | 'LFP' | 'NMC';
  dateRange: '30D' | '6M' | '12M' | 'ALL';
  status: 'ALL' | 'Healthy' | 'Good' | 'Warning' | 'Critical';
  searchQuery: string;
}

import type { 
  ModelHealthMetric, 
  HealthDistributionBucket, 
  MonthlyModelSohPoint, 
  AtRiskBatteryRecord,
  BatteryHealthFilters,
  ModelHealthStatus
} from '../types/batteryHealth';
import { getSalesCityDataset } from './salesCityData';
import type { StateData, CityData } from '../types/salesCity';

export function calculateStatus(soh: number, problemRate: number): ModelHealthStatus {
  if (soh < 75.0 || (soh < 84.0 && problemRate >= 15.0)) {
    return 'Critical';
  }
  if (soh < 88.0 || problemRate >= 8.0) {
    return 'Watch';
  }
  return 'Healthy';
}

export function calculateBatteryRowStatus(soh: number): 'Healthy' | 'Good' | 'Warning' | 'Critical' {
  if (soh >= 90.0) return 'Healthy';
  if (soh >= 80.0) return 'Good';
  if (soh >= 70.0) return 'Warning';
  return 'Critical';
}

interface RawModelBenchmark {
  model: string;
  chemistry: 'LFP' | 'NMC';
  nominalKwh: number;
  baseSoh: number;
  baseAge: number;
  baseCycles: number;
  baseProblemRate: number;
  baseResistance: number;
  baseImbalance: number;
  baseDegradation: number;
  minCellV: number;
  maxCellV: number;
  thermalVariance: number;
  tempRange: string;
}

const MODEL_BENCHMARKS: RawModelBenchmark[] = [
  {
    model: 'E1',
    chemistry: 'LFP',
    nominalKwh: 30.0,
    baseSoh: 93.1,
    baseAge: 1.4,
    baseCycles: 195,
    baseProblemRate: 4.2,
    baseResistance: 13.8,
    baseImbalance: 9,
    baseDegradation: 0.62,
    minCellV: 3.28,
    maxCellV: 3.32,
    thermalVariance: 2.1,
    tempRange: '22°C - 32°C'
  },
  {
    model: 'E2',
    chemistry: 'LFP',
    nominalKwh: 38.0,
    baseSoh: 91.4,
    baseAge: 1.6,
    baseCycles: 240,
    baseProblemRate: 6.1,
    baseResistance: 14.6,
    baseImbalance: 12,
    baseDegradation: 0.71,
    minCellV: 3.27,
    maxCellV: 3.33,
    thermalVariance: 2.5,
    tempRange: '23°C - 34°C'
  },
  {
    model: 'E3',
    chemistry: 'LFP',
    nominalKwh: 50.0,
    baseSoh: 90.9,
    baseAge: 1.8,
    baseCycles: 290,
    baseProblemRate: 7.5,
    baseResistance: 15.2,
    baseImbalance: 14,
    baseDegradation: 0.78,
    minCellV: 3.26,
    maxCellV: 3.34,
    thermalVariance: 2.8,
    tempRange: '24°C - 36°C'
  },
  {
    model: 'EV 360',
    chemistry: 'NMC',
    nominalKwh: 45.0,
    baseSoh: 86.1,
    baseAge: 2.1,
    baseCycles: 385,
    baseProblemRate: 16.7,
    baseResistance: 21.4,
    baseImbalance: 26,
    baseDegradation: 1.25,
    minCellV: 3.65,
    maxCellV: 3.82,
    thermalVariance: 5.4,
    tempRange: '26°C - 44°C'
  },
  {
    model: 'Model Y Long Range',
    chemistry: 'NMC',
    nominalKwh: 75.0,
    baseSoh: 91.0,
    baseAge: 1.5,
    baseCycles: 210,
    baseProblemRate: 5.0,
    baseResistance: 14.0,
    baseImbalance: 10,
    baseDegradation: 0.68,
    minCellV: 3.72,
    maxCellV: 3.78,
    thermalVariance: 2.2,
    tempRange: '21°C - 33°C'
  }
];

export function getModelHealthMetrics(
  selectedState?: StateData | null, 
  selectedCity?: CityData | null,
  filters?: Partial<BatteryHealthFilters>
): ModelHealthMetric[] {
  // Regional modifier to simulate actual regional battery telemetry variation
  let regionalSohDelta = 0;
  let regionalProblemDelta = 0;

  if (selectedCity) {
    // City specific variance based on avg SoH
    regionalSohDelta = Number(((selectedCity.averageSoh - 90.0) * 0.4).toFixed(1));
    regionalProblemDelta = Number(((90.0 - selectedCity.averageSoh) * 0.5).toFixed(1));
  } else if (selectedState) {
    regionalSohDelta = Number(((selectedState.averageSoh - 90.0) * 0.3).toFixed(1));
    regionalProblemDelta = Number(((90.0 - selectedState.averageSoh) * 0.4).toFixed(1));
  }

  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  return MODEL_BENCHMARKS.map(bm => {
    const avgSoh = Number(Math.max(65.0, Math.min(99.0, bm.baseSoh + regionalSohDelta)).toFixed(1));
    const problemRate = Number(Math.max(1.0, Math.min(45.0, bm.baseProblemRate + regionalProblemDelta)).toFixed(1));
    const retainedKwh = Number(((bm.nominalKwh * avgSoh) / 100).toFixed(1));
    
    // Predicted months to 80% SoH calculation
    const monthlyLoss = (100.0 - avgSoh) / Math.max(1, (bm.baseAge * 12));
    const predictedMonths = avgSoh > 80.0 && monthlyLoss > 0.05 
      ? Math.max(4, Math.round((avgSoh - 80.0) / monthlyLoss))
      : 0;

    const status = calculateStatus(avgSoh, problemRate);

    // Generate monthly historical trend for this model
    const trend = months.map((m, idx) => {
      const step = (months.length - 1 - idx) * 0.35;
      const historySoh = Number(Math.min(99.5, avgSoh + step + (Math.sin(idx + bm.baseCycles) * 0.2)).toFixed(1));
      return { month: m, soh: historySoh };
    });

    return {
      model: bm.model,
      chemistry: bm.chemistry,
      avgSoh,
      nominalCapacityKwh: bm.nominalKwh,
      retainedCapacityKwh: retainedKwh,
      capacityRetentionPercent: avgSoh,
      avgBatteryAgeYears: bm.baseAge,
      avgChargingCycles: bm.baseCycles,
      problemRate,
      avgInternalResistanceMohm: bm.baseResistance,
      cellVoltageImbalanceMv: bm.baseImbalance,
      degradationRatePer100Cycles: bm.baseDegradation,
      predictedMonthsTo80Soh: predictedMonths,
      status,
      minCellVoltage: bm.minCellV,
      maxCellVoltage: bm.maxCellV,
      voltageStdDevMv: Math.round(bm.baseImbalance * 0.45),
      thermalVarianceCelsius: bm.thermalVariance,
      packTempRange: bm.tempRange,
      monthlyTrend: trend
    };
  }).filter(m => {
    if (filters?.models && filters.models.length > 0 && !filters.models.includes(m.model)) {
      return false;
    }
    if (filters?.chemistry && filters.chemistry !== 'ALL' && m.chemistry !== filters.chemistry) {
      return false;
    }
    if (filters?.status && filters.status !== 'ALL') {
      const rowBucket = calculateBatteryRowStatus(m.avgSoh);
      if (rowBucket !== filters.status) return false;
    }
    return true;
  });
}

// Multi-line chart data across 3M, 6M, 12M
export function getModelSohTrends(
  models: ModelHealthMetric[], 
  timeframe: '3M' | '6M' | '12M'
): MonthlyModelSohPoint[] {
  const allMonths = [
    'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 
    'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'
  ];

  const sliceCount = timeframe === '3M' ? 3 : (timeframe === '6M' ? 6 : 12);
  const selectedMonths = allMonths.slice(allMonths.length - sliceCount);

  return selectedMonths.map(month => {
    const point: MonthlyModelSohPoint = { month };
    models.forEach(m => {
      const match = m.monthlyTrend.find(t => t.month === month);
      point[m.model] = match ? match.soh : m.avgSoh;
    });
    return point;
  });
}

// Collect all vehicle records from sales city dataset
export function getAllFleetVehicles(
  selectedState?: StateData | null,
  selectedCity?: CityData | null
): AtRiskBatteryRecord[] {
  const dataset = getSalesCityDataset();
  const records: AtRiskBatteryRecord[] = [];

  dataset.forEach(state => {
    if (selectedState && state.name.toLowerCase() !== selectedState.name.toLowerCase()) {
      return;
    }

    state.cities.forEach(city => {
      if (selectedCity && city.name.toLowerCase() !== selectedCity.name.toLowerCase()) {
        return;
      }

      city.showrooms.forEach(showroom => {
        showroom.vehicles.forEach(v => {
          const chemistry: 'LFP' | 'NMC' = v.batteryType.includes('NMC') ? 'NMC' : 'LFP';
          const latestAsm = v.assessments[0];
          const status = calculateBatteryRowStatus(v.currentSoh);

          records.push({
            vehicleId: v.vehicleId,
            vin: v.vin,
            model: v.model,
            chemistry,
            batteryPackId: v.batteryPackId,
            soh: v.currentSoh,
            capacityKwh: latestAsm ? latestAsm.usableCapacityKwh : Number((v.currentSoh * 0.4).toFixed(1)),
            city: city.name,
            state: state.name,
            showroomName: showroom.name,
            chargeCycles: v.chargeCycles,
            lastAssessmentDate: latestAsm ? latestAsm.assessmentDate : v.saleDate,
            internalResistanceMohm: latestAsm ? latestAsm.internalResistanceMohm : 14.5,
            cellVoltageImbalanceMv: latestAsm ? latestAsm.cellVoltageImbalanceMv : 10,
            status,
            rawVehicleRef: v
          });
        });
      });
    });
  });

  return records;
}

// Compute Distribution Buckets
export function computeHealthDistribution(vehicles: AtRiskBatteryRecord[]): HealthDistributionBucket[] {
  const total = vehicles.length || 1;
  const healthy = vehicles.filter(v => v.soh >= 90.0).length;
  const good = vehicles.filter(v => v.soh >= 80.0 && v.soh < 90.0).length;
  const warning = vehicles.filter(v => v.soh >= 70.0 && v.soh < 80.0).length;
  const critical = vehicles.filter(v => v.soh < 70.0).length;

  return [
    {
      name: 'Healthy (>90%)',
      key: 'healthy',
      count: healthy,
      percentage: Number(((healthy / total) * 100).toFixed(1)),
      color: '#0E8360' // primary forest green
    },
    {
      name: 'Good (80-90%)',
      key: 'good',
      count: good,
      percentage: Number(((good / total) * 100).toFixed(1)),
      color: '#0D9488' // teal green
    },
    {
      name: 'Warning (70-80%)',
      key: 'warning',
      count: warning,
      percentage: Number(((warning / total) * 100).toFixed(1)),
      color: '#F59E0B' // amber
    },
    {
      name: 'Critical (<70%)',
      key: 'critical',
      count: critical,
      percentage: Number(((critical / total) * 100).toFixed(1)),
      color: '#DC2626' // red
    }
  ];
}

// Compute 4 KPI summary cards
export interface KpiCardData {
  title: string;
  value: string;
  changeText: string;
  isPositive: boolean; // positive meaning healthy trend (e.g. higher SoH = good, lower problem rate = good)
  sparkline: number[];
}

export function computeBatteryHealthKpis(vehicles: AtRiskBatteryRecord[]): {
  fleetAvgSoh: KpiCardData;
  totalBatteries: KpiCardData;
  below80Count: KpiCardData;
  problemRate: KpiCardData;
} {
  const count = vehicles.length;
  if (count === 0) {
    return {
      fleetAvgSoh: { title: 'Fleet Average SoH', value: '90.2%', changeText: '+0.3% vs last mo', isPositive: true, sparkline: [89.1, 89.4, 89.8, 90.0, 90.1, 90.2] },
      totalBatteries: { title: 'Total Batteries Monitored', value: '0', changeText: '+0 new', isPositive: true, sparkline: [0, 0, 0, 0, 0, 0] },
      below80Count: { title: 'Batteries Below 80% SoH', value: '0', changeText: '0% of fleet', isPositive: true, sparkline: [0, 0, 0, 0, 0, 0] },
      problemRate: { title: 'Overall Problem Rate', value: '0.0%', changeText: '0% issues', isPositive: true, sparkline: [0, 0, 0, 0, 0, 0] }
    };
  }

  const avgSohNum = Number((vehicles.reduce((acc, v) => acc + v.soh, 0) / count).toFixed(1));
  const below80 = vehicles.filter(v => v.soh < 80.0).length;
  const below80Pct = Number(((below80 / count) * 100).toFixed(1));
  const problemCount = vehicles.filter(v => v.status === 'Warning' || v.status === 'Critical').length;
  const overallProbRate = Number(((problemCount / count) * 100).toFixed(1));

  return {
    fleetAvgSoh: {
      title: 'Fleet Average SoH',
      value: `${avgSohNum}%`,
      changeText: '+0.4% vs last mo',
      isPositive: true,
      sparkline: [avgSohNum - 1.2, avgSohNum - 0.9, avgSohNum - 0.7, avgSohNum - 0.4, avgSohNum - 0.1, avgSohNum]
    },
    totalBatteries: {
      title: 'Total Batteries Monitored',
      value: count.toLocaleString(),
      changeText: `+${Math.max(1, Math.round(count * 0.04))} vs last mo`,
      isPositive: true,
      sparkline: [count - 18, count - 14, count - 11, count - 7, count - 3, count]
    },
    below80Count: {
      title: 'Batteries Below 80% SoH',
      value: below80.toString(),
      changeText: `${below80Pct}% of monitored fleet`,
      isPositive: below80Pct < 10,
      sparkline: [below80 + 3, below80 + 2, below80 + 2, below80 + 1, below80, below80]
    },
    problemRate: {
      title: 'Overall Problem Rate',
      value: `${overallProbRate}%`,
      changeText: '-0.6% vs last mo',
      isPositive: true,
      sparkline: [overallProbRate + 1.2, overallProbRate + 0.9, overallProbRate + 0.7, overallProbRate + 0.3, overallProbRate]
    }
  };
}

// Generate CSV export string for model table and at-risk battery logs
export function exportBatteryHealthCsv(
  models: ModelHealthMetric[],
  atRiskList: AtRiskBatteryRecord[]
): string {
  const lines: string[] = [];

  // Section 1: Models
  lines.push('--- BATTERY HEALTH COMPARATIVE METRICS BY MODEL ---');
  lines.push('Model,Chemistry,Average SoH (%),Retained Capacity (kWh),Nominal Capacity (kWh),Internal Resistance (mOhm),Cell Imbalance (mV),Degradation Rate (%/100c),Predicted Months to 80%,Problem Rate (%),Health Status');
  models.forEach(m => {
    lines.push(`"${m.model}","${m.chemistry}",${m.avgSoh},${m.retainedCapacityKwh},${m.nominalCapacityKwh},${m.avgInternalResistanceMohm},${m.cellVoltageImbalanceMv},${m.degradationRatePer100Cycles},${m.predictedMonthsTo80Soh},${m.problemRate},"${m.status}"`);
  });

  lines.push('');
  // Section 2: Individual Vehicles
  lines.push('--- AT-RISK & MONITORED FLEET BATTERY LOGS ---');
  lines.push('Vehicle ID,VIN,Model,Chemistry,Battery Pack ID,Current SoH (%),City,State,Showroom,Cycles,Last Assessment Date,Resistance (mOhm),Imbalance (mV),Status');
  atRiskList.forEach(v => {
    lines.push(`"${v.vehicleId}","${v.vin}","${v.model}","${v.chemistry}","${v.batteryPackId}",${v.soh},"${v.city}","${v.state}","${v.showroomName}",${v.chargeCycles},"${v.lastAssessmentDate}",${v.internalResistanceMohm},${v.cellVoltageImbalanceMv},"${v.status}"`);
  });

  return lines.join('\n');
}

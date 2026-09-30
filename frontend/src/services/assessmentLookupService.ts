import { getSalesCityDataset } from './salesCityData';

export interface UnifiedBatteryAssessment {
  id: string | number;
  assessmentDate: string; // ISO string
  formattedDate: string;
  soh: number; // e.g. 88.4
  healthStatus: 'Healthy' | 'Good' | 'Warning' | 'Critical';
  nominalCapacityKwh: number; // e.g. 45.0
  usableCapacityKwh: number; // e.g. 39.78
  degradationPercent: number; // e.g. 11.6%
  chargeCycles: number;
  chargingSplit: {
    normalPercentage: number;
    fastPercentage: number;
    label: string;
  };
  temperature: {
    avgCelsius: number;
    peakCelsius?: number;
    status: 'Optimal' | 'Normal' | 'Elevated' | 'Overheating';
  };
  safetyScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  batteryHealthScore: number; // 0 - 100
  keyFactors: string[];
  recommendations: string[];
  overallResult: 'PASS' | 'WARNING' | 'FAIL';
  condition: string;
  odometerKm?: number;
  batteryAgeYears?: number;
  internalResistanceMohm?: number;
  cellVoltageImbalanceMv?: number;
  dtcCodes?: string[];
  explanation?: string;
  raw?: any;
}

export interface VehicleAssessmentHistoryResult {
  vin: string;
  vehicleModel: string;
  manufacturer: string;
  vehicleType: string;
  allAssessments: UnifiedBatteryAssessment[];
  priorAssessments: UnifiedBatteryAssessment[]; // strictly before complaint date
  latestPriorAssessment: UnifiedBatteryAssessment | null;
  complaintDate?: string;
}

function determineHealthStatus(soh: number): 'Healthy' | 'Good' | 'Warning' | 'Critical' {
  if (soh >= 90.0) return 'Healthy';
  if (soh >= 80.0) return 'Good';
  if (soh >= 70.0) return 'Warning';
  return 'Critical';
}

function determineTempStatus(avgTemp: number): 'Optimal' | 'Normal' | 'Elevated' | 'Overheating' {
  if (avgTemp < 28) return 'Optimal';
  if (avgTemp <= 35) return 'Normal';
  if (avgTemp <= 42) return 'Elevated';
  return 'Overheating';
}

function deriveKeyFactors(a: any, soh: number, usableCap: number, nominalCap: number, avgTemp: number, cycles: number, fastPct: number): string[] {
  const factors: string[] = [];
  
  if (fastPct >= 30) {
    factors.push(`High DC Fast Charging ratio (${fastPct}%) accelerating anode stress`);
  } else {
    factors.push(`Controlled AC charging dominance (${100 - fastPct}% standard AC cycles)`);
  }

  if (avgTemp >= 35) {
    factors.push(`Elevated operating temperature (${avgTemp.toFixed(1)}°C) contributing to thermal aging`);
  } else {
    factors.push(`Optimal thermal operating range (${avgTemp.toFixed(1)}°C pack baseline)`);
  }

  if (cycles > 150) {
    factors.push(`Cumulative cycle throughput (${cycles} equivalent full cycles completed)`);
  } else {
    factors.push(`Low cycle accumulation (${cycles} total charge cycles)`);
  }

  const deg = Number((100 - soh).toFixed(1));
  if (deg > 10) {
    factors.push(`Capacity retention delta of -${deg}% (${usableCap} kWh usable of ${nominalCap} kWh factory rating)`);
  }

  if (a.cellVoltageImbalanceMv && a.cellVoltageImbalanceMv > 15) {
    factors.push(`Cell pack imbalance variance measured at ${a.cellVoltageImbalanceMv} mV`);
  }

  if (factors.length === 0) {
    factors.push('Normal operational wear within expected battery degradation parameters');
  }

  return factors;
}

function deriveRecommendations(soh: number, fastPct: number, avgTemp: number, result: string, explanation?: string): string[] {
  const recs: string[] = [];

  if (soh < 85) {
    recs.push('Limit daily state-of-charge (SoC) ceiling to 80% to curtail accelerated degradation');
  }

  if (fastPct > 25) {
    recs.push('Reduce consecutive DC fast-charging sessions and prioritize standard overnight AC charging');
  }

  if (avgTemp > 33) {
    recs.push('Inspect battery thermal management loop coolant flow rate and BMS radiator fans');
  }

  if (result === 'WARNING' || result === 'FAIL' || soh < 80) {
    recs.push('Schedule authorized service center cell impedance balancing calibration');
  } else {
    recs.push('Continue standard preventive maintenance schedule; next inspection in 6 months');
  }

  if (explanation && explanation.toLowerCase().includes('recommendation:')) {
    const parts = explanation.split(/recommendation:/i);
    if (parts[1]) {
      recs.unshift(parts[1].trim());
    }
  }

  return recs;
}

export async function fetchVehicleAssessmentsForComplaint(
  vin: string,
  complaintDateStr?: string,
  complaintModel?: string,
  complaintManufacturer?: string
): Promise<VehicleAssessmentHistoryResult> {
  const cleanVin = (vin || '').trim();
  let vehicleModel = complaintModel || 'EV 360';
  let manufacturer = complaintManufacturer || 'EV Company';
  let vehicleType = 'ELECTRIC_CAR';
  let rawAssessments: any[] = [];

  // 1. Try Backend API for company vehicle details
  if (cleanVin) {
    try {
      const res = await fetch(`http://localhost:8080/api/company/vehicles/${encodeURIComponent(cleanVin)}`, {
        headers: { 'X-User-Email': 'admin' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.model) vehicleModel = data.model;
        if (data.manufacturer) manufacturer = data.manufacturer;
        if (data.vehicleType) vehicleType = data.vehicleType;
        if (Array.isArray(data.assessments) && data.assessments.length > 0) {
          rawAssessments = data.assessments;
        }
      }
    } catch {
      // Backend request failed, will check fallback
    }
  }

  // 2. Fallback to Sales City Dataset (569 vehicles with complete assessment timelines)
  if (rawAssessments.length === 0 && cleanVin) {
    try {
      const dataset = getSalesCityDataset();
      const lowerVin = cleanVin.toLowerCase();
      
      let foundSoldVehicle: any = null;
      for (const st of dataset) {
        for (const city of st.cities) {
          for (const sh of city.showrooms) {
            const v = sh.vehicles.find(item => 
              item.vin.toLowerCase() === lowerVin || 
              item.vehicleId.toLowerCase() === lowerVin
            );
            if (v) {
              foundSoldVehicle = v;
              break;
            }
          }
          if (foundSoldVehicle) break;
        }
        if (foundSoldVehicle) break;
      }

      if (foundSoldVehicle) {
        vehicleModel = foundSoldVehicle.model || vehicleModel;
        vehicleType = foundSoldVehicle.batteryType || vehicleType;
        if (foundSoldVehicle.assessments && Array.isArray(foundSoldVehicle.assessments)) {
          rawAssessments = foundSoldVehicle.assessments.map((a: any) => ({
            id: a.id,
            createdAt: a.assessmentDate,
            soh: a.soh,
            originalCapacity: a.originalCapacityKwh,
            currentUsableCapacity: a.usableCapacityKwh,
            chargingCycles: a.chargeCycles,
            averageTemperature: a.avgTempCelsius,
            odometer: a.odometerKm,
            condition: a.result === 'PASS' ? 'Good' : (a.result === 'WARNING' ? 'Moderate' : 'Critical'),
            safetyScore: Math.round(a.soh * 0.95),
            riskLevel: a.result === 'PASS' ? 'LOW' : (a.result === 'WARNING' ? 'MEDIUM' : 'HIGH'),
            confidenceScore: 95.0,
            explanation: a.remarks || 'Standard service center assessment protocol executed.',
            cellVoltageImbalanceMv: a.cellVoltageImbalanceMv,
            internalResistanceMohm: a.internalResistanceMohm,
            normalChargingPercentage: 75,
            fastChargingPercentage: 25,
            result: a.result
          }));
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  // 3. Fallback mock for standard VIN-1001 if offline or empty
  if (rawAssessments.length === 0 && cleanVin.toUpperCase().includes('1001')) {
    rawAssessments = [
      {
        id: 'VIN1001-A1',
        createdAt: '2026-04-15T10:30:00Z',
        soh: 94.8,
        originalCapacity: 45.0,
        currentUsableCapacity: 42.66,
        chargingCycles: 112,
        averageTemperature: 26.5,
        odometer: 14500,
        condition: 'Excellent',
        safetyScore: 95,
        riskLevel: 'LOW',
        normalChargingPercentage: 80,
        fastChargingPercentage: 20,
        explanation: 'Routine preventive maintenance assessment. Cell voltage distribution tightly matched (9 mV delta). Thermal dissipation optimal.'
      },
      {
        id: 'VIN1001-A2',
        createdAt: '2026-08-22T14:45:00Z',
        soh: 88.4,
        originalCapacity: 45.0,
        currentUsableCapacity: 39.78,
        chargingCycles: 198,
        averageTemperature: 33.2,
        odometer: 21800,
        condition: 'Good',
        safetyScore: 87,
        riskLevel: 'LOW',
        normalChargingPercentage: 65,
        fastChargingPercentage: 35,
        explanation: 'Pre-complaint evaluation. Usable capacity dropped 6.4% over recent high-speed driving period. Elevated fast-charging frequency noted with mild thermal rise during peak load.'
      }
    ];
  }

  // 4. Normalize raw assessments into UnifiedBatteryAssessment
  const normalizedAssessments: UnifiedBatteryAssessment[] = rawAssessments.map((a: any, idx: number) => {
    const dateStr = a.createdAt || a.assessmentDate || new Date().toISOString();
    const parsedDate = new Date(dateStr);
    const formattedDate = isNaN(parsedDate.getTime()) 
      ? 'Recent' 
      : parsedDate.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

    const soh = Number((a.soh ?? 85.0).toFixed(1));
    const nominalCap = Number((a.originalCapacity ?? 45.0).toFixed(1));
    const usableCap = Number((a.currentUsableCapacity ?? (nominalCap * (soh / 100))).toFixed(2));
    const degradation = Number(Math.max(0, 100 - soh).toFixed(1));
    const cycles = a.chargingCycles ?? a.chargeCycles ?? 120;
    const normPct = a.normalChargingPercentage ?? 75;
    const fastPct = a.fastChargingPercentage ?? (100 - normPct);
    const avgTemp = Number((a.averageTemperature ?? a.avgTempCelsius ?? 28.5).toFixed(1));
    const peakTemp = a.peakTempCelsius ?? Number((avgTemp + 5.2).toFixed(1));
    const safety = a.safetyScore ?? Math.round(100 - (100 - soh) * 0.85);
    const risk = a.riskLevel || (safety >= 85 ? 'LOW' : (safety >= 65 ? 'MEDIUM' : 'HIGH'));
    const resultStatus: 'PASS' | 'WARNING' | 'FAIL' = a.result 
      ? a.result 
      : (soh >= 85 ? 'PASS' : (soh >= 75 ? 'WARNING' : 'FAIL'));

    return {
      id: a.id || `ASSESS-${idx}`,
      assessmentDate: dateStr,
      formattedDate,
      soh,
      healthStatus: determineHealthStatus(soh),
      nominalCapacityKwh: nominalCap,
      usableCapacityKwh: usableCap,
      degradationPercent: degradation,
      chargeCycles: cycles,
      chargingSplit: {
        normalPercentage: normPct,
        fastPercentage: fastPct,
        label: `${normPct}% AC Normal / ${fastPct}% Fast DC`
      },
      temperature: {
        avgCelsius: avgTemp,
        peakCelsius: peakTemp,
        status: determineTempStatus(avgTemp)
      },
      safetyScore: Math.max(0, Math.min(100, safety)),
      riskLevel: risk,
      batteryHealthScore: Math.round(soh),
      keyFactors: deriveKeyFactors(a, soh, usableCap, nominalCap, avgTemp, cycles, fastPct),
      recommendations: deriveRecommendations(soh, fastPct, avgTemp, resultStatus, a.explanation),
      overallResult: resultStatus,
      condition: a.condition || (soh >= 90 ? 'Excellent' : (soh >= 80 ? 'Good' : 'Moderate')),
      odometerKm: a.odometer ?? a.odometerKm,
      batteryAgeYears: a.batteryAge,
      internalResistanceMohm: a.internalResistanceMohm,
      cellVoltageImbalanceMv: a.cellVoltageImbalanceMv,
      dtcCodes: a.dtcCodes,
      explanation: a.explanation,
      raw: a
    };
  });

  // Sort all chronologically descending (newest first)
  normalizedAssessments.sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime());

  // 5. Filter strictly before complaint date
  let priorAssessments = [...normalizedAssessments];
  if (complaintDateStr) {
    const cTime = new Date(complaintDateStr).getTime();
    if (!isNaN(cTime)) {
      priorAssessments = normalizedAssessments.filter(a => {
        const aTime = new Date(a.assessmentDate).getTime();
        return !isNaN(aTime) && aTime <= cTime;
      });
    }
  }

  const latestPriorAssessment = priorAssessments.length > 0 ? priorAssessments[0] : null;

  return {
    vin: cleanVin,
    vehicleModel,
    manufacturer,
    vehicleType,
    allAssessments: normalizedAssessments,
    priorAssessments,
    latestPriorAssessment,
    complaintDate: complaintDateStr
  };
}

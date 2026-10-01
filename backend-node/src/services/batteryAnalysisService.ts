import { query } from '../config/db.js';
import { BatteryAnalysis, Vehicle, User } from '../types/index.js';

function round(val: number, places: number): number {
  if (Number.isNaN(val) || !Number.isFinite(val)) return 0.0;
  const factor = Math.pow(10, places);
  return Math.round(val * factor) / factor;
}

function generateUniqueVehicleId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EV-${year}-${rand}`;
}

function calculateConfidence(input: Partial<BatteryAnalysis>): number {
  let score = 0.0;

  if (input.manufacturer && input.manufacturer.trim().length > 0 && input.model && input.model.trim().length > 0) {
    score += 15.0;
  }
  if (input.batteryAge && input.batteryAge > 0) {
    score += 10.0;
  }
  if (input.odometer && input.odometer > 0) {
    score += 15.0;
  }
  if (
    input.originalCapacity &&
    input.originalCapacity > 0 &&
    input.currentUsableCapacity &&
    input.currentUsableCapacity > 0
  ) {
    score += 20.0;
  }
  if (input.chargingCycles && input.chargingCycles > 0) {
    score += 15.0;
  }
  if (input.averageTemperature != null) {
    score += 10.0;
  }
  if (input.normalChargingPercentage != null && input.fastChargingPercentage != null) {
    const total = input.normalChargingPercentage + input.fastChargingPercentage;
    if (Math.abs(total - 100.0) < 1.0) {
      score += 15.0;
    } else if (total > 0) {
      score += 5.0;
    }
  }

  return round(score, 1);
}

function generateExplanation(
  input: Partial<BatteryAnalysis>,
  soh: number,
  capacityLoss: number,
  condition: string
): string {
  const parts: string[] = [];

  parts.push(`Estimated Battery Health is ${soh}% (Condition: ${condition}). `);
  parts.push(
    `The pack has lost ${capacityLoss} kWh of its original ${input.originalCapacity} kWh usable capacity, meaning it is currently operating at ${input.currentUsableCapacity} kWh. `
  );

  const annualOdo = input.batteryAge && input.batteryAge > 0 ? (input.odometer || 0) / input.batteryAge : 0;
  const cyclesPerYear = input.batteryAge && input.batteryAge > 0 ? (input.chargingCycles || 0) / input.batteryAge : 0;

  parts.push(
    `With an odometer reading of ${(input.odometer || 0).toLocaleString()} km over ${input.batteryAge} years, the vehicle averages ${Math.round(annualOdo).toLocaleString()} km annually. `
  );
  parts.push(
    `The battery has experienced ${input.chargingCycles} charging cycles (approx. ${Math.round(cyclesPerYear)} cycles/year). `
  );

  const expectedLossPerYear = 2.0;
  const actualLossPerYear = input.batteryAge && input.batteryAge > 0 ? (100.0 - soh) / input.batteryAge : 0;

  if (actualLossPerYear > expectedLossPerYear + 1.0) {
    parts.push('This degradation rate is higher than average, which can be linked to external factors. ');
  } else if (actualLossPerYear < expectedLossPerYear - 0.5) {
    parts.push('This represents an exceptionally low degradation rate, indicating excellent battery health management. ');
  } else {
    parts.push('This is well within normal engineering expectations for lithium-ion battery chemistry. ');
  }

  if ((input.fastChargingPercentage || 0) > 40.0) {
    parts.push(
      `The high utilization of DC Fast Charging (${input.fastChargingPercentage}%) is a primary stress factor. Frequent rapid charging subjects the cells to elevated thermal levels and higher current density, accelerating capacity fade. `
    );
  } else {
    parts.push(
      `Your charging profile is highly favorable, with ${input.normalChargingPercentage}% of charging completed on normal AC levels. Minimizing rapid charging is helping prevent micro-cracking and lithium plating on the anodes. `
    );
  }

  const avgTemp = input.averageTemperature || 25.0;
  if (avgTemp > 30.0) {
    parts.push(
      `The average battery temperature of ${avgTemp.toFixed(1)}°C is elevated. High ambient and operational temperatures promote secondary chemical reactions that consume active lithium, leading to faster permanent capacity loss. `
    );
  } else if (avgTemp < 10.0) {
    parts.push(
      `Operating in a cold climate (average ${avgTemp.toFixed(1)}°C) temporarily decreases lithium ion mobility and reduces range, but helps retard long-term chemical aging of the cell pack. `
    );
  } else {
    parts.push(
      `The average operating temperature of ${avgTemp.toFixed(1)}°C is in the sweet spot (15°C - 25°C), preventing thermal degradation. `
    );
  }

  if (soh < 75.0) {
    parts.push(
      'Recommendation: Schedule a professional dealer diagnostic. Consider adjusting the maximum charge limit to 80% and avoid discharging below 10% to stabilize health.'
    );
  } else if (soh < 85.0) {
    parts.push(
      'Recommendation: To maximize battery life, keep the daily charge limit set to 80%, avoid leaving the car at 100% State of Charge in hot weather, and use normal AC charging where possible.'
    );
  } else {
    parts.push(
      'Recommendation: Continue standard battery management. The battery chemistry is in healthy condition. Standard charging limits (up to 80%-90% daily) are recommended.'
    );
  }

  return parts.join('');
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class BatteryAnalysisService {
  validateAnalysisInput(input: any): ValidationResult {
    const errors: string[] = [];

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return {
        valid: false,
        errors: ['Request body must be a valid JSON object']
      };
    }

    const isNullOrEmpty = (v: any) =>
      v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

    // 1. Manufacturer
    if (isNullOrEmpty(input.manufacturer)) {
      errors.push('Manufacturer is required');
    } else if (typeof input.manufacturer !== 'string' || input.manufacturer.trim().length === 0) {
      errors.push('Manufacturer must be a non-empty string');
    }

    // 2. Model
    if (isNullOrEmpty(input.model)) {
      errors.push('Model is required');
    } else if (typeof input.model !== 'string' || input.model.trim().length === 0) {
      errors.push('Model must be a non-empty string');
    }

    // 3. Battery Age
    const batteryAge = input.batteryAge ?? input.battery_age;
    if (isNullOrEmpty(batteryAge)) {
      errors.push('Battery age is required');
    } else {
      const age = Number(batteryAge);
      if (!Number.isFinite(age) || age < 0) {
        errors.push('Battery age must be a positive number');
      }
    }

    // 4. Odometer
    const odometer = input.odometer;
    if (isNullOrEmpty(odometer)) {
      errors.push('Odometer is required');
    } else {
      const odo = Number(odometer);
      if (!Number.isFinite(odo) || odo < 0) {
        errors.push('Odometer must be a positive number');
      }
    }

    // 5. Original Capacity
    const origCap = input.originalCapacity ?? input.original_capacity;
    let validOrigCap: number | null = null;
    if (isNullOrEmpty(origCap)) {
      errors.push('Original capacity is required');
    } else {
      const cap = Number(origCap);
      if (!Number.isFinite(cap) || cap <= 0) {
        errors.push('Original capacity must be positive');
      } else {
        validOrigCap = cap;
      }
    }

    // 6. Current Usable Capacity
    const usableCap = input.currentUsableCapacity ?? input.current_usable_capacity;
    let validUsableCap: number | null = null;
    if (isNullOrEmpty(usableCap)) {
      errors.push('Current usable capacity is required');
    } else {
      const cap = Number(usableCap);
      if (!Number.isFinite(cap) || cap <= 0) {
        errors.push('Current usable capacity must be positive');
      } else {
        validUsableCap = cap;
      }
    }

    if (validOrigCap !== null && validUsableCap !== null && validUsableCap > validOrigCap) {
      errors.push('Current usable capacity cannot exceed original capacity');
    }

    // 7. Current Battery Percentage
    const currentBatteryPercentage = input.currentBatteryPercentage ?? input.current_battery_percentage;
    if (isNullOrEmpty(currentBatteryPercentage)) {
      errors.push('Current battery % is required');
    } else {
      const pct = Number(currentBatteryPercentage);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        errors.push('Current battery % must be between 0 and 100');
      }
    }

    // 8. Charging Cycles
    const chargingCycles = input.chargingCycles ?? input.charging_cycles;
    if (isNullOrEmpty(chargingCycles)) {
      errors.push('Charging cycles is required');
    } else {
      const cycles = Number(chargingCycles);
      if (!Number.isFinite(cycles) || cycles < 0) {
        errors.push('Charging cycles must be positive');
      }
    }

    // 9. Average Temperature
    const avgTemp = input.averageTemperature ?? input.average_temperature;
    if (isNullOrEmpty(avgTemp)) {
      errors.push('Average temperature is required');
    } else {
      const temp = Number(avgTemp);
      if (!Number.isFinite(temp)) {
        errors.push('Average temperature must be a valid number');
      }
    }

    // 10. Average Range
    const avgRange = input.averageRange ?? input.average_range;
    if (isNullOrEmpty(avgRange)) {
      errors.push('Average range is required');
    } else {
      const range = Number(avgRange);
      if (!Number.isFinite(range) || range < 0) {
        errors.push('Average range must be positive');
      }
    }

    // 11. Normal Charging Percentage
    const normChg = input.normalChargingPercentage ?? input.normal_charging_percentage;
    if (isNullOrEmpty(normChg)) {
      errors.push('Normal charging % is required');
    } else {
      const norm = Number(normChg);
      if (!Number.isFinite(norm) || norm < 0 || norm > 100) {
        errors.push('Normal charging % must be between 0 and 100');
      }
    }

    // 12. Fast Charging Percentage
    const fastChg = input.fastChargingPercentage ?? input.fast_charging_percentage;
    if (isNullOrEmpty(fastChg)) {
      errors.push('Fast charging % is required');
    } else {
      const fast = Number(fastChg);
      if (!Number.isFinite(fast) || fast < 0 || fast > 100) {
        errors.push('Fast charging % must be between 0 and 100');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async analyzeAndSave(input: Record<string, any>, userEmail?: string): Promise<BatteryAnalysis> {
    const safeNum = (val: any, fallback: number = 0): number => {
      const n = Number(val);
      return Number.isFinite(n) ? n : fallback;
    };
    const safeInt = (val: any, fallback: number = 0): number => {
      const n = parseInt(String(val), 10);
      return Number.isFinite(n) ? n : fallback;
    };

    // 0. Resolve user
    let user: User | null = null;
    if (userEmail && userEmail.trim().length > 0 && userEmail.trim().toLowerCase() !== 'admin') {
      const uRes = await query('SELECT * FROM users WHERE LOWER(gmail) = $1', [userEmail.trim().toLowerCase()]);
      if (uRes.rows.length > 0) {
        user = uRes.rows[0];
      }
    }

    let vehicle: any;
    const inVehicleId = (input.vehicleId || input.vehicle_id || '').trim();

    if (inVehicleId.length > 0) {
      const vRes = await query('SELECT * FROM vehicles WHERE LOWER(vehicle_id) = $1', [inVehicleId.toLowerCase()]);
      if (vRes.rows.length > 0) {
        vehicle = vRes.rows[0];
        // Check ownership
        if (vehicle.user_id && user && vehicle.user_id !== user.id) {
          throw new Error('Vehicle is registered to another user.');
        }
        if (!vehicle.user_id && user) {
          await query('UPDATE vehicles SET user_id = $1 WHERE id = $2', [user.id, vehicle.id]);
          vehicle.user_id = user.id;
        }

        // Fetch latest prev assessment for deltas
        const prevRes = await query(
          'SELECT * FROM battery_analyses WHERE LOWER(vehicle_id) = $1 ORDER BY created_at ASC',
          [inVehicleId.toLowerCase()]
        );
        if (prevRes.rows.length > 0) {
          const latestPrev = prevRes.rows[prevRes.rows.length - 1];
          const curCap = safeNum(input.currentUsableCapacity ?? input.current_usable_capacity, 0);
          const origCap = safeNum(input.originalCapacity ?? input.original_capacity, 1);
          const curOdo = safeNum(input.odometer, 0);
          const curCycles = safeInt(input.chargingCycles ?? input.charging_cycles, 0);
          const curRange = safeNum(input.averageRange ?? input.average_range, 0);
          const curAge = safeNum(input.batteryAge ?? input.battery_age, 0);

          input.usable_capacity_change = round(curCap - safeNum(latestPrev.current_usable_capacity, 0), 2);
          input.soh_change = round((origCap > 0 ? (curCap / origCap) * 100.0 : 0) - safeNum(latestPrev.soh, 0), 2);
          input.odometer_change = round(curOdo - safeNum(latestPrev.odometer, 0), 2);
          input.cycles_change = curCycles - safeInt(latestPrev.charging_cycles, 0);
          input.range_change = round(curRange - safeNum(latestPrev.average_range, 0), 2);
          input.age_change = round(curAge - safeNum(latestPrev.battery_age, 0), 2);
        }
      } else {
        const vType = input.vehicleType || input.vehicle_type || 'car';
        const mfg = input.manufacturer || '';
        const mdl = input.model || '';
        const vIns = await query(
          'INSERT INTO vehicles (vehicle_id, vehicle_type, manufacturer, model, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [inVehicleId, vType, mfg, mdl, user ? user.id : null]
        );
        vehicle = vIns.rows[0];
      }
    } else {
      let genId: string;
      while (true) {
        genId = generateUniqueVehicleId();
        const chk = await query('SELECT id FROM vehicles WHERE vehicle_id = $1', [genId]);
        if (chk.rows.length === 0) break;
      }
      const vType = input.vehicleType || input.vehicle_type || 'car';
      const mfg = input.manufacturer || '';
      const mdl = input.model || '';
      const vIns = await query(
        'INSERT INTO vehicles (vehicle_id, vehicle_type, manufacturer, model, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [genId, vType, mfg, mdl, user ? user.id : null]
      );
      vehicle = vIns.rows[0];
    }

    // Normalized input fields
    const origCap = safeNum(input.originalCapacity ?? input.original_capacity, 0);
    const usableCap = safeNum(input.currentUsableCapacity ?? input.current_usable_capacity, 0);
    const batteryAge = safeNum(input.batteryAge ?? input.battery_age, 0);
    const odometer = safeNum(input.odometer, 0);
    const batteryPct = safeNum(input.currentBatteryPercentage ?? input.current_battery_percentage, 80);
    const cycles = safeInt(input.chargingCycles ?? input.charging_cycles, 0);
    const avgTemp = safeNum(input.averageTemperature ?? input.average_temperature, 25);
    const avgRange = safeNum(input.averageRange ?? input.average_range, 0);
    const normChg = safeNum(input.normalChargingPercentage ?? input.normal_charging_percentage, 80);
    const fastChg = safeNum(input.fastChargingPercentage ?? input.fast_charging_percentage, 20);

    // 1. SoH
    const rawSoh = origCap > 0 ? (usableCap / origCap) * 100.0 : 0;
    let soh = round(rawSoh, 2);
    soh = Math.min(100.0, Math.max(0.0, soh));

    // 2. Capacity loss
    const capLoss = Math.max(0.0, round(origCap - usableCap, 2));

    // 3. Condition
    let condition = 'Excellent';
    if (soh < 70.0) condition = 'Degraded';
    else if (soh < 80.0) condition = 'Moderate';
    else if (soh < 90.0) condition = 'Good';

    // 4. Confidence
    const confidence = calculateConfidence({
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      batteryAge,
      odometer,
      originalCapacity: origCap,
      currentUsableCapacity: usableCap,
      chargingCycles: cycles,
      averageTemperature: avgTemp,
      normalChargingPercentage: normChg,
      fastChargingPercentage: fastChg
    });

    // 4.5. Safety & Risk
    let safety = 100.0;
    if (avgTemp > 35) safety -= (avgTemp - 35) * 2.0;
    if (fastChg > 50) safety -= (fastChg - 50) * 0.3;
    if (soh < 100.0) safety -= (100.0 - soh) * 1.0;
    if (cycles > 1000) safety -= (cycles - 1000) / 100.0;
    const safetyScore = Math.max(0, Math.min(100, Math.round(safety)));
    const riskLevel = safetyScore >= 85 ? 'LOW' : safetyScore >= 65 ? 'MEDIUM' : 'HIGH';

    // 5. Explanation
    const explanation = generateExplanation(
      {
        originalCapacity: origCap,
        currentUsableCapacity: usableCap,
        batteryAge,
        odometer,
        chargingCycles: cycles,
        normalChargingPercentage: normChg,
        fastChargingPercentage: fastChg,
        averageTemperature: avgTemp
      },
      soh,
      capLoss,
      condition
    );

    const insertRes = await query(
      `INSERT INTO battery_analyses 
        (vehicle_id, vehicle_db_id, vehicle_type, manufacturer, model, battery_age, odometer, 
         original_capacity, current_usable_capacity, current_battery_percentage, charging_cycles, 
         average_temperature, average_range, normal_charging_percentage, fast_charging_percentage, 
         soh, capacity_loss, condition, confidence_score, safety_score, risk_level, explanation, 
         soh_change, usable_capacity_change, odometer_change, cycles_change, range_change, age_change)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
       RETURNING *`,
      [
        vehicle.vehicle_id,
        vehicle.id,
        vehicle.vehicle_type,
        vehicle.manufacturer,
        vehicle.model,
        safeNum(batteryAge, 0),
        safeNum(odometer, 0),
        safeNum(origCap, 0),
        safeNum(usableCap, 0),
        safeNum(batteryPct, 80),
        safeInt(cycles, 0),
        safeNum(avgTemp, 25),
        safeNum(avgRange, 0),
        safeNum(normChg, 80),
        safeNum(fastChg, 20),
        safeNum(soh, 0),
        safeNum(capLoss, 0),
        condition,
        safeNum(confidence, 100),
        safeInt(safetyScore, 90),
        riskLevel,
        explanation,
        safeNum(input.soh_change, 0),
        safeNum(input.usable_capacity_change, 0),
        safeNum(input.odometer_change, 0),
        safeInt(input.cycles_change, 0),
        safeNum(input.range_change, 0),
        safeNum(input.age_change, 0)
      ]
    );

    return this.mapAnalysisRow(insertRes.rows[0]);
  }

  async getHistory(userEmail?: string): Promise<BatteryAnalysis[]> {
    if (!userEmail || userEmail.trim().length === 0 || userEmail.trim().toLowerCase() === 'admin') {
      const res = await query('SELECT * FROM battery_analyses ORDER BY created_at ASC');
      return res.rows.map(this.mapAnalysisRow);
    }
    const res = await query(
      `SELECT a.* FROM battery_analyses a
       JOIN vehicles v ON a.vehicle_id = v.vehicle_id
       JOIN users u ON v.user_id = u.id
       WHERE LOWER(u.gmail) = $1
       ORDER BY a.created_at ASC`,
      [userEmail.trim().toLowerCase()]
    );
    return res.rows.map(this.mapAnalysisRow);
  }

  async getHistoryByModel(userEmail: string | undefined, manufacturer: string, model: string): Promise<BatteryAnalysis[]> {
    if (!userEmail || userEmail.trim().length === 0 || userEmail.trim().toLowerCase() === 'admin') {
      const res = await query(
        'SELECT * FROM battery_analyses WHERE LOWER(manufacturer) = $1 AND LOWER(model) = $2 ORDER BY created_at ASC',
        [manufacturer.trim().toLowerCase(), model.trim().toLowerCase()]
      );
      return res.rows.map(this.mapAnalysisRow);
    }
    const res = await query(
      `SELECT a.* FROM battery_analyses a
       JOIN vehicles v ON a.vehicle_id = v.vehicle_id
       JOIN users u ON v.user_id = u.id
       WHERE LOWER(u.gmail) = $1 AND LOWER(a.manufacturer) = $2 AND LOWER(a.model) = $3
       ORDER BY a.created_at ASC`,
      [userEmail.trim().toLowerCase(), manufacturer.trim().toLowerCase(), model.trim().toLowerCase()]
    );
    return res.rows.map(this.mapAnalysisRow);
  }

  async findVehicleByVehicleId(vehicleId: string, userEmail?: string): Promise<Vehicle | null> {
    const vRes = await query('SELECT * FROM vehicles WHERE LOWER(vehicle_id) = $1', [vehicleId.trim().toLowerCase()]);
    if (vRes.rows.length === 0) return null;
    const v = vRes.rows[0];

    if (v.user_id) {
      if (!userEmail || userEmail.trim().length === 0) return null;
      if (userEmail.trim().toLowerCase() !== 'admin') {
        const uRes = await query('SELECT gmail FROM users WHERE id = $1', [v.user_id]);
        if (uRes.rows.length === 0 || uRes.rows[0].gmail.toLowerCase() !== userEmail.trim().toLowerCase()) {
          return null;
        }
      }
    }
    return {
      id: v.id,
      vehicleId: v.vehicle_id,
      vehicleType: v.vehicle_type,
      manufacturer: v.manufacturer,
      model: v.model,
      userId: v.user_id,
      createdAt: v.created_at
    };
  }

  async getHistoryByVehicleId(vehicleId: string, userEmail?: string): Promise<BatteryAnalysis[]> {
    const v = await this.findVehicleByVehicleId(vehicleId, userEmail);
    if (!v) return [];

    const res = await query(
      'SELECT * FROM battery_analyses WHERE LOWER(vehicle_id) = $1 ORDER BY created_at ASC',
      [vehicleId.trim().toLowerCase()]
    );
    return res.rows.map(this.mapAnalysisRow);
  }

  async getVehiclesByUserEmail(userEmail?: string): Promise<Vehicle[]> {
    if (!userEmail || userEmail.trim().length === 0 || userEmail.trim().toLowerCase() === 'admin') {
      const res = await query('SELECT * FROM vehicles ORDER BY id ASC');
      return res.rows.map((v) => ({
        id: v.id,
        vehicleId: v.vehicle_id,
        vehicleType: v.vehicle_type,
        manufacturer: v.manufacturer,
        model: v.model,
        userId: v.user_id,
        createdAt: v.created_at
      }));
    }
    const res = await query(
      `SELECT v.* FROM vehicles v
       JOIN users u ON v.user_id = u.id
       WHERE LOWER(u.gmail) = $1
       ORDER BY v.id ASC`,
      [userEmail.trim().toLowerCase()]
    );
    return res.rows.map((v) => ({
      id: v.id,
      vehicleId: v.vehicle_id,
      vehicleType: v.vehicle_type,
      manufacturer: v.manufacturer,
      model: v.model,
      userId: v.user_id,
      createdAt: v.created_at
    }));
  }

  async clearHistory(): Promise<void> {
    await query('DELETE FROM battery_analyses');
    await query('DELETE FROM vehicles');
  }

  async getPublicAssessment(id: number): Promise<{ assessment: BatteryAnalysis; history: BatteryAnalysis[] } | null> {
    const aRes = await query('SELECT * FROM battery_analyses WHERE id = $1', [id]);
    if (aRes.rows.length === 0) return null;

    const assessment = this.mapAnalysisRow(aRes.rows[0]);
    let history: BatteryAnalysis[] = [];

    if (assessment.vehicleId) {
      const hRes = await query(
        'SELECT * FROM battery_analyses WHERE LOWER(vehicle_id) = $1 ORDER BY created_at ASC',
        [assessment.vehicleId.toLowerCase()]
      );
      history = hRes.rows.map(this.mapAnalysisRow);

      for (let i = 0; i < history.length; i++) {
        const item = history[i];
        if (i > 0) {
          const prev = history[i - 1];
          item.sohChange = round((item.currentUsableCapacity / item.originalCapacity) * 100.0 - prev.soh, 2);
          item.usableCapacityChange = round(item.currentUsableCapacity - prev.currentUsableCapacity, 2);
          item.odometerChange = round(item.odometer - prev.odometer, 2);
          item.cyclesChange = item.chargingCycles - prev.chargingCycles;
          item.rangeChange = round(item.averageRange - prev.averageRange, 2);
          item.ageChange = round(item.batteryAge - prev.batteryAge, 2);
        } else {
          item.sohChange = 0;
          item.usableCapacityChange = 0;
          item.odometerChange = 0;
          item.cyclesChange = 0;
          item.rangeChange = 0;
          item.ageChange = 0;
        }
      }
    }

    return { assessment, history };
  }

  private mapAnalysisRow(r: any): BatteryAnalysis {
    return {
      id: r.id,
      vehicleId: r.vehicle_id,
      vehicleDbId: r.vehicle_db_id != null ? Number(r.vehicle_db_id) : null,
      vehicleType: r.vehicle_type,
      manufacturer: r.manufacturer,
      model: r.model,
      batteryAge: Number(r.battery_age),
      odometer: Number(r.odometer),
      originalCapacity: Number(r.original_capacity),
      currentUsableCapacity: Number(r.current_usable_capacity),
      currentBatteryPercentage: Number(r.current_battery_percentage),
      chargingCycles: Number(r.charging_cycles),
      averageTemperature: Number(r.average_temperature),
      averageRange: Number(r.average_range),
      normalChargingPercentage: Number(r.normal_charging_percentage),
      fastChargingPercentage: Number(r.fast_charging_percentage),
      soh: Number(r.soh),
      capacityLoss: Number(r.capacity_loss),
      condition: r.condition,
      confidenceScore: Number(r.confidence_score),
      safetyScore: Number(r.safety_score),
      riskLevel: r.risk_level,
      explanation: r.explanation,
      sohChange: r.soh_change != null ? Number(r.soh_change) : undefined,
      usableCapacityChange: r.usable_capacity_change != null ? Number(r.usable_capacity_change) : undefined,
      odometerChange: r.odometer_change != null ? Number(r.odometer_change) : undefined,
      cyclesChange: r.cycles_change != null ? Number(r.cycles_change) : undefined,
      rangeChange: r.range_change != null ? Number(r.range_change) : undefined,
      ageChange: r.age_change != null ? Number(r.age_change) : undefined,
      createdAt: r.created_at
    };
  }
}

export const batteryService = new BatteryAnalysisService();

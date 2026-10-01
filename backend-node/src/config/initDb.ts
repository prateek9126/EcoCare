import bcrypt from 'bcryptjs';
import { query } from './db.js';
import { chargingStations } from '../data/chargingStationsData.js';
import { initialDealers, initialServiceCenters } from '../data/dealersAndServicesData.js';
import { initialEvModels } from '../data/evModelsData.js';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initDb(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('>>> Initializing PostgreSQL Schema & Checking Tables...');

      // 1. Create tables if not exists
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(50),
          gmail VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS otp_verifications (
          id SERIAL PRIMARY KEY,
          gmail VARCHAR(255) UNIQUE NOT NULL,
          otp VARCHAR(10) NOT NULL,
          expiry_time TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS vehicles (
          id SERIAL PRIMARY KEY,
          vehicle_id VARCHAR(100) UNIQUE NOT NULL,
          vehicle_type VARCHAR(100) NOT NULL,
          manufacturer VARCHAR(100),
          model VARCHAR(100),
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS battery_analyses (
          id SERIAL PRIMARY KEY,
          vehicle_id VARCHAR(100),
          vehicle_db_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
          vehicle_type VARCHAR(100),
          manufacturer VARCHAR(100),
          model VARCHAR(100),
          battery_age DOUBLE PRECISION,
          odometer DOUBLE PRECISION,
          original_capacity DOUBLE PRECISION,
          current_usable_capacity DOUBLE PRECISION,
          current_battery_percentage DOUBLE PRECISION,
          charging_cycles INTEGER,
          average_temperature DOUBLE PRECISION,
          average_range DOUBLE PRECISION,
          normal_charging_percentage DOUBLE PRECISION,
          fast_charging_percentage DOUBLE PRECISION,
          soh DOUBLE PRECISION,
          capacity_loss DOUBLE PRECISION,
          condition VARCHAR(50),
          confidence_score DOUBLE PRECISION,
          safety_score INTEGER,
          risk_level VARCHAR(50),
          explanation TEXT,
          soh_change DOUBLE PRECISION,
          usable_capacity_change DOUBLE PRECISION,
          odometer_change DOUBLE PRECISION,
          cycles_change INTEGER,
          range_change DOUBLE PRECISION,
          age_change DOUBLE PRECISION,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS charging_stations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          total_ports INTEGER NOT NULL,
          available_ports INTEGER NOT NULL,
          charger_type VARCHAR(100) NOT NULL,
          power_kw INTEGER NOT NULL,
          status VARCHAR(50) NOT NULL,
          location_name VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS battery_listings (
          id SERIAL PRIMARY KEY,
          vehicle_type VARCHAR(100),
          phone_number VARCHAR(50),
          manufacturer VARCHAR(100),
          model VARCHAR(100),
          chemistry VARCHAR(100),
          capacity DOUBLE PRECISION,
          estimated_soh DOUBLE PRECISION,
          charging_cycles INTEGER,
          battery_age DOUBLE PRECISION,
          price DOUBLE PRECISION,
          city VARCHAR(100),
          state VARCHAR(100),
          description TEXT,
          image_url TEXT,
          status VARCHAR(50) DEFAULT 'AVAILABLE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS passport_links (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(50) UNIQUE NOT NULL,
          vehicle_id VARCHAR(100) NOT NULL,
          assessment_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ev_models (
          id SERIAL PRIMARY KEY,
          company VARCHAR(100) NOT NULL,
          model VARCHAR(100) NOT NULL,
          vehicle_type VARCHAR(50) NOT NULL,
          body_type VARCHAR(50),
          min_price DOUBLE PRECISION NOT NULL,
          max_price DOUBLE PRECISION NOT NULL,
          range_km INTEGER NOT NULL,
          battery_capacity_kwh DOUBLE PRECISION,
          charging_time_mins INTEGER,
          fast_charging VARCHAR(50),
          top_speed_kmh INTEGER,
          user_rating DOUBLE PRECISION,
          reviews_count INTEGER,
          warranty_years INTEGER,
          safety_rating INTEGER,
          service_center_count INTEGER,
          service_center_availability_by_city VARCHAR(1000),
          positive_factors VARCHAR(1000),
          negative_factors VARCHAR(1000),
          available_cities VARCHAR(1000),
          image_url TEXT,
          estimated_running_cost_per_km DOUBLE PRECISION
        );

        CREATE TABLE IF NOT EXISTS ev_dealers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          brand VARCHAR(100) NOT NULL,
          address TEXT,
          phone_number VARCHAR(50),
          rating DOUBLE PRECISION
        );

        CREATE TABLE IF NOT EXISTS ev_service_centers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          city VARCHAR(100) NOT NULL,
          brand VARCHAR(100) NOT NULL,
          address TEXT,
          phone_number VARCHAR(50),
          rating DOUBLE PRECISION
        );

        CREATE TABLE IF NOT EXISTS vehicle_sales (
          id SERIAL PRIMARY KEY,
          vehicle_id VARCHAR(100) NOT NULL,
          manufacturer VARCHAR(100),
          model VARCHAR(100),
          user_id INTEGER,
          sale_date TIMESTAMP NOT NULL,
          sale_price DOUBLE PRECISION,
          region VARCHAR(100)
        );

        CREATE TABLE IF NOT EXISTS service_records (
          id SERIAL PRIMARY KEY,
          vehicle_id VARCHAR(100) NOT NULL,
          manufacturer VARCHAR(100),
          model VARCHAR(100),
          service_center_id INTEGER,
          service_center_name VARCHAR(255),
          service_date TIMESTAMP NOT NULL,
          service_type VARCHAR(100),
          odometer DOUBLE PRECISION,
          battery_soh DOUBLE PRECISION,
          technician_notes TEXT,
          status VARCHAR(50),
          repair_time_hours DOUBLE PRECISION,
          is_repeat_visit BOOLEAN DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS service_issues (
          id SERIAL PRIMARY KEY,
          service_record_id INTEGER,
          vehicle_id VARCHAR(100) NOT NULL,
          manufacturer VARCHAR(100),
          model VARCHAR(100),
          issue_type VARCHAR(100),
          severity VARCHAR(50),
          description TEXT,
          reported_date TIMESTAMP NOT NULL,
          resolved_date TIMESTAMP
        );
      `);

      // Safe column migrations for compatibility with existing Spring Boot tables
      await query(`
        ALTER TABLE battery_analyses ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR(100);
        ALTER TABLE battery_analyses ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(100);
        ALTER TABLE battery_analyses ADD COLUMN IF NOT EXISTS soh_change DOUBLE PRECISION;
        ALTER TABLE battery_analyses ADD COLUMN IF NOT EXISTS usable_capacity_change DOUBLE PRECISION;
        ALTER TABLE battery_analyses ADD COLUMN IF NOT EXISTS odometer_change DOUBLE PRECISION;
        ALTER TABLE battery_analyses ADD COLUMN IF NOT EXISTS cycles_change INTEGER;
        ALTER TABLE battery_analyses ADD COLUMN IF NOT EXISTS range_change DOUBLE PRECISION;
        ALTER TABLE battery_analyses ADD COLUMN IF NOT EXISTS age_change DOUBLE PRECISION;

        UPDATE battery_analyses ba
        SET vehicle_id = v.vehicle_id,
            vehicle_type = COALESCE(ba.vehicle_type, v.vehicle_type)
        FROM vehicles v
        WHERE ba.vehicle_db_id = v.id AND ba.vehicle_id IS NULL;
      `);

      // 2. Seed Default Users
      const companyUserRes = await query('SELECT id FROM users WHERE LOWER(gmail) = $1', ['company@ev.com']);
      if (companyUserRes.rows.length === 0) {
        const companyHash = await bcrypt.hash('company', 10);
        await query(
          'INSERT INTO users (name, phone_number, gmail, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          ['Manufacturer Admin', '+91 99999 99999', 'company@ev.com', companyHash, 'ROLE_COMPANY']
        );
        console.log('>>> Seeded Company User: company@ev.com (pw: company)');
      }

      let customerId: number | null = null;
      const customerUserRes = await query('SELECT id FROM users WHERE LOWER(gmail) = $1', ['customer@ev.com']);
      if (customerUserRes.rows.length === 0) {
        const customerHash = await bcrypt.hash('password', 10);
        const insRes = await query(
          'INSERT INTO users (name, phone_number, gmail, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          ['Rajesh Kumar', '+91 98765 43210', 'customer@ev.com', customerHash, 'ROLE_USER']
        );
        customerId = insRes.rows[0].id;
        console.log('>>> Seeded Customer User: customer@ev.com (pw: password)');
      } else {
        customerId = customerUserRes.rows[0].id;
      }

      // 3. Seed Charging Stations
      const stationsRes = await query('SELECT COUNT(*) FROM charging_stations');
      if (parseInt(stationsRes.rows[0].count, 10) === 0) {
        for (const st of chargingStations) {
          await query(
            `INSERT INTO charging_stations 
              (name, latitude, longitude, total_ports, available_ports, charger_type, power_kw, status, location_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [st.name, st.latitude, st.longitude, st.total_ports, st.available_ports, st.charger_type, st.power_kw, st.status, st.location_name]
          );
        }
        console.log(`>>> Seeded ${chargingStations.length} Charging Stations.`);
      }

      // 4. Seed Dealers
      const dealersRes = await query('SELECT COUNT(*) FROM ev_dealers');
      if (parseInt(dealersRes.rows[0].count, 10) === 0) {
        for (const d of initialDealers) {
          await query(
            'INSERT INTO ev_dealers (name, city, brand, address, phone_number, rating) VALUES ($1, $2, $3, $4, $5, $6)',
            [d.name, d.city, d.brand, d.address, d.phone, d.rating]
          );
        }
        console.log(`>>> Seeded ${initialDealers.length} EV Dealerships.`);
      }

      // 5. Seed Service Centers
      const serviceCentersRes = await query('SELECT COUNT(*) FROM ev_service_centers');
      if (parseInt(serviceCentersRes.rows[0].count, 10) === 0) {
        for (const sc of initialServiceCenters) {
          await query(
            'INSERT INTO ev_service_centers (name, city, brand, address, phone_number, rating) VALUES ($1, $2, $3, $4, $5, $6)',
            [sc.name, sc.city, sc.brand, sc.address, sc.phone, sc.rating]
          );
        }
        console.log(`>>> Seeded ${initialServiceCenters.length} EV Service Centers.`);
      }

      // 6. Seed EV Models
      const modelsRes = await query('SELECT COUNT(*) FROM ev_models');
      if (parseInt(modelsRes.rows[0].count, 10) === 0) {
        for (const m of initialEvModels) {
          await query(
            `INSERT INTO ev_models 
              (company, model, vehicle_type, body_type, min_price, max_price, range_km, 
               battery_capacity_kwh, charging_time_mins, fast_charging, top_speed_kmh, user_rating, 
               reviews_count, warranty_years, safety_rating, service_center_count, 
               service_center_availability_by_city, positive_factors, negative_factors, available_cities, 
               image_url, estimated_running_cost_per_km)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
            [
              m.company, m.model, m.vehicleType, m.bodyType, m.minPrice, m.maxPrice, m.rangeKm,
              m.batteryCapacityKwh, m.chargingTimeMins, m.fastCharging, m.topSpeedKmh, m.userRating,
              m.reviewsCount, m.warrantyYears, m.safetyRating, m.serviceCenterCount,
              m.serviceCenterAvailabilityByCity, m.positiveFactors, m.negativeFactors, m.availableCities,
              m.imageUrl, m.estimatedRunningCostPerKm
            ]
          );
        }
        console.log(`>>> Seeded ${initialEvModels.length} EV Models into database.`);
      }

      // 7. Seed Analytics Demo Data (Vehicles, Sales, Assessments, Services, Issues)
      const salesRes = await query('SELECT COUNT(*) FROM vehicle_sales');
      if (parseInt(salesRes.rows[0].count, 10) === 0) {
        console.log('>>> Seeding Company Analytics Demo Data (30 vehicles + history)...');
        await seedAnalyticsDemoData(customerId);
      }

      // 8. Seed specific test vehicles with history: VIN-1001 & VIN-TEST-101
      await seedSpecificVehicleWithHistory('VIN-1001', 'Tesla', 'E1', 'ELECTRIC_CAR', 45.0, customerId);
      await seedSpecificVehicleWithHistory('VIN-TEST-101', 'EV Company', 'EV 360', 'ELECTRIC_CAR', 45.0, customerId);

      isInitialized = true;
      console.log('>>> PostgreSQL Database initialization complete.');
    } catch (err) {
      console.error('>>> Failed to initialize PostgreSQL database:', err);
      throw err;
    }
  })();

  return initPromise;
}

// Reproducible pseudo-random helper
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function round(val: number, places: number): number {
  if (Number.isNaN(val) || !Number.isFinite(val)) return 0.0;
  const factor = Math.pow(10, places);
  return Math.round(val * factor) / factor;
}

async function seedAnalyticsDemoData(customerId: number | null) {
  const rand = pseudoRandom(42);

  const modelPrices: Record<string, number> = {
    'EV 360': 1300000.0,
    E1: 900000.0,
    E2: 1150000.0,
    E3: 1650000.0
  };

  const modelCapacities: Record<string, number> = {
    'EV 360': 45.0,
    E1: 30.0,
    E2: 38.0,
    E3: 50.0
  };

  const regions = ['East', 'West', 'North', 'South', 'Central'];
  const vehiclesToSeed: Record<string, number> = {
    'EV 360': 12,
    E1: 10,
    E2: 5,
    E3: 3
  };

  const serviceCenterId = 1;
  const serviceCenterName = 'EV Service Center - Bistupur';

  for (const [modelName, count] of Object.entries(vehiclesToSeed)) {
    const price = modelPrices[modelName];
    const originalCap = modelCapacities[modelName];

    for (let i = 0; i < count; i++) {
      const p1 = Math.floor(rand() * 100).toString().padStart(2, '0');
      const p2 = Math.floor(rand() * 100).toString().padStart(2, '0');
      const vehicleId = `EV-${modelName.replace(/\s+/g, '').toUpperCase()}-JH${p1}${p2}`;

      // Insert Vehicle
      const vehRes = await query(
        'INSERT INTO vehicles (vehicle_id, vehicle_type, manufacturer, model, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [vehicleId, 'ELECTRIC_CAR', 'EV Company', modelName, customerId]
      );
      const vehicleDbId = vehRes.rows[0].id;

      // Sale date
      const monthsAgo = Math.floor(rand() * 12) + 1;
      const daysOffset = Math.floor(rand() * 28);
      const saleDate = new Date();
      saleDate.setMonth(saleDate.getMonth() - monthsAgo);
      saleDate.setDate(saleDate.getDate() - daysOffset);

      const region = regions[Math.floor(rand() * regions.length)];

      await query(
        'INSERT INTO vehicle_sales (vehicle_id, manufacturer, model, user_id, sale_date, sale_price, region) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [vehicleId, 'EV Company', modelName, customerId, saleDate, price, region]
      );

      // Usage telemetry
      const ageYears = round(monthsAgo / 12.0 + rand() * 0.1, 1);
      const odometer = round(ageYears * 12000.0 + rand() * 3000.0, 0);
      const cycles = Math.floor(odometer / 150.0 + rand() * 20.0);

      let expectedDegradationRatio = 0.95;
      if (modelName === 'EV 360') {
        expectedDegradationRatio = 0.89 - rand() * 0.05;
      } else if (modelName === 'E1') {
        expectedDegradationRatio = 0.94 - rand() * 0.02;
      } else if (modelName === 'E2') {
        expectedDegradationRatio = 0.93 - rand() * 0.03;
      } else if (modelName === 'E3') {
        expectedDegradationRatio = 0.92 - rand() * 0.02;
      }

      const currentUsableCap = round(originalCap * expectedDegradationRatio, 2);
      const soh = round((currentUsableCap / originalCap) * 100.0, 2);

      let assessmentsCount = 1;
      if (monthsAgo >= 9) {
        assessmentsCount = 4;
      } else if (monthsAgo >= 5) {
        assessmentsCount = 2;
      }

      for (let aIdx = 1; aIdx <= assessmentsCount; aIdx++) {
        const ratio = aIdx / assessmentsCount;
        const histAge = round(ageYears * ratio, 2);
        const histOdo = round(odometer * ratio, 0);
        const histCycles = Math.floor(cycles * ratio);
        const histDegradation = 1.0 - (1.0 - expectedDegradationRatio) * ratio;
        const histUsable = round(originalCap * histDegradation, 2);
        const histSoh = round((histUsable / originalCap) * 100.0, 2);

        let avgTemp = 22.0 + rand() * 8.0;
        if (modelName === 'EV 360' && i % 3 === 0) {
          avgTemp += 6.0;
        }

        let condition = 'Excellent';
        if (histSoh < 75.0) condition = 'Degraded';
        else if (histSoh < 85.0) condition = 'Moderate';
        else if (histSoh < 93.0) condition = 'Good';

        let safety = 100.0 - (100.0 - histSoh) * 0.8;
        if (avgTemp > 35) safety -= (avgTemp - 35) * 2.0;
        const safetyScore = Math.max(0, Math.min(100, Math.round(safety)));
        const riskLevel = safetyScore >= 85 ? 'LOW' : safetyScore >= 65 ? 'MEDIUM' : 'HIGH';

        const assessmentDate = new Date(saleDate);
        assessmentDate.setMonth(assessmentDate.getMonth() + Math.floor(monthsAgo * ratio));

        await query(
          `INSERT INTO battery_analyses 
            (vehicle_id, vehicle_db_id, vehicle_type, manufacturer, model, battery_age, odometer, 
             original_capacity, current_usable_capacity, current_battery_percentage, charging_cycles, 
             average_temperature, average_range, normal_charging_percentage, fast_charging_percentage, 
             soh, capacity_loss, condition, confidence_score, safety_score, risk_level, explanation, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
          [
            vehicleId, vehicleDbId, 'ELECTRIC_CAR', 'EV Company', modelName, histAge, histOdo,
            originalCap, histUsable, 80.0, histCycles,
            round(avgTemp, 1), round(350.0 * histDegradation, 0), 75.0, 25.0,
            histSoh, round(originalCap - histUsable, 2), condition, 95.0, safetyScore, riskLevel,
            'Telemetry assessed via Company data seeder.', assessmentDate
          ]
        );
      }

      // Seed service records & issues if odometer > 8000
      if (odometer > 8000.0) {
        const serviceDate = new Date(saleDate);
        serviceDate.setMonth(serviceDate.getMonth() + 6);

        const hasChargingIssue = modelName === 'EV 360' && i % 2 === 0;
        const hasDegradation = modelName === 'EV 360' && i % 3 === 0;

        const sRes = await query(
          `INSERT INTO service_records 
            (vehicle_id, manufacturer, model, service_center_id, service_center_name, service_date, 
             service_type, odometer, battery_soh, technician_notes, status, repair_time_hours, is_repeat_visit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
          [
            vehicleId, 'EV Company', modelName, serviceCenterId, serviceCenterName, serviceDate,
            'First Service', 7500.0, round(soh + 3.0, 1), 'Routine checks performed. Charging port inspected.',
            'COMPLETED', 1.5, false
          ]
        );
        const serviceRecordId = sRes.rows[0].id;

        if (hasChargingIssue) {
          const resDate = new Date(serviceDate);
          resDate.setDate(resDate.getDate() + 2);
          await query(
            `INSERT INTO service_issues 
              (service_record_id, vehicle_id, manufacturer, model, issue_type, severity, description, reported_date, resolved_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              serviceRecordId, vehicleId, 'EV Company', modelName, 'Charging issue', 'HIGH',
              'Customer reports vehicle refuses to initiate fast DC charging and shows terminal error.',
              serviceDate, resDate
            ]
          );
        }

        if (hasDegradation) {
          const resDate = new Date(serviceDate);
          resDate.setDate(resDate.getDate() + 1);
          await query(
            `INSERT INTO service_issues 
              (service_record_id, vehicle_id, manufacturer, model, issue_type, severity, description, reported_date, resolved_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              serviceRecordId, vehicleId, 'EV Company', modelName, 'Battery degradation', 'MEDIUM',
              'Capacity assessment shows usable retention below 85% after moderate cycles. Cell pack balanced.',
              serviceDate, resDate
            ]
          );
        }

        // Repeat service if high odo
        if (odometer > 18000.0 && (hasChargingIssue || hasDegradation)) {
          const serviceDate2 = new Date(serviceDate);
          serviceDate2.setMonth(serviceDate2.getMonth() + 6);

          const sRes2 = await query(
            `INSERT INTO service_records 
              (vehicle_id, manufacturer, model, service_center_id, service_center_name, service_date, 
               service_type, odometer, battery_soh, technician_notes, status, repair_time_hours, is_repeat_visit)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
            [
              vehicleId, 'EV Company', modelName, serviceCenterId, serviceCenterName, serviceDate2,
              'Repair', 18500.0, soh, 'Revisited for charging issues. BMS controller reflashed.',
              'COMPLETED', 4.0, true
            ]
          );
          const serviceRecordId2 = sRes2.rows[0].id;

          await query(
            `INSERT INTO service_issues 
              (service_record_id, vehicle_id, manufacturer, model, issue_type, severity, description, reported_date, resolved_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              serviceRecordId2, vehicleId, 'EV Company', modelName, 'BMS warning', 'MEDIUM',
              'BMS logged error code B204-1 (Overvoltage fault). Reflashed firmware and replaced wiring harness.',
              serviceDate2, serviceDate2
            ]
          );
        }
      }
    }
  }
}

async function seedSpecificVehicleWithHistory(
  vehicleId: string,
  manufacturer: string,
  model: string,
  type: string,
  originalCap: number,
  userId: number | null
) {
  const check = await query('SELECT id FROM vehicles WHERE vehicle_id = $1', [vehicleId]);
  if (check.rows.length === 0) {
    const vRes = await query(
      'INSERT INTO vehicles (vehicle_id, vehicle_type, manufacturer, model, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [vehicleId, type, manufacturer, model, userId]
    );
    const vehicleDbId = vRes.rows[0].id;

    // Assessment 1: April 2026
    const usable1 = round(originalCap * 0.948, 2);
    await query(
      `INSERT INTO battery_analyses 
        (vehicle_id, vehicle_db_id, vehicle_type, manufacturer, model, battery_age, odometer, 
         original_capacity, current_usable_capacity, current_battery_percentage, charging_cycles, 
         average_temperature, average_range, normal_charging_percentage, fast_charging_percentage, 
         soh, capacity_loss, condition, confidence_score, safety_score, risk_level, explanation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [
        vehicleId, vehicleDbId, type, manufacturer, model, 1.1, 14500.0,
        originalCap, usable1, 85.0, 112,
        26.5, 335.0, 80.0, 20.0,
        94.8, round(originalCap - usable1, 2), 'Excellent', 96.0, 95, 'LOW',
        'Routine preventive maintenance assessment. Cell voltage distribution tightly matched (9 mV delta). Thermal dissipation optimal.',
        new Date('2026-04-15T10:30:00Z')
      ]
    );

    // Assessment 2: August 2026
    const usable2 = round(originalCap * 0.884, 2);
    await query(
      `INSERT INTO battery_analyses 
        (vehicle_id, vehicle_db_id, vehicle_type, manufacturer, model, battery_age, odometer, 
         original_capacity, current_usable_capacity, current_battery_percentage, charging_cycles, 
         average_temperature, average_range, normal_charging_percentage, fast_charging_percentage, 
         soh, capacity_loss, condition, confidence_score, safety_score, risk_level, explanation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [
        vehicleId, vehicleDbId, type, manufacturer, model, 1.5, 21800.0,
        originalCap, usable2, 78.0, 198,
        33.2, 295.0, 65.0, 35.0,
        88.4, round(originalCap - usable2, 2), 'Good', 94.0, 87, 'LOW',
        'Pre-complaint evaluation. Usable capacity dropped 6.4% over recent high-speed driving period. Elevated fast-charging frequency noted with mild thermal rise during peak load.',
        new Date('2026-08-22T14:45:00Z')
      ]
    );

    console.log(`>>> Seeded specific vehicle with history: ${vehicleId}`);
  }
}

import type { 
  StateData, 
  CityData, 
  ShowroomData, 
  SoldVehicleData, 
  BatteryAssessmentData, 
  BatteryHealthStatus 
} from '../types/salesCity';

// Deterministic pseudo-random number generator for consistent mock datasets
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const customerNames = [
  'Aarav Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Mukherjee', 'Vikram Singh',
  'Ananya Das', 'Amitabh Roy', 'Pooja Iyer', 'Rohan Mehta', 'Deepika Nair',
  'Aditya Rao', 'Neha Gupta', 'Karan Johar', 'Sunita Reddy', 'Manoj Bajpayee',
  'Divya Joshi', 'Siddharth Sen', 'Meera Kulkarni', 'Rajesh Khatri', 'Swati Deshmukh',
  'Arjun Malhotra', 'Tanvi Chawla', 'Gaurav Bhatia', 'Ritu Saxena', 'Harish Nambiar',
  'Alok Pandey', 'Shruti Mishra', 'Nikhil Choudhury', 'Kavita Pillai', 'Sanjay Hegde'
];

const managers = [
  'Rajeev Ranjan', 'Debashis Panda', 'Sunil Kulkarni', 'Kavitha Shenoy', 'Deepak Tiwari',
  'Anil Agarwal', 'Meenakshi Sundaram', 'Praveen Nair', 'Shalini Kapoor', 'Gautam Bose',
  'Sameer Deshpande', 'Ramesh Nayak', 'Sujata Mohanty', 'Vipin Khurana', 'Mahesh Hegde'
];

interface ModelConfig {
  name: string;
  nominalKwh: number;
  batteryType: string;
  chemistry: 'LFP' | 'NMC';
}

const modelConfigs: ModelConfig[] = [
  { name: 'EV 360', nominalKwh: 45.0, batteryType: '45kWh NMC', chemistry: 'NMC' },
  { name: 'EV 360', nominalKwh: 40.0, batteryType: '40kWh LFP', chemistry: 'LFP' },
  { name: 'E1', nominalKwh: 30.0, batteryType: '30kWh LFP', chemistry: 'LFP' },
  { name: 'E1', nominalKwh: 28.0, batteryType: '28kWh LFP', chemistry: 'LFP' },
  { name: 'E2', nominalKwh: 38.0, batteryType: '38kWh LFP', chemistry: 'LFP' },
  { name: 'E2', nominalKwh: 35.0, batteryType: '35kWh NMC', chemistry: 'NMC' },
  { name: 'E3', nominalKwh: 50.0, batteryType: '50kWh LFP', chemistry: 'LFP' },
  { name: 'E3', nominalKwh: 55.0, batteryType: '55kWh NMC', chemistry: 'NMC' },
  { name: 'Model Y Long Range', nominalKwh: 75.0, batteryType: '75kWh NMC', chemistry: 'NMC' }
];

function generateVehicleDataset(showroomCode: string, stateCode: string, cityId: string, rng: () => number): SoldVehicleData[] {
  const vehicleCount = 11 + Math.floor(rng() * 4); // 11 to 14 vehicles
  const vehicles: SoldVehicleData[] = [];

  for (let i = 0; i < vehicleCount; i++) {
    const config = modelConfigs[Math.floor(rng() * modelConfigs.length)];
    const vidNum = 1000 + Math.floor(rng() * 9000);
    const vehicleId = `EV-${config.name.replace(' ', '')}-${stateCode}${vidNum}`;
    const vin = `MAT76${stateCode}${Math.floor(rng() * 900000 + 100000)}B${Math.floor(rng() * 9000 + 1000)}`;
    const packId = `BP-${config.chemistry}-${Math.round(config.nominalKwh)}-${Math.floor(rng() * 9000 + 1000)}`;

    const monthsAgo = Math.floor(rng() * 22) + 4; // 4 to 25 months ago
    const saleDateObj = new Date(Date.now() - monthsAgo * 30 * 24 * 3600 * 1000);
    const saleDate = saleDateObj.toISOString().split('T')[0];

    const customer = customerNames[Math.floor(rng() * customerNames.length)];
    const phone = `+91 ${Math.floor(rng() * 3 + 7)}${Math.floor(rng() * 900000000 + 100000000)}`;

    // Number of assessments: 3 to 7
    const assessmentCount = Math.max(3, Math.min(8, Math.floor(monthsAgo / 3.5) + 1));
    const assessments: BatteryAssessmentData[] = [];

    // Base degradation curve
    const finalDegradation = 0.04 + rng() * 0.18; // 4% to 22% degradation
    let totalKm = Math.floor(monthsAgo * 1100 + rng() * 4000);
    let totalCycles = Math.floor(totalKm / 160 + rng() * 40);

    for (let a = 0; a < assessmentCount; a++) {
      const stepRatio = (a + 1) / assessmentCount;
      const aMonthsAgo = Math.max(0.5, monthsAgo * (1 - stepRatio * 0.95));
      const aDateObj = new Date(Date.now() - aMonthsAgo * 30 * 24 * 3600 * 1000);
      const aDate = aDateObj.toISOString().split('T')[0];

      const aKm = Math.round(totalKm * stepRatio);
      const aCycles = Math.round(totalCycles * stepRatio);
      
      const currentDeg = finalDegradation * stepRatio;
      const soh = Number((100 - currentDeg * 100).toFixed(1));
      const usableCap = Number((config.nominalKwh * (soh / 100)).toFixed(2));
      const internalRes = Number((12.5 + (100 - soh) * 0.65 + rng() * 1.5).toFixed(1));
      const imbalance = Math.round(7 + (100 - soh) * 1.1 + rng() * 6);
      const avgTemp = Number((24.0 + rng() * 8.0).toFixed(1));
      const peakTemp = Number((avgTemp + 5.0 + rng() * 7.0).toFixed(1));

      let result: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
      const dtcs: string[] = [];
      let remarks = 'Cell voltages well balanced. BMS reporting normal health metrics.';

      if (soh < 78.0 || imbalance > 25 || internalRes > 23.0) {
        result = 'FAIL';
        dtcs.push('B204-1 (Cell Delta High)', 'P0A80 (Replace Battery Pack)');
        remarks = 'High cell imbalance and internal resistance observed. Recommended module balancing and warranty pack inspection.';
      } else if (soh < 88.0 || imbalance > 18 || peakTemp > 39.0) {
        result = 'WARNING';
        dtcs.push('B120-3 (Mild Capacity Degradation)');
        remarks = 'Minor capacity loss detected. Cooling loop checked and firmware updated to latest BMS calibration.';
      }

      assessments.push({
        id: `ASM-${showroomCode}-${vidNum}-${a + 1}`,
        assessmentDate: aDate,
        serviceCenter: `${cityId.toUpperCase()} Certified EV Tech Center #${(a % 2) + 1}`,
        assessedBy: managers[(a + i) % managers.length],
        soh,
        usableCapacityKwh: usableCap,
        originalCapacityKwh: config.nominalKwh,
        internalResistanceMohm: internalRes,
        cellVoltageImbalanceMv: imbalance,
        avgTempCelsius: avgTemp,
        peakTempCelsius: peakTemp,
        chargeCycles: aCycles,
        odometerKm: aKm,
        dtcCodes: dtcs.length ? dtcs : ['None (Clean DTC Status)'],
        remarks,
        result
      });
    }

    // Sort newest assessment first
    assessments.sort((x, y) => new Date(y.assessmentDate).getTime() - new Date(x.assessmentDate).getTime());
    const latest = assessments[0];
    
    let healthStatus: BatteryHealthStatus = 'Healthy';
    if (latest.soh < 78.0 || latest.result === 'FAIL') {
      healthStatus = 'Critical';
    } else if (latest.soh < 88.0 || latest.result === 'WARNING') {
      healthStatus = 'Warning';
    }

    vehicles.push({
      vehicleId,
      vin,
      model: config.name,
      batteryPackId: packId,
      batteryType: config.batteryType,
      saleDate,
      customerName: customer,
      customerPhone: phone,
      currentSoh: latest.soh,
      healthStatus,
      odometerKm: latest.odometerKm,
      chargeCycles: latest.chargeCycles,
      assessments
    });
  }

  return vehicles;
}

export function buildSalesCityDataset(): StateData[] {
  const rng = seededRandom(10123);

  const rawStateDefinitions = [
    {
      id: 'state-jh',
      name: 'Jharkhand',
      code: 'JH',
      cities: [
        {
          id: 'city-jamshedpur',
          name: 'Jamshedpur',
          showrooms: [
            { id: 'sh-jsr-01', name: 'Tata GreenDrive Bistupur', code: 'JSR1', address: '42 Main Boulevard, Bistupur' },
            { id: 'sh-jsr-02', name: 'Sakchi Volt City Flagship', code: 'JSR2', address: 'Plot 18, Straight Mile Rd, Sakchi' },
            { id: 'sh-jsr-03', name: 'Kadma EcoWheel Experience', code: 'JSR3', address: 'Shop 7-9, Outer Ring Rd, Kadma' }
          ]
        },
        {
          id: 'city-ranchi',
          name: 'Ranchi',
          showrooms: [
            { id: 'sh-rnc-01', name: 'Main Road EV Gallerie', code: 'RNC1', address: '112 Main Road, Opposite GEL Church' },
            { id: 'sh-rnc-02', name: 'Kanke Hub EV Lounge', code: 'RNC2', address: 'Kanke Rd, Near CM Residence' },
            { id: 'sh-rnc-03', name: 'Doranda CleanMobility Center', code: 'RNC3', address: '55 Hinoo Bypass, Doranda' }
          ]
        },
        {
          id: 'city-dhanbad',
          name: 'Dhanbad',
          showrooms: [
            { id: 'sh-dhn-01', name: 'Bank More Electric Point', code: 'DHN1', address: 'Grand Trunk Road, Bank More' },
            { id: 'sh-dhn-02', name: 'Saraidhela Motors EV', code: 'DHN2', address: 'Steel Gate Square, Saraidhela' },
            { id: 'sh-dhn-03', name: 'Govindpur Highway Showroom', code: 'DHN3', address: 'NH-2 Bypass, Govindpur' }
          ]
        }
      ]
    },
    {
      id: 'state-od',
      name: 'Odisha',
      code: 'OD',
      cities: [
        {
          id: 'city-bhubaneswar',
          name: 'Bhubaneswar',
          showrooms: [
            { id: 'sh-bbs-01', name: 'Saheed Nagar Flagship Lounge', code: 'BBS1', address: 'Block B, Janpath, Saheed Nagar' },
            { id: 'sh-bbs-02', name: 'Patia TechDrive Center', code: 'BBS2', address: 'Infocity Ave, KIIT Square, Patia' },
            { id: 'sh-bbs-03', name: 'Jaydev Vihar Mobility Hub', code: 'BBS3', address: 'Near Pal Heights, Jaydev Vihar' }
          ]
        },
        {
          id: 'city-cuttack',
          name: 'Cuttack',
          showrooms: [
            { id: 'sh-ctk-01', name: 'Badambadi Metro EV', code: 'CTK1', address: 'Ring Road Junction, Badambadi' },
            { id: 'sh-ctk-02', name: 'CDA Sector-9 Green Park', code: 'CTK2', address: 'Abhinav Bidanasi, CDA Sector 9' },
            { id: 'sh-ctk-03', name: 'Link Road PowerWheels', code: 'CTK3', address: 'Madhupatna, Link Road' }
          ]
        },
        {
          id: 'city-rourkela',
          name: 'Rourkela',
          showrooms: [
            { id: 'sh-rkl-01', name: 'Civil Township Volt Studio', code: 'RKL1', address: 'VIP Road, Civil Township' },
            { id: 'sh-rkl-02', name: 'Udit Nagar Showroom', code: 'RKL2', address: 'Station Road, Udit Nagar' },
            { id: 'sh-rkl-03', name: 'Panposh SmartEV Outlet', code: 'RKL3', address: 'Vedvyas Marg, Panposh' }
          ]
        }
      ]
    },
    {
      id: 'state-mh',
      name: 'Maharashtra',
      code: 'MH',
      cities: [
        {
          id: 'city-mumbai',
          name: 'Mumbai',
          showrooms: [
            { id: 'sh-mum-01', name: 'Andheri West Flagship Terminal', code: 'BOM1', address: 'Link Road, Andheri West' },
            { id: 'sh-mum-02', name: 'BKC Corporate EV Experience', code: 'BOM2', address: 'G Block, Bandra Kurla Complex' },
            { id: 'sh-mum-03', name: 'Thane Ghodbunder Hub', code: 'BOM3', address: 'Kapurbawdi Junction, Thane West' }
          ]
        },
        {
          id: 'city-pune',
          name: 'Pune',
          showrooms: [
            { id: 'sh-pun-01', name: 'Kothrud GreenDrive Arena', code: 'PNQ1', address: 'Paud Road, Ideal Colony, Kothrud' },
            { id: 'sh-pun-02', name: 'Viman Nagar Tech Park EV', code: 'PNQ2', address: 'Symbiosis Road, Viman Nagar' },
            { id: 'sh-pun-03', name: 'Hinjewadi IT Phase 1 Showroom', code: 'PNQ3', address: 'Maan Rd, Hinjewadi Phase 1' }
          ]
        },
        {
          id: 'city-nagpur',
          name: 'Nagpur',
          showrooms: [
            { id: 'sh-nag-01', name: 'Dharampeth Premium EV Hub', code: 'NAG1', address: 'WHC Road, Dharampeth' },
            { id: 'sh-nag-02', name: 'Wardha Road CleanDrive', code: 'NAG2', address: 'Near Airport T-Point, Wardha Road' },
            { id: 'sh-nag-03', name: 'Civil Lines Mobility Center', code: 'NAG3', address: 'Palm Road, Civil Lines' }
          ]
        }
      ]
    },
    {
      id: 'state-ka',
      name: 'Karnataka',
      code: 'KA',
      cities: [
        {
          id: 'city-bengaluru',
          name: 'Bengaluru',
          showrooms: [
            { id: 'sh-blr-01', name: 'Indiranagar 100ft EV Lounge', code: 'BLR1', address: '100ft Road, HAL 2nd Stage, Indiranagar' },
            { id: 'sh-blr-02', name: 'Whitefield IT Green Hub', code: 'BLR2', address: 'ITPL Main Road, Brookefield' },
            { id: 'sh-blr-03', name: 'Koramangala 80ft Arena', code: 'BLR3', address: '80 Feet Road, 4th Block, Koramangala' }
          ]
        },
        {
          id: 'city-mysuru',
          name: 'Mysuru',
          showrooms: [
            { id: 'sh-mys-01', name: 'VV Mohalla Heritage EV', code: 'MYS1', address: 'Kalidasa Road, V.V. Mohalla' },
            { id: 'sh-mys-02', name: 'Jayalakshmipuram Electric', code: 'MYS2', address: 'Temple Road, Jayalakshmipuram' },
            { id: 'sh-mys-03', name: 'Hebbal Industrial Tech Studio', code: 'MYS3', address: 'KRS Road, Hebbal Electronic City' }
          ]
        },
        {
          id: 'city-hubli',
          name: 'Hubli',
          showrooms: [
            { id: 'sh-hub-01', name: 'Vidyanagar Central EV', code: 'HBX1', address: 'P.B. Road, Vidyanagar' },
            { id: 'sh-hub-02', name: 'Gokul Road CleanDrive', code: 'HBX2', address: 'Opposite Airport, Gokul Road' },
            { id: 'sh-hub-03', name: 'Tarihal Express Hub', code: 'HBX3', address: 'Industrial Estate Gate 2, Tarihal' }
          ]
        }
      ]
    },
    {
      id: 'state-dl',
      name: 'Delhi NCR',
      code: 'DL',
      cities: [
        {
          id: 'city-delhi-central',
          name: 'New Delhi',
          showrooms: [
            { id: 'sh-del-01', name: 'Connaught Place Flagship', code: 'DEL1', address: 'Outer Circle, Block E, Connaught Place' },
            { id: 'sh-del-02', name: 'Okhla TechDrive Center', code: 'DEL2', address: 'Okhla Industrial Area Phase III' },
            { id: 'sh-del-03', name: 'Rohini Sector-10 EcoHub', code: 'DEL3', address: 'Swarn Jayanti Park Marg, Rohini' }
          ]
        },
        {
          id: 'city-south-delhi',
          name: 'South Delhi',
          showrooms: [
            { id: 'sh-sdl-01', name: 'Saket District Center Lounge', code: 'SDL1', address: 'Press Enclave Road, Saket' },
            { id: 'sh-sdl-02', name: 'Vasant Kunj EV Studio', code: 'SDL2', address: 'Nelson Mandela Marg, Vasant Kunj' },
            { id: 'sh-sdl-03', name: 'Lajpat Nagar Mobility Station', code: 'SDL3', address: 'Ring Road, Lajpat Nagar 4' }
          ]
        },
        {
          id: 'city-gurugram',
          name: 'Gurugram',
          showrooms: [
            { id: 'sh-ggn-01', name: 'Cyber City Future Hub', code: 'GGN1', address: 'DLF Phase 2, Cyber Hub Walkway' },
            { id: 'sh-ggn-02', name: 'Golf Course Road Flagship', code: 'GGN2', address: 'Sector 54, Golf Course Extension' },
            { id: 'sh-ggn-03', name: 'Sohna Road Tech Motors', code: 'GGN3', address: 'Vipul Greens Square, Sohna Road' }
          ]
        }
      ]
    }
  ];

  let managerIdx = 0;

  return rawStateDefinitions.map(stateDef => {
    let stateTotalVehicles = 0;
    let stateSohSum = 0;
    let stateTotalShowrooms = 0;

    const cities: CityData[] = stateDef.cities.map(cityDef => {
      let cityTotalVehicles = 0;
      let citySohSum = 0;

      const showrooms: ShowroomData[] = cityDef.showrooms.map(shDef => {
        const vehicles = generateVehicleDataset(shDef.code, stateDef.code, cityDef.id, rng);
        const totalVehicles = vehicles.length;
        const avgSoh = Number((vehicles.reduce((acc, v) => acc + v.currentSoh, 0) / totalVehicles).toFixed(1));

        cityTotalVehicles += totalVehicles;
        citySohSum += avgSoh * totalVehicles;

        const manager = managers[managerIdx % managers.length];
        managerIdx++;

        return {
          id: shDef.id,
          name: shDef.name,
          code: shDef.code,
          address: shDef.address,
          manager,
          contact: `+91 ${Math.floor(rng() * 3 + 7)}${Math.floor(rng() * 900000000 + 100000000)}`,
          email: `${shDef.code.toLowerCase()}.manager@evcompany.com`,
          cityId: cityDef.id,
          cityName: cityDef.name,
          stateId: stateDef.id,
          stateName: stateDef.name,
          totalVehiclesSold: totalVehicles,
          averageSoh: avgSoh,
          vehicles
        };
      });

      const cityAvgSoh = cityTotalVehicles > 0 ? Number((citySohSum / cityTotalVehicles).toFixed(1)) : 90.0;
      stateTotalVehicles += cityTotalVehicles;
      stateSohSum += cityAvgSoh * cityTotalVehicles;
      stateTotalShowrooms += showrooms.length;

      return {
        id: cityDef.id,
        name: cityDef.name,
        stateId: stateDef.id,
        stateName: stateDef.name,
        totalShowrooms: showrooms.length,
        totalVehiclesSold: cityTotalVehicles,
        averageSoh: cityAvgSoh,
        showrooms
      };
    });

    const stateAvgSoh = stateTotalVehicles > 0 ? Number((stateSohSum / stateTotalVehicles).toFixed(1)) : 90.0;

    return {
      id: stateDef.id,
      name: stateDef.name,
      code: stateDef.code,
      totalCities: cities.length,
      totalShowrooms: stateTotalShowrooms,
      totalVehiclesSold: stateTotalVehicles,
      averageSoh: stateAvgSoh,
      cities
    };
  });
}

// In-memory singleton instance
let cachedDataset: StateData[] | null = null;

export function getSalesCityDataset(): StateData[] {
  if (!cachedDataset) {
    cachedDataset = buildSalesCityDataset();
  }
  return cachedDataset;
}

// Storage keys
const STORAGE_SELECTED_STATE = 'ev_selected_sales_state';
const STORAGE_SELECTED_CITY = 'ev_selected_sales_city';
const STORAGE_SELECTED_SHOWROOM = 'ev_selected_sales_showroom';

export function saveSelectedLocationToStorage(stateName: string, cityName: string, showroomId?: string) {
  try {
    localStorage.setItem(STORAGE_SELECTED_STATE, stateName);
    localStorage.setItem(STORAGE_SELECTED_CITY, cityName);
    if (showroomId) {
      localStorage.setItem(STORAGE_SELECTED_SHOWROOM, showroomId);
    } else {
      localStorage.removeItem(STORAGE_SELECTED_SHOWROOM);
    }
  } catch (e) {
    console.error('Failed saving to localStorage', e);
  }
}

export function getSelectedLocationFromStorage(dataset: StateData[]): {
  state: StateData | null;
  city: CityData | null;
  showroom: ShowroomData | null;
} {
  try {
    const savedState = localStorage.getItem(STORAGE_SELECTED_STATE);
    const savedCity = localStorage.getItem(STORAGE_SELECTED_CITY);
    const savedShowroom = localStorage.getItem(STORAGE_SELECTED_SHOWROOM);

    if (!savedState || !savedCity) {
      return { state: null, city: null, showroom: null };
    }

    const stateObj = dataset.find(s => s.name.toLowerCase() === savedState.toLowerCase()) || null;
    const cityObj = stateObj?.cities.find(c => c.name.toLowerCase() === savedCity.toLowerCase()) || null;
    const showroomObj = cityObj?.showrooms.find(sh => sh.id === savedShowroom) || null;

    return { state: stateObj, city: cityObj, showroom: showroomObj };
  } catch (e) {
    return { state: null, city: null, showroom: null };
  }
}

export function clearSelectedLocationStorage() {
  try {
    localStorage.removeItem(STORAGE_SELECTED_STATE);
    localStorage.removeItem(STORAGE_SELECTED_CITY);
    localStorage.removeItem(STORAGE_SELECTED_SHOWROOM);
  } catch (e) {}
}

// Generates city-proportional sales telemetry for Monthly Sales line chart
export function computeCityMonthlySales(
  baseSales: { name: string; sales: number }[], 
  cityTotalVehicles: number, 
  totalCompanyVehicles: number
): { name: string; sales: number }[] {
  const cityRatio = Math.max(0.08, Math.min(0.45, cityTotalVehicles / totalCompanyVehicles));
  return baseSales.map(item => ({
    name: item.name,
    sales: Math.max(1, Math.round(item.sales * cityRatio))
  }));
}

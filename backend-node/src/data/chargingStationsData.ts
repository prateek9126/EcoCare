export interface InitialChargingStation {
  name: string;
  latitude: number;
  longitude: number;
  total_ports: number;
  available_ports: number;
  charger_type: string;
  power_kw: number;
  status: string;
  location_name: string;
}

export const initialChargingStations: InitialChargingStation[] = [
  { name: "Paradip Port Charge", latitude: 20.3164, longitude: 86.6109, total_ports: 4, available_ports: 2, charger_type: "DC Fast Charger", power_kw: 60, status: "Available", location_name: "Paradip Port Area, Odisha" },
  { name: "Jamshedpur EV Station", latitude: 22.8046, longitude: 86.2029, total_ports: 4, available_ports: 2, charger_type: "DC Fast Charger", power_kw: 60, status: "Available", location_name: "Bistupur, Jamshedpur" },
  { name: "Bhubaneswar Smart Charge", latitude: 20.2961, longitude: 85.8245, total_ports: 6, available_ports: 4, charger_type: "CCS2 DC Fast", power_kw: 120, status: "Available", location_name: "Patia, Bhubaneswar" },
  { name: "Cuttack Link Road Charge", latitude: 20.4625, longitude: 85.8830, total_ports: 8, available_ports: 0, charger_type: "AC Type 2", power_kw: 22, status: "Busy", location_name: "Link Road, Cuttack" },
  { name: "Rourkela Steel City EV", latitude: 22.2604, longitude: 84.8536, total_ports: 5, available_ports: 3, charger_type: "DC Fast Charger", power_kw: 50, status: "Available", location_name: "Civil Township, Rourkela" },
  { name: "Sambalpur Highway Charging", latitude: 21.4669, longitude: 83.9812, total_ports: 4, available_ports: 1, charger_type: "DC Fast Charger", power_kw: 80, status: "Available", location_name: "National Highway, Sambalpur" },
  { name: "Puri Beach EV Hub", latitude: 19.8134, longitude: 85.8312, total_ports: 6, available_ports: 6, charger_type: "AC & DC Charger", power_kw: 50, status: "Available", location_name: "Marine Drive, Puri" },
  { name: "Balasore Town EV Station", latitude: 21.4934, longitude: 86.9337, total_ports: 3, available_ports: 0, charger_type: "DC Fast Charger", power_kw: 30, status: "Offline", location_name: "Station Road, Balasore" },
  { name: "Kendujhargarh Charging Hub", latitude: 21.6289, longitude: 85.5817, total_ports: 4, available_ports: 2, charger_type: "AC Type 2", power_kw: 22, status: "Available", location_name: "Keonjhar Bypass, Kendujhargarh" },
  { name: "Angul Industrial EV Charge", latitude: 20.8444, longitude: 85.1511, total_ports: 6, available_ports: 3, charger_type: "CCS2 DC Fast", power_kw: 100, status: "Available", location_name: "Industrial Area, Angul" },
  { name: "Dhenkanal Bypass Charge", latitude: 20.6621, longitude: 85.6000, total_ports: 4, available_ports: 1, charger_type: "DC Fast", power_kw: 60, status: "Available", location_name: "NH 55, Dhenkanal" },
  { name: "Bhadrak EV Hub", latitude: 21.0574, longitude: 86.4958, total_ports: 4, available_ports: 2, charger_type: "DC Fast Charger", power_kw: 50, status: "Available", location_name: "Bhadrak bypass, Bhadrak" },
  { name: "Delhi Dwarka EV Station", latitude: 28.5921, longitude: 77.0494, total_ports: 8, available_ports: 5, charger_type: "CCS2 DC Ultra Fast", power_kw: 150, status: "Available", location_name: "Sector 10, Dwarka, New Delhi" },
  { name: "Delhi Connaught Place EV", latitude: 28.6304, longitude: 77.2177, total_ports: 4, available_ports: 1, charger_type: "DC Fast Charger", power_kw: 50, status: "Available", location_name: "Connaught Place, New Delhi" },
  { name: "Mumbai Bandra Kurla EV Hub", latitude: 19.0596, longitude: 72.8631, total_ports: 10, available_ports: 4, charger_type: "CCS2 DC Fast", power_kw: 120, status: "Available", location_name: "BKC, Mumbai" },
  { name: "Mumbai Andheri East Charging", latitude: 19.1176, longitude: 72.8631, total_ports: 6, available_ports: 0, charger_type: "AC Type 2", power_kw: 22, status: "Busy", location_name: "Andheri East, Mumbai" },
  { name: "Bengaluru Indiranagar EV Station", latitude: 12.9719, longitude: 77.6412, total_ports: 6, available_ports: 3, charger_type: "DC Fast Charger", power_kw: 60, status: "Available", location_name: "Indiranagar, Bengaluru" },
  { name: "Bengaluru Electronic City Hub", latitude: 12.8452, longitude: 77.6631, total_ports: 12, available_ports: 8, charger_type: "CCS2 DC Fast", power_kw: 120, status: "Available", location_name: "Phase 1, Electronic City, Bengaluru" },
  { name: "Pune Kothrud EV Station", latitude: 18.5074, longitude: 73.8077, total_ports: 4, available_ports: 2, charger_type: "DC Fast Charger", power_kw: 50, status: "Available", location_name: "Kothrud, Pune" },
  { name: "Hyderabad Gachibowli Charging", latitude: 17.4401, longitude: 78.3489, total_ports: 8, available_ports: 5, charger_type: "CCS2 DC Fast", power_kw: 100, status: "Available", location_name: "Gachibowli, Hyderabad" },
];

export const chargingStations = initialChargingStations;

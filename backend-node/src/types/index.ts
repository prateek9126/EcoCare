export interface User {
  id?: number;
  name: string;
  phoneNumber?: string;
  gmail: string;
  passwordHash: string;
  role: string; // 'ROLE_USER' | 'ROLE_COMPANY'
  createdAt?: Date;
}

export interface OtpVerification {
  id?: number;
  gmail: string;
  otp: string;
  expiryTime: Date;
}

export interface Vehicle {
  id?: number;
  vehicleId: string;
  vehicleType: string;
  manufacturer: string;
  model: string;
  userId?: number | null;
  createdAt?: Date;
}

export interface BatteryAnalysis {
  id?: number;
  vehicleId: string;
  vehicleDbId?: number | null;
  batteryId?: string;
  vehicleType: string;
  manufacturer: string;
  model: string;
  originalCapacity: number;
  currentUsableCapacity: number;
  currentBatteryPercentage?: number;
  odometer: number;
  chargingCycles: number;
  averageTemperature: number;
  normalChargingPercentage?: number;
  fastChargingPercentage: number;
  averageRange: number;
  batteryAge: number;
  batteryChemistry?: string;
  soh: number;
  capacityLoss: number;
  condition: string;
  confidenceScore: number;
  safetyScore: number;
  riskLevel: string;
  explanation: string;
  usableCapacityChange?: number;
  sohChange?: number;
  odometerChange?: number;
  cyclesChange?: number;
  rangeChange?: number;
  ageChange?: number;
  createdAt?: Date;
}

export interface ChargingStation {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  totalPorts: number;
  availablePorts: number;
  chargerType: string;
  powerKw: number;
  status: string; // 'Available' | 'Busy' | 'Offline'
  locationName: string;
  distanceKm?: number;
}

export interface BatteryListing {
  id?: number;
  vehicleType: string;
  phoneNumber?: string;
  manufacturer: string;
  model: string;
  chemistry?: string;
  capacity?: number;
  estimatedSoH?: number;
  chargingCycles?: number;
  batteryAge?: number;
  price?: number;
  city?: string;
  state?: string;
  description?: string;
  imageUrl?: string;
  status: string; // 'AVAILABLE' | 'SOLD' | 'PENDING'
  createdAt?: Date;
}

export interface PassportLink {
  id?: number;
  phoneNumber: string;
  vehicleId: string;
  assessmentId?: number;
  status?: string;
  createdAt?: Date;
}

export interface EvModel {
  id?: number;
  company: string;
  model: string;
  vehicleType: string;
  bodyType?: string;
  minPrice: number;
  maxPrice: number;
  rangeKm: number;
  batteryCapacityKwh?: number;
  chargingTimeMins?: number;
  fastCharging?: string;
  topSpeedKmh?: number;
  userRating?: number;
  reviewsCount?: number;
  warrantyYears?: number;
  safetyRating?: number;
  serviceCenterCount?: number;
  serviceCenterAvailabilityByCity?: string;
  positiveFactors?: string;
  negativeFactors?: string;
  availableCities?: string;
  imageUrl?: string;
  estimatedRunningCostPerKm?: number;
}

export interface EvDealer {
  id?: number;
  name: string;
  city: string;
  brand: string;
  address?: string;
  phoneNumber?: string;
  rating?: number;
  distanceKm?: number;
}

export interface EvServiceCenter {
  id?: number;
  name: string;
  city: string;
  brand: string;
  address?: string;
  phoneNumber?: string;
  rating?: number;
}

export interface VehicleSale {
  id?: number;
  vehicleId: string;
  manufacturer?: string;
  model: string;
  userId?: number;
  salePrice?: number;
  saleDate: Date;
  region?: string;
}

export interface ServiceRecord {
  id?: number;
  vehicleId: string;
  manufacturer?: string;
  model: string;
  serviceCenterId?: number;
  serviceCenterName?: string;
  serviceDate: Date;
  serviceType?: string;
  odometer?: number;
  batterySoh?: number;
  technicianNotes?: string;
  status?: string;
  repairTimeHours?: number;
  isRepeatVisit?: boolean;
}

export interface ServiceIssue {
  id?: number;
  serviceRecordId?: number;
  vehicleId: string;
  manufacturer?: string;
  model: string;
  issueType: string;
  description?: string;
  severity?: string;
  status?: string;
  reportedDate: Date;
  resolvedDate?: Date | null;
}

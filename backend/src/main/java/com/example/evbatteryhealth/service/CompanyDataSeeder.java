package com.example.evbatteryhealth.service;

import com.example.evbatteryhealth.model.*;
import com.example.evbatteryhealth.repository.*;
import com.example.evbatteryhealth.util.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class CompanyDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final BatteryAnalysisRepository batteryAnalysisRepository;
    private final VehicleSaleRepository vehicleSaleRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final ServiceIssueRepository serviceIssueRepository;

    @Autowired
    public CompanyDataSeeder(UserRepository userRepository,
                             VehicleRepository vehicleRepository,
                             BatteryAnalysisRepository batteryAnalysisRepository,
                             VehicleSaleRepository vehicleSaleRepository,
                             ServiceRecordRepository serviceRecordRepository,
                             ServiceIssueRepository serviceIssueRepository) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.batteryAnalysisRepository = batteryAnalysisRepository;
        this.vehicleSaleRepository = vehicleSaleRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.serviceIssueRepository = serviceIssueRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Company Account
        if (userRepository.findByGmail("company@ev.com").isEmpty()) {
            User companyUser = new User(
                    "Manufacturer Admin",
                    "+91 99999 99999",
                    "company@ev.com",
                    PasswordEncoder.hashPassword("company"),
                    "ROLE_COMPANY"
            );
            userRepository.save(companyUser);
            System.out.println(">>> Seeded Company User: company@ev.com (pw: company)");
        }

        // 2. Seed Customer Account for owners
        User customerUser = userRepository.findByGmail("customer@ev.com").orElse(null);
        if (customerUser == null) {
            customerUser = new User(
                    "Rajesh Kumar",
                    "+91 98765 43210",
                    "customer@ev.com",
                    PasswordEncoder.hashPassword("password"),
                    "ROLE_USER"
            );
            userRepository.save(customerUser);
            System.out.println(">>> Seeded Customer User: customer@ev.com (pw: password)");
        }

        // 3. Seed Analytics Demo Data (Vehicles, Sales, Service logs, Assessments)
        if (vehicleSaleRepository.count() == 0) {
            System.out.println(">>> Seeding Company Dashboard Analytics Data...");
            Random random = new Random(42); // Seed for reproducible data

            // Define Models and Prices
            Map<String, Double> modelPrices = Map.of(
                    "EV 360", 1300000.0,
                    "E1", 900000.0,
                    "E2", 1150000.0,
                    "E3", 1650000.0
            );

            Map<String, Double> modelOriginalCapacities = Map.of(
                    "EV 360", 45.0,
                    "E1", 30.0,
                    "E2", 38.0,
                    "E3", 50.0
            );

            String[] regions = {"East", "West", "North", "South", "Central"};
            String[] problemTypes = {"Battery degradation", "Charging issue", "Reduced range", "BMS warning", "Overheating", "Slow charging"};
            
            // Create 30 vehicles
            List<Vehicle> seededVehicles = new ArrayList<>();
            List<VehicleSale> seededSales = new ArrayList<>();
            List<BatteryAnalysis> seededAnalyses = new ArrayList<>();
            List<ServiceRecord> seededServices = new ArrayList<>();
            List<ServiceIssue> seededIssues = new ArrayList<>();

            // Seed EV 360 (12 vehicles)
            // Seed E1 (10 vehicles)
            // Seed E2 (5 vehicles)
            // Seed E3 (3 vehicles)
            Map<String, Integer> vehiclesToSeed = Map.of(
                    "EV 360", 12,
                    "E1", 10,
                    "E2", 5,
                    "E3", 3
            );

            long currentServiceCenterId = 1;
            String serviceCenterName = "EV Service Center - Bistupur";

            for (Map.Entry<String, Integer> seedCount : vehiclesToSeed.entrySet()) {
                String modelName = seedCount.getKey();
                int count = seedCount.getValue();
                double price = modelPrices.get(modelName);
                double originalCap = modelOriginalCapacities.get(modelName);

                for (int i = 0; i < count; i++) {
                    // Unique Vehicle ID
                    String vehicleId = String.format("EV-%s-JH%02d%02d", 
                            modelName.replace(" ", "").toUpperCase(), 
                            random.nextInt(100), 
                            random.nextInt(100));
                    
                    // Vehicle Owner Entity
                    Vehicle vehicle = new Vehicle(vehicleId, "ELECTRIC_CAR", "EV Company", modelName);
                    vehicle.setUser(customerUser);
                    vehicleRepository.save(vehicle);
                    seededVehicles.add(vehicle);

                    // Purchase/Sale details (between 12 months ago and current month)
                    int monthsAgo = random.nextInt(12) + 1; // 1 to 12
                    LocalDateTime saleDate = LocalDateTime.now().minusMonths(monthsAgo).minusDays(random.nextInt(28));
                    String region = regions[random.nextInt(regions.length)];
                    
                    VehicleSale sale = new VehicleSale(
                            vehicleId, "EV Company", modelName, customerUser.getId(), saleDate, price, region
                    );
                    vehicleSaleRepository.save(sale);
                    seededSales.add(sale);

                    // Calculate usage telemetry based on age
                    double ageYears = round(monthsAgo / 12.0 + (random.nextDouble() * 0.1), 1);
                    double odometer = round(ageYears * 12000.0 + (random.nextDouble() * 3000.0), 0);
                    int cycles = (int) (odometer / 150.0 + (random.nextDouble() * 20.0));
                    
                    // Degradation characteristics: EV 360 has higher degradation/charging issues
                    double expectedDegradationRatio = 0.95; // 5% capacity loss standard
                    if (modelName.equals("EV 360")) {
                        expectedDegradationRatio = 0.89 - (random.nextDouble() * 0.05); // 11-16% degradation
                    } else if (modelName.equals("E1")) {
                        expectedDegradationRatio = 0.94 - (random.nextDouble() * 0.02); // 6-8% degradation
                    } else if (modelName.equals("E2")) {
                        expectedDegradationRatio = 0.93 - (random.nextDouble() * 0.03); // 7-10% degradation
                    } else if (modelName.equals("E3")) {
                        expectedDegradationRatio = 0.92 - (random.nextDouble() * 0.02); // 8-10% degradation
                    }

                    double currentUsableCap = round(originalCap * expectedDegradationRatio, 2);
                    double soh = round((currentUsableCap / originalCap) * 100.0, 2);
                    double capacityLoss = round(originalCap - currentUsableCap, 2);

                    // Add battery assessment timeline
                    // For vehicles owned for more than 4 months, let's create a history of assessments
                    int assessmentsCount = 1;
                    if (monthsAgo >= 9) {
                        assessmentsCount = 4;
                    } else if (monthsAgo >= 5) {
                        assessmentsCount = 2;
                    }

                    for (int aIdx = 1; aIdx <= assessmentsCount; aIdx++) {
                        double ratio = aIdx / (double) assessmentsCount;
                        double histAge = round(ageYears * ratio, 2);
                        double histOdo = round(odometer * ratio, 0);
                        int histCycles = (int) (cycles * ratio);
                        double histDegradation = 1.0 - ((1.0 - expectedDegradationRatio) * ratio);
                        double histUsable = round(originalCap * histDegradation, 2);
                        double histSoh = round((histUsable / originalCap) * 100.0, 2);

                        BatteryAnalysis assessment = new BatteryAnalysis();
                        assessment.setVehicle(vehicle);
                        assessment.setVehicleId(vehicleId);
                        assessment.setManufacturer("EV Company");
                        assessment.setModel(modelName);
                        assessment.setBatteryAge(histAge);
                        assessment.setOdometer(histOdo);
                        assessment.setOriginalCapacity(originalCap);
                        assessment.setCurrentUsableCapacity(histUsable);
                        assessment.setCurrentBatteryPercentage(80.0);
                        assessment.setChargingCycles(histCycles);
                        
                        // Higher temperatures for hot models
                        double avgTemp = 22.0 + (random.nextDouble() * 8.0);
                        if (modelName.equals("EV 360") && i % 3 == 0) {
                            avgTemp += 6.0; // Overheating cases
                        }
                        assessment.setAverageTemperature(round(avgTemp, 1));
                        assessment.setAverageRange(round(350.0 * histDegradation, 0));
                        assessment.setNormalChargingPercentage(75.0);
                        assessment.setFastChargingPercentage(25.0);
                        assessment.setSoh(histSoh);
                        assessment.setCapacityLoss(round(originalCap - histUsable, 2));

                        // Condition
                        String condition = "Excellent";
                        if (histSoh < 75.0) condition = "Degraded";
                        else if (histSoh < 85.0) condition = "Moderate";
                        else if (histSoh < 93.0) condition = "Good";
                        assessment.setCondition(condition);

                        // Safety score calculation
                        double safety = 100.0 - (100.0 - histSoh) * 0.8;
                        if (avgTemp > 35) safety -= (avgTemp - 35) * 2.0;
                        assessment.setSafetyScore((int) Math.max(0.0, Math.min(100.0, Math.round(safety))));
                        assessment.setRiskLevel(safety >= 85 ? "LOW" : (safety >= 65 ? "MEDIUM" : "HIGH"));
                        assessment.setConfidenceScore(95.0);
                        assessment.setExplanation("Telemetry assessed via Company data seeder.");
                        assessment.setCreatedAt(saleDate.plusMonths((int) (monthsAgo * ratio)));
                        
                        batteryAnalysisRepository.save(assessment);
                        seededAnalyses.add(assessment);
                    }

                    // Seed service visits for some vehicles
                    // First service generally happens around 6 months or 8000 km
                    if (odometer > 8000.0) {
                        LocalDateTime serviceDate = saleDate.plusMonths(6);
                        
                        // Check if this vehicle has service problems
                        boolean hasChargingIssue = modelName.equals("EV 360") && (i % 2 == 0); // 50% charging issue rate in seeded sample for EV 360
                        boolean hasDegradation = modelName.equals("EV 360") && (i % 3 == 0);
                        boolean hasOtherIssue = (i % 5 == 0);

                        String serviceType = "First Service";
                        Double serviceSoh = round(soh + 3.0, 1); // was healthier back then
                        String notes = "Routine checks performed. Charging port inspected.";
                        Double repairTime = 1.5;
                        
                        ServiceRecord service = new ServiceRecord(
                                vehicleId, "EV Company", modelName, currentServiceCenterId, serviceCenterName,
                                serviceDate, serviceType, 7500.0, serviceSoh, notes, "COMPLETED", repairTime, false
                        );
                        serviceRecordRepository.save(service);
                        seededServices.add(service);

                        // Seed issues found
                        if (hasChargingIssue) {
                            ServiceIssue issue = new ServiceIssue(
                                    service.getId(), vehicleId, "EV Company", modelName, "Charging issue", "HIGH",
                                    "Customer reports vehicle refuses to initiate fast DC charging and shows terminal error.",
                                    serviceDate, serviceDate.plusDays(2)
                            );
                            serviceIssueRepository.save(issue);
                            seededIssues.add(issue);
                        }
                        
                        if (hasDegradation) {
                            ServiceIssue issue = new ServiceIssue(
                                    service.getId(), vehicleId, "EV Company", modelName, "Battery degradation", "MEDIUM",
                                    "Capacity assessment shows usable retention below 85% after moderate cycles. Cell pack balanced.",
                                    serviceDate, serviceDate.plusDays(1)
                            );
                            serviceIssueRepository.save(issue);
                            seededIssues.add(issue);
                        }

                        // Seed a second service visit for repeat service testing
                        if (odometer > 18000.0 && (hasChargingIssue || hasDegradation)) {
                            LocalDateTime serviceDate2 = serviceDate.plusMonths(6);
                            ServiceRecord service2 = new ServiceRecord(
                                    vehicleId, "EV Company", modelName, currentServiceCenterId, serviceCenterName,
                                    serviceDate2, "Repair", 18500.0, soh, "Revisited for charging issues. BMS controller reflashed.", 
                                    "COMPLETED", 4.0, true
                            );
                            serviceRecordRepository.save(service2);
                            seededServices.add(service2);

                            ServiceIssue issue2 = new ServiceIssue(
                                    service2.getId(), vehicleId, "EV Company", modelName, "BMS warning", "MEDIUM",
                                    "BMS logged error code B204-1 (Overvoltage fault). Reflashed firmware and replaced wiring harness.",
                                    serviceDate2, serviceDate2
                            );
                            serviceIssueRepository.save(issue2);
                            seededIssues.add(issue2);
                        }
                    }
                }
            }

            System.out.println(String.format(">>> Successfully seeded company analytics database logs: %d sales, %d vehicles, %d battery logs, %d service visits, %d customer problems.",
                    seededSales.size(), seededVehicles.size(), seededAnalyses.size(), seededServices.size(), seededIssues.size()));
        }

        // Ensure standard demo vehicles exist with historical assessments
        seedSpecificVehicleWithHistory("VIN-1001", "Tesla", "E1", "ELECTRIC_CAR", 45.0, customerUser);
        seedSpecificVehicleWithHistory("VIN-TEST-101", "EV Company", "EV 360", "ELECTRIC_CAR", 45.0, customerUser);
    }

    private void seedSpecificVehicleWithHistory(String vehicleId, String manufacturer, String model, String type, double originalCap, User user) {
        if (vehicleRepository.findByVehicleId(vehicleId).isEmpty()) {
            Vehicle v = new Vehicle(vehicleId, type, manufacturer, model);
            if (user != null) v.setUser(user);
            vehicleRepository.save(v);

            // Assessment 1: 5 months ago
            BatteryAnalysis a1 = new BatteryAnalysis();
            a1.setVehicle(v);
            a1.setVehicleId(vehicleId);
            a1.setManufacturer(manufacturer);
            a1.setModel(model);
            a1.setBatteryAge(1.1);
            a1.setOdometer(14500.0);
            a1.setOriginalCapacity(originalCap);
            a1.setCurrentUsableCapacity(round(originalCap * 0.948, 2));
            a1.setCurrentBatteryPercentage(85.0);
            a1.setChargingCycles(112);
            a1.setAverageTemperature(26.5);
            a1.setAverageRange(335.0);
            a1.setNormalChargingPercentage(80.0);
            a1.setFastChargingPercentage(20.0);
            a1.setSoh(94.8);
            a1.setCapacityLoss(round(originalCap - a1.getCurrentUsableCapacity(), 2));
            a1.setCondition("Excellent");
            a1.setSafetyScore(95);
            a1.setRiskLevel("LOW");
            a1.setConfidenceScore(96.0);
            a1.setExplanation("Routine preventive maintenance assessment. Cell voltage distribution tightly matched (9 mV delta). Thermal dissipation optimal.");
            a1.setCreatedAt(LocalDateTime.of(2026, 4, 15, 10, 30));
            batteryAnalysisRepository.save(a1);

            // Assessment 2: 1.5 months ago (most recent before complaint date 2026-09-30)
            BatteryAnalysis a2 = new BatteryAnalysis();
            a2.setVehicle(v);
            a2.setVehicleId(vehicleId);
            a2.setManufacturer(manufacturer);
            a2.setModel(model);
            a2.setBatteryAge(1.5);
            a2.setOdometer(21800.0);
            a2.setOriginalCapacity(originalCap);
            a2.setCurrentUsableCapacity(round(originalCap * 0.884, 2));
            a2.setCurrentBatteryPercentage(78.0);
            a2.setChargingCycles(198);
            a2.setAverageTemperature(33.2);
            a2.setAverageRange(295.0);
            a2.setNormalChargingPercentage(65.0);
            a2.setFastChargingPercentage(35.0);
            a2.setSoh(88.4);
            a2.setCapacityLoss(round(originalCap - a2.getCurrentUsableCapacity(), 2));
            a2.setCondition("Good");
            a2.setSafetyScore(87);
            a2.setRiskLevel("LOW");
            a2.setConfidenceScore(94.0);
            a2.setExplanation("Pre-complaint evaluation. Usable capacity dropped 6.4% over recent high-speed driving period. Elevated fast-charging frequency noted with mild thermal rise during peak load.");
            a2.setCreatedAt(LocalDateTime.of(2026, 8, 22, 14, 45));
            batteryAnalysisRepository.save(a2);

            System.out.println(">>> Seeded vehicle with history: " + vehicleId);
        }
    }

    private double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        if (Double.isNaN(value) || Double.isInfinite(value)) return 0.0;
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}

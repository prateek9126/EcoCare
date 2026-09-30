package com.example.evbatteryhealth.service;

import com.example.evbatteryhealth.model.BatteryAnalysis;
import com.example.evbatteryhealth.model.Vehicle;
import com.example.evbatteryhealth.model.User;
import com.example.evbatteryhealth.repository.BatteryAnalysisRepository;
import com.example.evbatteryhealth.repository.VehicleRepository;
import com.example.evbatteryhealth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class BatteryAnalysisService {

    private final BatteryAnalysisRepository repository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Autowired
    public BatteryAnalysisService(BatteryAnalysisRepository repository, 
                                  VehicleRepository vehicleRepository,
                                  UserRepository userRepository) {
        this.repository = repository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }


    public BatteryAnalysis analyzeAndSave(BatteryAnalysis input, String userEmail) {
        // 0. Handle Vehicle lookup or registration
        Vehicle vehicle;
        String inVehicleId = input.getVehicleId();
        
        User user = null;
        if (userEmail != null && !userEmail.trim().isEmpty() && !"admin".equalsIgnoreCase(userEmail.trim())) {
            user = userRepository.findByGmail(userEmail.trim().toLowerCase()).orElse(null);
        }

        if (inVehicleId != null && !inVehicleId.trim().isEmpty()) {
            String trimmedId = inVehicleId.trim();
            Optional<Vehicle> optVehicle = vehicleRepository.findByVehicleId(trimmedId);
            
            if (optVehicle.isPresent()) {
                // Returning vehicle
                vehicle = optVehicle.get();
                
                // Verify ownership: if vehicle belongs to another user, restrict access
                if (vehicle.getUser() != null && user != null && !vehicle.getUser().getId().equals(user.getId())) {
                    throw new SecurityException("Vehicle is registered to another user.");
                }
                
                // Claim ownership if not owned (e.g. legacy database records)
                if (vehicle.getUser() == null && user != null) {
                    vehicle.setUser(user);
                    vehicle = vehicleRepository.save(vehicle);
                }
                
                // Retrieve latest previous assessment to compute deltas
                List<BatteryAnalysis> prevAssessments = repository.findByVehicleVehicleIdOrderByCreatedAtAsc(vehicle.getVehicleId());
                if (!prevAssessments.isEmpty()) {
                    BatteryAnalysis latestPrev = prevAssessments.get(prevAssessments.size() - 1);
                    
                    double capChange = round(input.getCurrentUsableCapacity() - latestPrev.getCurrentUsableCapacity(), 2);
                    double sohChange = round(((input.getCurrentUsableCapacity() / input.getOriginalCapacity()) * 100.0) - latestPrev.getSoh(), 2);
                    double odoChange = round(input.getOdometer() - latestPrev.getOdometer(), 2);
                    int cycChange = input.getChargingCycles() - latestPrev.getChargingCycles();
                    double ranChange = round(input.getAverageRange() - latestPrev.getAverageRange(), 2);
                    double ageChange = round(input.getBatteryAge() - latestPrev.getBatteryAge(), 2);
                    
                    input.setUsableCapacityChange(capChange);
                    input.setSohChange(sohChange);
                    input.setOdometerChange(odoChange);
                    input.setCyclesChange(cycChange);
                    input.setRangeChange(ranChange);
                    input.setAgeChange(ageChange);
                }
            } else {
                // Register as new vehicle with the user-defined vehicle ID (Vehicle Number)
                String vehicleType = input.getVehicleType();
                if (vehicleType == null || vehicleType.trim().isEmpty()) {
                    vehicleType = "car";
                }
                
                vehicle = new Vehicle(trimmedId, vehicleType, input.getManufacturer(), input.getModel());
                if (user != null) {
                    vehicle.setUser(user);
                }
                vehicle = vehicleRepository.save(vehicle);
            }
        } else {
            // New vehicle registration with auto-generated ID
            String generatedId;
            do {
                generatedId = generateUniqueVehicleId();
            } while (vehicleRepository.findByVehicleId(generatedId).isPresent());
            
            String vehicleType = input.getVehicleType();
            if (vehicleType == null || vehicleType.trim().isEmpty()) {
                vehicleType = "car";
            }
            
            vehicle = new Vehicle(generatedId, vehicleType, input.getManufacturer(), input.getModel());
            if (user != null) {
                vehicle.setUser(user);
            }
            vehicle = vehicleRepository.save(vehicle);
        }
        
        input.setVehicle(vehicle);
        input.setVehicleId(vehicle.getVehicleId());

        // 1. Calculate SoH
        double rawSoh = (input.getCurrentUsableCapacity() / input.getOriginalCapacity()) * 100.0;
        double soh = round(rawSoh, 2);
        soh = Math.min(100.0, Math.max(0.0, soh));
        input.setSoh(soh);

        // 2. Calculate Capacity Loss
        double capacityLoss = round(input.getOriginalCapacity() - input.getCurrentUsableCapacity(), 2);
        input.setCapacityLoss(Math.max(0.0, capacityLoss));

        // 3. Determine Battery Condition
        String condition;
        if (soh >= 90.0) {
            condition = "Excellent";
        } else if (soh >= 80.0) {
            condition = "Good";
        } else if (soh >= 70.0) {
            condition = "Moderate";
        } else {
            condition = "Degraded";
        }
        input.setCondition(condition);

        // 4. Calculate Data Confidence Score
        double confidence = calculateConfidence(input);
        input.setConfidenceScore(confidence);

        // 4.5. Calculate Safety Score & Risk Level
        double safety = 100.0;
        if (input.getAverageTemperature() > 35) {
            safety -= (input.getAverageTemperature() - 35) * 2.0;
        }
        if (input.getFastChargingPercentage() > 50) {
            safety -= (input.getFastChargingPercentage() - 50) * 0.3;
        }
        if (soh < 100.0) {
            safety -= (100.0 - soh) * 1.0;
        }
        if (input.getChargingCycles() > 1000) {
            safety -= (input.getChargingCycles() - 1000) / 100.0;
        }
        int finalSafetyScore = (int) Math.max(0.0, Math.min(100.0, Math.round(safety)));
        input.setSafetyScore(finalSafetyScore);

        String risk;
        if (finalSafetyScore >= 85) {
            risk = "LOW";
        } else if (finalSafetyScore >= 65) {
            risk = "MEDIUM";
        } else {
            risk = "HIGH";
        }
        input.setRiskLevel(risk);

        // 5. Generate Explanation
        String explanation = generateExplanation(input, soh, capacityLoss, condition);
        input.setExplanation(explanation);

        // Set creation time
        input.setCreatedAt(LocalDateTime.now());

        // Save and return
        return repository.save(input);
    }

    public List<BatteryAnalysis> getHistory(String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty() || "admin".equalsIgnoreCase(userEmail.trim())) {
            return repository.findAllByOrderByCreatedAtAsc();
        }
        return repository.findByVehicleUserGmailOrderByCreatedAtAsc(userEmail.trim().toLowerCase());
    }

    public List<BatteryAnalysis> getHistoryByModel(String userEmail, String manufacturer, String model) {
        if (userEmail == null || userEmail.trim().isEmpty() || "admin".equalsIgnoreCase(userEmail.trim())) {
            return repository.findByManufacturerAndModelOrderByCreatedAtAsc(manufacturer, model);
        }
        return repository.findByVehicleUserGmailAndManufacturerAndModelOrderByCreatedAtAsc(userEmail.trim().toLowerCase(), manufacturer, model);
    }

    public Optional<Vehicle> findVehicleByVehicleId(String vehicleId, String userEmail) {
        Optional<Vehicle> optVehicle = vehicleRepository.findByVehicleId(vehicleId);
        if (optVehicle.isPresent()) {
            Vehicle vehicle = optVehicle.get();
            // Auth check: if vehicle has user and userEmail is not admin/matching
            if (vehicle.getUser() != null) {
                if (userEmail == null || userEmail.trim().isEmpty()) {
                    return Optional.empty(); // Unauthorized
                }
                if (!"admin".equalsIgnoreCase(userEmail.trim()) && !vehicle.getUser().getGmail().equalsIgnoreCase(userEmail.trim())) {
                    return Optional.empty(); // Unauthorized
                }
            }
        }
        return optVehicle;
    }

    public List<BatteryAnalysis> getHistoryByVehicleId(String vehicleId, String userEmail) {
        Optional<Vehicle> optVehicle = findVehicleByVehicleId(vehicleId, userEmail);
        if (optVehicle.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return repository.findByVehicleVehicleIdOrderByCreatedAtAsc(vehicleId);
    }

    public List<Vehicle> getVehiclesByUserEmail(String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty() || "admin".equalsIgnoreCase(userEmail.trim())) {
            return vehicleRepository.findAll();
        }
        return vehicleRepository.findByUserGmail(userEmail.trim().toLowerCase());
    }

    public void clearHistory() {
        repository.deleteAll();
        vehicleRepository.deleteAll();

    }

    private String generateUniqueVehicleId() {
        int year = LocalDateTime.now().getYear();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random rnd = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return "EV-" + year + "-" + sb.toString();
    }

    private double calculateConfidence(BatteryAnalysis input) {
        double score = 0.0;
        
        // Manufacturer & Model
        if (input.getManufacturer() != null && !input.getManufacturer().isBlank() &&
            input.getModel() != null && !input.getModel().isBlank()) {
            score += 15.0;
        }

        // Battery Age
        if (input.getBatteryAge() != null && input.getBatteryAge() > 0) {
            score += 10.0;
        }

        // Odometer
        if (input.getOdometer() != null && input.getOdometer() > 0) {
            score += 15.0;
        }

        // Capacity Inputs
        if (input.getOriginalCapacity() != null && input.getOriginalCapacity() > 0 &&
            input.getCurrentUsableCapacity() != null && input.getCurrentUsableCapacity() > 0) {
            score += 20.0;
        }

        // Charging Cycles
        if (input.getChargingCycles() != null && input.getChargingCycles() > 0) {
            score += 15.0;
        }

        // Average Temperature
        if (input.getAverageTemperature() != null) {
            score += 10.0;
        }

        // Normal vs Fast Charging
        if (input.getNormalChargingPercentage() != null && input.getFastChargingPercentage() != null) {
            double total = input.getNormalChargingPercentage() + input.getFastChargingPercentage();
            if (Math.abs(total - 100.0) < 1.0) {
                score += 15.0; // perfect
            } else if (total > 0) {
                score += 5.0;  // partially provided
            }
        }

        return round(score, 1);
    }

    private String generateExplanation(BatteryAnalysis input, double soh, double capacityLoss, String condition) {
        StringBuilder sb = new StringBuilder();
        
        // SOH overview
        sb.append(String.format("Estimated Battery Health is %s%% (Condition: %s). ", soh, condition));
        sb.append(String.format("The pack has lost %s kWh of its original %s kWh usable capacity, meaning it is currently operating at %s kWh. ", 
                  capacityLoss, input.getOriginalCapacity(), input.getCurrentUsableCapacity()));

        // Age vs Odometer vs Cycles analysis
        double annualOdometer = input.getBatteryAge() > 0 ? (input.getOdometer() / input.getBatteryAge()) : 0;
        double cyclesPerYear = input.getBatteryAge() > 0 ? (input.getChargingCycles() / input.getBatteryAge()) : 0;
        
        sb.append(String.format("With an odometer reading of %,.0f km over %.1f years, the vehicle averages %,.0f km annually. ",
                  input.getOdometer(), input.getBatteryAge(), annualOdometer));
        
        sb.append(String.format("The battery has experienced %d charging cycles (approx. %.0f cycles/year). ", 
                  input.getChargingCycles(), cyclesPerYear));

        // Degradation rate check
        double expectedLossPerYear = 2.0; // standard EV cell capacity loss is ~1.5% - 2.5% per year
        double actualLossPerYear = input.getBatteryAge() > 0 ? ((100.0 - soh) / input.getBatteryAge()) : 0;

        if (actualLossPerYear > expectedLossPerYear + 1.0) {
            sb.append("This degradation rate is higher than average, which can be linked to external factors. ");
        } else if (actualLossPerYear < expectedLossPerYear - 0.5) {
            sb.append("This represents an exceptionally low degradation rate, indicating excellent battery health management. ");
        } else {
            sb.append("This is well within normal engineering expectations for lithium-ion battery chemistry. ");
        }

        // Charging behavior impact
        if (input.getFastChargingPercentage() > 40.0) {
            sb.append(String.format("The high utilization of DC Fast Charging (%.0f%%) is a primary stress factor. Frequent rapid charging subjects the cells to elevated thermal levels and higher current density, accelerating capacity fade. ", 
                      input.getFastChargingPercentage()));
        } else {
            sb.append(String.format("Your charging profile is highly favorable, with %.0f%% of charging completed on normal AC levels. Minimizing rapid charging is helping prevent micro-cracking and lithium plating on the anodes. ", 
                      input.getNormalChargingPercentage()));
        }

        // Temperature impact
        if (input.getAverageTemperature() > 30.0) {
            sb.append(String.format("The average battery temperature of %.1f°C is elevated. High ambient and operational temperatures promote secondary chemical reactions that consume active lithium, leading to faster permanent capacity loss. ", 
                      input.getAverageTemperature()));
        } else if (input.getAverageTemperature() < 10.0) {
            sb.append(String.format("Operating in a cold climate (average %.1f°C) temporarily decreases lithium ion mobility and reduces range, but helps retard long-term chemical aging of the cell pack. ", 
                      input.getAverageTemperature()));
        } else {
            sb.append(String.format("The average operating temperature of %.1f°C is in the sweet spot (15°C - 25°C), preventing thermal degradation. ", 
                      input.getAverageTemperature()));
        }

        // Actionable recommendation
        if (soh < 75.0) {
            sb.append("Recommendation: Schedule a professional dealer diagnostic. Consider adjusting the maximum charge limit to 80% and avoid discharging below 10% to stabilize health.");
        } else if (soh < 85.0) {
            sb.append("Recommendation: To maximize battery life, keep the daily charge limit set to 80%, avoid leaving the car at 100% State of Charge in hot weather, and use normal AC charging where possible.");
        } else {
            sb.append("Recommendation: Continue standard battery management. The battery chemistry is in healthy condition. Standard charging limits (up to 80%-90% daily) are recommended.");
        }

        return sb.toString();
    }

    public Optional<java.util.Map<String, Object>> getPublicAssessment(Long id) {
        return repository.findById(id).map(analysis -> {
            List<BatteryAnalysis> history = java.util.Collections.emptyList();
            if (analysis.getVehicle() != null) {
                history = repository.findByVehicleVehicleIdOrderByCreatedAtAsc(analysis.getVehicle().getVehicleId());
                for (int i = 0; i < history.size(); i++) {
                    BatteryAnalysis item = history.get(i);
                    item.setVehicleId(item.getVehicle().getVehicleId());
                    item.setVehicleType(item.getVehicle().getVehicleType());
                    if (i > 0) {
                        BatteryAnalysis prev = history.get(i - 1);
                        double sohDiff = round(((item.getCurrentUsableCapacity() / item.getOriginalCapacity()) * 100.0) - prev.getSoh(), 2);
                        item.setSohChange(sohDiff);
                        item.setUsableCapacityChange(round(item.getCurrentUsableCapacity() - prev.getCurrentUsableCapacity(), 2));
                        item.setOdometerChange(round(item.getOdometer() - prev.getOdometer(), 2));
                        item.setCyclesChange(item.getChargingCycles() - prev.getChargingCycles());
                        item.setRangeChange(round(item.getAverageRange() - prev.getAverageRange(), 2));
                        item.setAgeChange(round(item.getBatteryAge() - prev.getBatteryAge(), 2));
                    } else {
                        item.setSohChange(0.0);
                        item.setUsableCapacityChange(0.0);
                        item.setOdometerChange(0.0);
                        item.setCyclesChange(0);
                        item.setRangeChange(0.0);
                        item.setAgeChange(0.0);
                    }
                }
            }
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            if (analysis.getVehicle() != null) {
                analysis.setVehicleId(analysis.getVehicle().getVehicleId());
                analysis.setVehicleType(analysis.getVehicle().getVehicleType());
            }
            response.put("assessment", analysis);
            response.put("history", history);
            return response;
        });
    }

    private double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}

package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "battery_analyses")
public class BatteryAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_db_id")
    private Vehicle vehicle;

    @Transient
    private String vehicleId;

    @Transient
    private String vehicleType;

    @Transient
    private Double usableCapacityChange;

    @Transient
    private Double sohChange;

    @Transient
    private Double odometerChange;

    @Transient
    private Integer cyclesChange;

    @Transient
    private Double rangeChange;

    @Transient
    private Double ageChange;

    @Column(name = "safety_score")
    private Integer safetyScore;

    @Column(name = "risk_level")
    private String riskLevel;

    // Inputs
    @NotBlank(message = "Manufacturer is required")
    private String manufacturer;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Battery age is required")
    @Min(value = 0, message = "Battery age must be positive")
    private Double batteryAge;

    @NotNull(message = "Odometer is required")
    @Min(value = 0, message = "Odometer must be positive")
    private Double odometer;

    @NotNull(message = "Original capacity is required")
    @Positive(message = "Original capacity must be positive")
    private Double originalCapacity;

    @NotNull(message = "Current usable capacity is required")
    @Positive(message = "Current usable capacity must be positive")
    private Double currentUsableCapacity;

    @NotNull(message = "Current battery percentage is required")
    @Min(value = 0, message = "Current battery % cannot be negative")
    @Max(value = 100, message = "Current battery % cannot exceed 100")
    private Double currentBatteryPercentage;

    @NotNull(message = "Charging cycles is required")
    @Min(value = 0, message = "Charging cycles must be positive")
    private Integer chargingCycles;

    @NotNull(message = "Average temperature is required")
    private Double averageTemperature;

    @NotNull(message = "Average range is required")
    @Min(value = 0, message = "Average range must be positive")
    private Double averageRange;

    @NotNull(message = "Normal charging % is required")
    @Min(value = 0, message = "Normal charging % cannot be negative")
    @Max(value = 100, message = "Normal charging % cannot exceed 100")
    private Double normalChargingPercentage;

    @NotNull(message = "Fast charging % is required")
    @Min(value = 0, message = "Fast charging % cannot be negative")
    @Max(value = 100, message = "Fast charging % cannot exceed 100")
    private Double fastChargingPercentage;

    // Outputs
    private Double soh;
    private Double capacityLoss;
    private String condition;
    private Double confidenceScore;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    private LocalDateTime createdAt;

    // Constructors
    public BatteryAnalysis() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Double getBatteryAge() {
        return batteryAge;
    }

    public void setBatteryAge(Double batteryAge) {
        this.batteryAge = batteryAge;
    }

    public Double getOdometer() {
        return odometer;
    }

    public void setOdometer(Double odometer) {
        this.odometer = odometer;
    }

    public Double getOriginalCapacity() {
        return originalCapacity;
    }

    public void setOriginalCapacity(Double originalCapacity) {
        this.originalCapacity = originalCapacity;
    }

    public Double getCurrentUsableCapacity() {
        return currentUsableCapacity;
    }

    public void setCurrentUsableCapacity(Double currentUsableCapacity) {
        this.currentUsableCapacity = currentUsableCapacity;
    }

    public Double getCurrentBatteryPercentage() {
        return currentBatteryPercentage;
    }

    public void setCurrentBatteryPercentage(Double currentBatteryPercentage) {
        this.currentBatteryPercentage = currentBatteryPercentage;
    }

    public Integer getChargingCycles() {
        return chargingCycles;
    }

    public void setChargingCycles(Integer chargingCycles) {
        this.chargingCycles = chargingCycles;
    }

    public Double getAverageTemperature() {
        return averageTemperature;
    }

    public void setAverageTemperature(Double averageTemperature) {
        this.averageTemperature = averageTemperature;
    }

    public Double getAverageRange() {
        return averageRange;
    }

    public void setAverageRange(Double averageRange) {
        this.averageRange = averageRange;
    }

    public Double getNormalChargingPercentage() {
        return normalChargingPercentage;
    }

    public void setNormalChargingPercentage(Double normalChargingPercentage) {
        this.normalChargingPercentage = normalChargingPercentage;
    }

    public Double getFastChargingPercentage() {
        return fastChargingPercentage;
    }

    public void setFastChargingPercentage(Double fastChargingPercentage) {
        this.fastChargingPercentage = fastChargingPercentage;
    }

    public Double getSoh() {
        return soh;
    }

    public void setSoh(Double soh) {
        this.soh = soh;
    }

    public Double getCapacityLoss() {
        return capacityLoss;
    }

    public void setCapacityLoss(Double capacityLoss) {
        this.capacityLoss = capacityLoss;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public Double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(Double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public String getVehicleId() {
        if (vehicleId == null && vehicle != null) {
            return vehicle.getVehicleId();
        }
        return vehicleId;
    }

    public void setVehicleId(String vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Double getUsableCapacityChange() {
        return usableCapacityChange;
    }

    public void setUsableCapacityChange(Double usableCapacityChange) {
        this.usableCapacityChange = usableCapacityChange;
    }

    public Double getSohChange() {
        return sohChange;
    }

    public void setSohChange(Double sohChange) {
        this.sohChange = sohChange;
    }

    public Double getOdometerChange() {
        return odometerChange;
    }

    public void setOdometerChange(Double odometerChange) {
        this.odometerChange = odometerChange;
    }

    public Integer getCyclesChange() {
        return cyclesChange;
    }

    public void setCyclesChange(Integer cyclesChange) {
        this.cyclesChange = cyclesChange;
    }

    public Double getRangeChange() {
        return rangeChange;
    }

    public void setRangeChange(Double rangeChange) {
        this.rangeChange = rangeChange;
    }

    public Double getAgeChange() {
        return ageChange;
    }

    public void setAgeChange(Double ageChange) {
        this.ageChange = ageChange;
    }

    public String getVehicleType() {
        if (vehicleType == null && vehicle != null) {
            return vehicle.getVehicleType();
        }
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public Integer getSafetyScore() {
        return safetyScore;
    }

    public void setSafetyScore(Integer safetyScore) {
        this.safetyScore = safetyScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }
}

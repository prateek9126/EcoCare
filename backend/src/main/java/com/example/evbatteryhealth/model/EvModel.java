package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "ev_models")
public class EvModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Company is required")
    private String company;

    @NotNull(message = "Model name is required")
    private String model;

    @NotNull(message = "Vehicle type is required")
    private String vehicleType; // ELECTRIC_SCOOTER, ELECTRIC_BIKE, ELECTRIC_CAR

    private String bodyType; // Hatchback, Sedan, SUV, MPV, Commuter, Street, Performance, Standard, Premium, Utility

    @NotNull(message = "Minimum ex-showroom price is required")
    private Double minPrice;

    @NotNull(message = "Maximum ex-showroom price is required")
    private Double maxPrice;

    @NotNull(message = "Range is required")
    private Integer rangeKm;

    private Double batteryCapacityKwh;

    private Integer chargingTimeMins;

    private String fastCharging; // e.g. "50 kW DC", "Yes", "No"

    private Integer topSpeedKmh;

    private Double userRating;

    private Integer reviewsCount;

    private Integer warrantyYears;

    private Integer safetyRating; // 0-5 stars

    private Integer serviceCenterCount;

    @Column(length = 1000)
    private String serviceCenterAvailabilityByCity; // comma-separated cities

    @Column(length = 1000)
    private String positiveFactors; // comma-separated pros

    @Column(length = 1000)
    private String negativeFactors; // comma-separated cons

    @Column(length = 1000)
    private String availableCities; // comma-separated cities

    private String imageUrl;

    private Double estimatedRunningCostPerKm;

    public EvModel() {}

    public EvModel(String company, String model, String vehicleType, String bodyType, Double minPrice, Double maxPrice,
                    Integer rangeKm, Double batteryCapacityKwh, Integer chargingTimeMins, String fastCharging,
                    Integer topSpeedKmh, Double userRating, Integer reviewsCount, Integer warrantyYears,
                    Integer safetyRating, Integer serviceCenterCount, String serviceCenterAvailabilityByCity,
                    String positiveFactors, String negativeFactors, String availableCities, String imageUrl,
                    Double estimatedRunningCostPerKm) {
        this.company = company;
        this.model = model;
        this.vehicleType = vehicleType;
        this.bodyType = bodyType;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.rangeKm = rangeKm;
        this.batteryCapacityKwh = batteryCapacityKwh;
        this.chargingTimeMins = chargingTimeMins;
        this.fastCharging = fastCharging;
        this.topSpeedKmh = topSpeedKmh;
        this.userRating = userRating;
        this.reviewsCount = reviewsCount;
        this.warrantyYears = warrantyYears;
        this.safetyRating = safetyRating;
        this.serviceCenterCount = serviceCenterCount;
        this.serviceCenterAvailabilityByCity = serviceCenterAvailabilityByCity;
        this.positiveFactors = positiveFactors;
        this.negativeFactors = negativeFactors;
        this.availableCities = availableCities;
        this.imageUrl = imageUrl;
        this.estimatedRunningCostPerKm = estimatedRunningCostPerKm;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getBodyType() {
        return bodyType;
    }

    public void setBodyType(String bodyType) {
        this.bodyType = bodyType;
    }

    public Double getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(Double minPrice) {
        this.minPrice = minPrice;
    }

    public Double getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(Double maxPrice) {
        this.maxPrice = maxPrice;
    }

    public Integer getRangeKm() {
        return rangeKm;
    }

    public void setRangeKm(Integer rangeKm) {
        this.rangeKm = rangeKm;
    }

    public Double getBatteryCapacityKwh() {
        return batteryCapacityKwh;
    }

    public void setBatteryCapacityKwh(Double batteryCapacityKwh) {
        this.batteryCapacityKwh = batteryCapacityKwh;
    }

    public Integer getChargingTimeMins() {
        return chargingTimeMins;
    }

    public void setChargingTimeMins(Integer chargingTimeMins) {
        this.chargingTimeMins = chargingTimeMins;
    }

    public String getFastCharging() {
        return fastCharging;
    }

    public void setFastCharging(String fastCharging) {
        this.fastCharging = fastCharging;
    }

    public Integer getTopSpeedKmh() {
        return topSpeedKmh;
    }

    public void setTopSpeedKmh(Integer topSpeedKmh) {
        this.topSpeedKmh = topSpeedKmh;
    }

    public Double getUserRating() {
        return userRating;
    }

    public void setUserRating(Double userRating) {
        this.userRating = userRating;
    }

    public Integer getReviewsCount() {
        return reviewsCount;
    }

    public void setReviewsCount(Integer reviewsCount) {
        this.reviewsCount = reviewsCount;
    }

    public Integer getWarrantyYears() {
        return warrantyYears;
    }

    public void setWarrantyYears(Integer warrantyYears) {
        this.warrantyYears = warrantyYears;
    }

    public Integer getSafetyRating() {
        return safetyRating;
    }

    public void setSafetyRating(Integer safetyRating) {
        this.safetyRating = safetyRating;
    }

    public Integer getServiceCenterCount() {
        return serviceCenterCount;
    }

    public void setServiceCenterCount(Integer serviceCenterCount) {
        this.serviceCenterCount = serviceCenterCount;
    }

    public String getServiceCenterAvailabilityByCity() {
        return serviceCenterAvailabilityByCity;
    }

    public void setServiceCenterAvailabilityByCity(String serviceCenterAvailabilityByCity) {
        this.serviceCenterAvailabilityByCity = serviceCenterAvailabilityByCity;
    }

    public String getPositiveFactors() {
        return positiveFactors;
    }

    public void setPositiveFactors(String positiveFactors) {
        this.positiveFactors = positiveFactors;
    }

    public String getNegativeFactors() {
        return negativeFactors;
    }

    public void setNegativeFactors(String negativeFactors) {
        this.negativeFactors = negativeFactors;
    }

    public String getAvailableCities() {
        return availableCities;
    }

    public void setAvailableCities(String availableCities) {
        this.availableCities = availableCities;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Double getEstimatedRunningCostPerKm() {
        return estimatedRunningCostPerKm;
    }

    public void setEstimatedRunningCostPerKm(Double estimatedRunningCostPerKm) {
        this.estimatedRunningCostPerKm = estimatedRunningCostPerKm;
    }
}

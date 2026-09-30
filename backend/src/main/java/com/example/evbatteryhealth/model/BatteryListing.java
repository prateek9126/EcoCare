package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "battery_listings")
public class BatteryListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seller_email", nullable = false)
    private String sellerEmail;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "vehicle_type")
    private String vehicleType;

    private String manufacturer;
    private String model;
    private String chemistry;
    private Double capacity;

    @Column(name = "estimated_soh")
    private Double estimatedSoH;

    @Column(name = "charging_cycles")
    private Integer chargingCycles;

    @Column(name = "battery_age")
    private Double batteryAge;

    private Double price;
    private String city;
    private String state;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private String status; // AVAILABLE, RESERVED, SOLD

    public BatteryListing() {
        this.createdAt = LocalDateTime.now();
        this.status = "AVAILABLE";
    }

    public BatteryListing(String sellerEmail, String vehicleType, String manufacturer, String model, 
                          String chemistry, Double capacity, Double estimatedSoH, Integer chargingCycles, 
                          Double batteryAge, Double price, String city, String state, String description, 
                          String imageUrl) {
        this.sellerEmail = sellerEmail;
        this.vehicleType = vehicleType;
        this.manufacturer = manufacturer;
        this.model = model;
        this.chemistry = chemistry;
        this.capacity = capacity;
        this.estimatedSoH = estimatedSoH;
        this.chargingCycles = chargingCycles;
        this.batteryAge = batteryAge;
        this.price = price;
        this.city = city;
        this.state = state;
        this.description = description;
        this.imageUrl = imageUrl;
        this.createdAt = LocalDateTime.now();
        this.status = "AVAILABLE";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSellerEmail() { return sellerEmail; }
    public void setSellerEmail(String sellerEmail) { this.sellerEmail = sellerEmail; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getChemistry() { return chemistry; }
    public void setChemistry(String chemistry) { this.chemistry = chemistry; }

    public Double getCapacity() { return capacity; }
    public void setCapacity(Double capacity) { this.capacity = capacity; }

    public Double getEstimatedSoH() { return estimatedSoH; }
    public void setEstimatedSoH(Double estimatedSoH) { this.estimatedSoH = estimatedSoH; }

    public Integer getChargingCycles() { return chargingCycles; }
    public void setChargingCycles(Integer chargingCycles) { this.chargingCycles = chargingCycles; }

    public Double getBatteryAge() { return batteryAge; }
    public void setBatteryAge(Double batteryAge) { this.batteryAge = batteryAge; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}

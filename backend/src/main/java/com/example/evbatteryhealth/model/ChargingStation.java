package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "charging_stations")
public class ChargingStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Station name is required")
    private String name;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;

    @NotNull(message = "Total ports is required")
    private Integer totalPorts;

    @NotNull(message = "Available ports is required")
    private Integer availablePorts;

    private String chargerType; // e.g., "DC Fast Charger", "AC Type 2"
    
    private Integer powerKw; // e.g., 60, 22, 120

    private String status; // e.g., "Available", "Busy", "Offline"

    private String address;

    @Transient
    private Double distanceKm;

    public ChargingStation() {}

    public ChargingStation(String name, Double latitude, Double longitude, Integer totalPorts, Integer availablePorts, String chargerType, Integer powerKw, String status, String address) {
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.totalPorts = totalPorts;
        this.availablePorts = availablePorts;
        this.chargerType = chargerType;
        this.powerKw = powerKw;
        this.status = status;
        this.address = address;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getTotalPorts() {
        return totalPorts;
    }

    public void setTotalPorts(Integer totalPorts) {
        this.totalPorts = totalPorts;
    }

    public Integer getAvailablePorts() {
        return availablePorts;
    }

    public void setAvailablePorts(Integer availablePorts) {
        this.availablePorts = availablePorts;
    }

    public String getChargerType() {
        return chargerType;
    }

    public void setChargerType(String chargerType) {
        this.chargerType = chargerType;
    }

    public Integer getPowerKw() {
        return powerKw;
    }

    public void setPowerKw(Integer powerKw) {
        this.powerKw = powerKw;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }
}

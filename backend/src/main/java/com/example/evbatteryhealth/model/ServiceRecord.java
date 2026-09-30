package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_records")
public class ServiceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private String vehicleId;

    @Column(nullable = false)
    private String manufacturer;

    @Column(nullable = false)
    private String model;

    @Column(name = "service_center_id")
    private Long serviceCenterId;

    @Column(name = "service_center_name")
    private String serviceCenterName;

    @Column(name = "service_date", nullable = false)
    private LocalDateTime serviceDate;

    @Column(name = "service_type", nullable = false)
    private String serviceType; // e.g., "First Service", "Routine Maintenance", "Repair"

    @Column(nullable = false)
    private Double mileage;

    @Column(name = "battery_soh", nullable = false)
    private Double batterySoh;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private String status; // "COMPLETED", "PENDING"

    @Column(name = "repair_time_hours")
    private Double repairTimeHours;

    @Column(name = "is_repeat_visit")
    private Boolean isRepeatVisit = false;

    public ServiceRecord() {}

    public ServiceRecord(String vehicleId, String manufacturer, String model, Long serviceCenterId, String serviceCenterName, 
                         LocalDateTime serviceDate, String serviceType, Double mileage, Double batterySoh, String notes, 
                         String status, Double repairTimeHours, Boolean isRepeatVisit) {
        this.vehicleId = vehicleId;
        this.manufacturer = manufacturer;
        this.model = model;
        this.serviceCenterId = serviceCenterId;
        this.serviceCenterName = serviceCenterName;
        this.serviceDate = serviceDate;
        this.serviceType = serviceType;
        this.mileage = mileage;
        this.batterySoh = batterySoh;
        this.notes = notes;
        this.status = status;
        this.repairTimeHours = repairTimeHours;
        this.isRepeatVisit = isRepeatVisit;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(String vehicleId) {
        this.vehicleId = vehicleId;
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

    public Long getServiceCenterId() {
        return serviceCenterId;
    }

    public void setServiceCenterId(Long serviceCenterId) {
        this.serviceCenterId = serviceCenterId;
    }

    public String getServiceCenterName() {
        return serviceCenterName;
    }

    public void setServiceCenterName(String serviceCenterName) {
        this.serviceCenterName = serviceCenterName;
    }

    public LocalDateTime getServiceDate() {
        return serviceDate;
    }

    public void setServiceDate(LocalDateTime serviceDate) {
        this.serviceDate = serviceDate;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public Double getMileage() {
        return mileage;
    }

    public void setMileage(Double mileage) {
        this.mileage = mileage;
    }

    public Double getBatterySoh() {
        return batterySoh;
    }

    public void setBatterySoh(Double batterySoh) {
        this.batterySoh = batterySoh;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getRepairTimeHours() {
        return repairTimeHours;
    }

    public void setRepairTimeHours(Double repairTimeHours) {
        this.repairTimeHours = repairTimeHours;
    }

    public Boolean getIsRepeatVisit() {
        return isRepeatVisit;
    }

    public void setIsRepeatVisit(Boolean isRepeatVisit) {
        this.isRepeatVisit = isRepeatVisit;
    }
}

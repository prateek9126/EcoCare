package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_issues")
public class ServiceIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_record_id")
    private Long serviceRecordId;

    @Column(name = "vehicle_id", nullable = false)
    private String vehicleId;

    @Column(nullable = false)
    private String manufacturer;

    @Column(nullable = false)
    private String model;

    @Column(name = "issue_type", nullable = false)
    private String issueType; // e.g., "Battery degradation", "Charging issue", "Reduced range", "BMS warning", "Overheating", "Slow charging", "Thermal issue"

    @Column(nullable = false)
    private String severity; // "LOW", "MEDIUM", "HIGH"

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "reported_date", nullable = false)
    private LocalDateTime reportedDate;

    @Column(name = "resolved_date")
    private LocalDateTime resolvedDate;

    public ServiceIssue() {}

    public ServiceIssue(Long serviceRecordId, String vehicleId, String manufacturer, String model, String issueType, 
                        String severity, String description, LocalDateTime reportedDate, LocalDateTime resolvedDate) {
        this.serviceRecordId = serviceRecordId;
        this.vehicleId = vehicleId;
        this.manufacturer = manufacturer;
        this.model = model;
        this.issueType = issueType;
        this.severity = severity;
        this.description = description;
        this.reportedDate = reportedDate;
        this.resolvedDate = resolvedDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getServiceRecordId() {
        return serviceRecordId;
    }

    public void setServiceRecordId(Long serviceRecordId) {
        this.serviceRecordId = serviceRecordId;
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

    public String getIssueType() {
        return issueType;
    }

    public void setIssueType(String issueType) {
        this.issueType = issueType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getReportedDate() {
        return reportedDate;
    }

    public void setReportedDate(LocalDateTime reportedDate) {
        this.reportedDate = reportedDate;
    }

    public LocalDateTime getResolvedDate() {
        return resolvedDate;
    }

    public void setResolvedDate(LocalDateTime resolvedDate) {
        this.resolvedDate = resolvedDate;
    }
}

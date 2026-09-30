package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "passport_links")
public class PassportLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "phone_number", nullable = false, unique = true)
    private String phoneNumber;

    @Column(name = "vehicle_id", nullable = false)
    private String vehicleId;

    @Column(name = "assessment_id", nullable = false)
    private Long assessmentId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public PassportLink() {
        this.createdAt = LocalDateTime.now();
    }

    public PassportLink(String phoneNumber, String vehicleId, Long assessmentId) {
        this.phoneNumber = phoneNumber;
        this.vehicleId = vehicleId;
        this.assessmentId = assessmentId;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getVehicleId() { return vehicleId; }
    public void setVehicleId(String vehicleId) { this.vehicleId = vehicleId; }

    public Long getAssessmentId() { return assessmentId; }
    public void setAssessmentId(Long assessmentId) { this.assessmentId = assessmentId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

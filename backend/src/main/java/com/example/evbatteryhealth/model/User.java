package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(unique = true, nullable = false)
    private String gmail;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "role")
    private String role = "ROLE_USER";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public User() {
        this.createdAt = LocalDateTime.now();
        this.role = "ROLE_USER";
    }

    public User(String name, String phoneNumber, String gmail, String passwordHash) {
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.gmail = gmail;
        this.passwordHash = passwordHash;
        this.createdAt = LocalDateTime.now();
        this.role = "ROLE_USER";
    }

    public User(String name, String phoneNumber, String gmail, String passwordHash, String role) {
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.gmail = gmail;
        this.passwordHash = passwordHash;
        this.createdAt = LocalDateTime.now();
        this.role = (role == null || role.trim().isEmpty()) ? "ROLE_USER" : role;
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

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getGmail() {
        return gmail;
    }

    public void setGmail(String gmail) {
        this.gmail = gmail;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getRole() {
        return role != null ? role : "ROLE_USER";
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

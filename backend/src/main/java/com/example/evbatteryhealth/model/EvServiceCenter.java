package com.example.evbatteryhealth.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "ev_service_centers")
public class EvServiceCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Service center name is required")
    private String name;

    @NotNull(message = "City is required")
    private String city;

    @NotNull(message = "Brand is required")
    private String brand;

    private String address;

    private String phoneNumber;

    private Double rating;

    public EvServiceCenter() {}

    public EvServiceCenter(String name, String city, String brand, String address, String phoneNumber, Double rating) {
        this.name = name;
        this.city = city;
        this.brand = brand;
        this.address = address;
        this.phoneNumber = phoneNumber;
        this.rating = rating;
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

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }
}

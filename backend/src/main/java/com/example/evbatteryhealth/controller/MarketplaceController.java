package com.example.evbatteryhealth.controller;

import com.example.evbatteryhealth.model.BatteryListing;
import com.example.evbatteryhealth.service.BatteryListingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/marketplace/listings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost:5175", "http://127.0.0.1:5175"})
public class MarketplaceController {

    private final BatteryListingService service;

    @Autowired
    public MarketplaceController(BatteryListingService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<BatteryListing> createListing(@RequestBody BatteryListing listing) {
        BatteryListing saved = service.save(listing);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<BatteryListing>> getListings(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minSoh,
            @RequestParam(required = false) String vehicleType,
            @RequestParam(required = false) String chemistry,
            @RequestParam(required = false) String status) {
        List<BatteryListing> listings = service.getListings(city, state, maxPrice, minSoh, vehicleType, chemistry, status);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BatteryListing> getListingById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BatteryListing> updateListing(@PathVariable Long id, @RequestBody BatteryListing listingDetails) {
        return service.findById(id).map(existing -> {
            existing.setVehicleType(listingDetails.getVehicleType());
            existing.setPhoneNumber(listingDetails.getPhoneNumber());
            existing.setManufacturer(listingDetails.getManufacturer());
            existing.setModel(listingDetails.getModel());
            existing.setChemistry(listingDetails.getChemistry());
            existing.setCapacity(listingDetails.getCapacity());
            existing.setEstimatedSoH(listingDetails.getEstimatedSoH());
            existing.setChargingCycles(listingDetails.getChargingCycles());
            existing.setBatteryAge(listingDetails.getBatteryAge());
            existing.setPrice(listingDetails.getPrice());
            existing.setCity(listingDetails.getCity());
            existing.setState(listingDetails.getState());
            existing.setDescription(listingDetails.getDescription());
            existing.setImageUrl(listingDetails.getImageUrl());
            existing.setStatus(listingDetails.getStatus());
            BatteryListing updated = service.save(existing);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Long id) {
        return service.findById(id).map(existing -> {
            service.deleteListing(id);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}

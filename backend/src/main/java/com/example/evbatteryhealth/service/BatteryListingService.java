package com.example.evbatteryhealth.service;

import com.example.evbatteryhealth.model.BatteryListing;
import com.example.evbatteryhealth.repository.BatteryListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class BatteryListingService {

    private final BatteryListingRepository repository;

    @Autowired
    public BatteryListingService(BatteryListingRepository repository) {
        this.repository = repository;
    }

    public BatteryListing save(BatteryListing listing) {
        return repository.save(listing);
    }

    public Optional<BatteryListing> findById(Long id) {
        return repository.findById(id);
    }

    public List<BatteryListing> getListings(String city, String state, Double maxPrice, Double minSoh, 
                                            String vehicleType, String chemistry, String status) {
        return repository.findAll((Specification<BatteryListing>) (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (city != null && !city.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
            }

            if (state != null && !state.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("state")), state.trim().toLowerCase()));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (minSoh != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("estimatedSoH"), minSoh));
            }

            if (vehicleType != null && !vehicleType.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("vehicleType")), vehicleType.trim().toLowerCase()));
            }

            if (chemistry != null && !chemistry.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("chemistry")), chemistry.trim().toLowerCase()));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            } else {
                predicates.add(cb.equal(root.get("status"), "AVAILABLE"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        });
    }

    public void deleteListing(Long id) {
        repository.deleteById(id);
    }
}

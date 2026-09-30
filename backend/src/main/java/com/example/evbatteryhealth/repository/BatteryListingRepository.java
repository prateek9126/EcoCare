package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.BatteryListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface BatteryListingRepository extends JpaRepository<BatteryListing, Long>, JpaSpecificationExecutor<BatteryListing> {
}

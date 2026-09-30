package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.EvDealer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvDealerRepository extends JpaRepository<EvDealer, Long> {
    List<EvDealer> findByCityIgnoreCase(String city);
    List<EvDealer> findByCityIgnoreCaseAndBrandIgnoreCase(String city, String brand);
}

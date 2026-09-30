package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.EvServiceCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvServiceCenterRepository extends JpaRepository<EvServiceCenter, Long> {
    List<EvServiceCenter> findByCityIgnoreCase(String city);
    List<EvServiceCenter> findByCityIgnoreCaseAndBrandIgnoreCase(String city, String brand);
}

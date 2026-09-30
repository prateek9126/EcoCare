package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.VehicleSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VehicleSaleRepository extends JpaRepository<VehicleSale, Long> {
    List<VehicleSale> findByManufacturerAndModel(String manufacturer, String model);
}

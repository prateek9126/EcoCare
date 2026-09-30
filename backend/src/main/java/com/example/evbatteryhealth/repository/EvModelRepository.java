package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.EvModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EvModelRepository extends JpaRepository<EvModel, Long> {
    List<EvModel> findByVehicleType(String vehicleType);
}

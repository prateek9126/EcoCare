package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.BatteryAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BatteryAnalysisRepository extends JpaRepository<BatteryAnalysis, Long> {
    // Find history of analyses ordered chronologically by creation time
    List<BatteryAnalysis> findAllByOrderByCreatedAtAsc();
    
    // Find history of analyses for a specific vehicle model/manufacturer
    List<BatteryAnalysis> findByManufacturerAndModelOrderByCreatedAtAsc(String manufacturer, String model);

    // Find history of analyses for a specific vehicle by its unique vehicleId
    List<BatteryAnalysis> findByVehicleVehicleIdOrderByCreatedAtAsc(String vehicleId);
    List<BatteryAnalysis> findByVehicleVehicleIdOrderByCreatedAtDesc(String vehicleId);

    // Find history of analyses by user email
    List<BatteryAnalysis> findByVehicleUserGmailOrderByCreatedAtAsc(String gmail);

    // Find history of analyses by user email, manufacturer, and model
    List<BatteryAnalysis> findByVehicleUserGmailAndManufacturerAndModelOrderByCreatedAtAsc(String gmail, String manufacturer, String model);

}

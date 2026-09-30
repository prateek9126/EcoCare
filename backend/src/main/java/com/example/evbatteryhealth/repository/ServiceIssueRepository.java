package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.ServiceIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ServiceIssueRepository extends JpaRepository<ServiceIssue, Long> {
    List<ServiceIssue> findByVehicleId(String vehicleId);
    List<ServiceIssue> findByManufacturerAndModel(String manufacturer, String model);
}

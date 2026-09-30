package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.ServiceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ServiceRecordRepository extends JpaRepository<ServiceRecord, Long> {
    List<ServiceRecord> findByVehicleIdOrderByServiceDateAsc(String vehicleId);
    List<ServiceRecord> findByManufacturerAndModel(String manufacturer, String model);
}

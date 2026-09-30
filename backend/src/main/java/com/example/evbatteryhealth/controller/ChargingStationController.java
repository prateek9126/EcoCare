package com.example.evbatteryhealth.controller;

import com.example.evbatteryhealth.model.ChargingStation;
import com.example.evbatteryhealth.repository.ChargingStationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/charging-stations")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost:5175", "http://127.0.0.1:5175"})
public class ChargingStationController {

    private final ChargingStationRepository repository;

    @Autowired
    public ChargingStationController(ChargingStationRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void seedDatabase() {
        if (repository.count() == 0) {
            List<ChargingStation> seedData = new ArrayList<>();
            // Odisha & Jamshedpur region
            seedData.add(new ChargingStation("Paradip Port Charge", 20.3164, 86.6109, 4, 2, "DC Fast Charger", 60, "Available", "Paradip Port Area, Odisha"));
            seedData.add(new ChargingStation("Jamshedpur EV Station", 22.8046, 86.2029, 4, 2, "DC Fast Charger", 60, "Available", "Bistupur, Jamshedpur"));
            seedData.add(new ChargingStation("Bhubaneswar Smart Charge", 20.2961, 85.8245, 6, 4, "CCS2 DC Fast", 120, "Available", "Patia, Bhubaneswar"));
            seedData.add(new ChargingStation("Cuttack Link Road Charge", 20.4625, 85.8830, 8, 0, "AC Type 2", 22, "Busy", "Link Road, Cuttack"));
            seedData.add(new ChargingStation("Rourkela Steel City EV", 22.2604, 84.8536, 5, 3, "DC Fast Charger", 50, "Available", "Civil Township, Rourkela"));
            seedData.add(new ChargingStation("Sambalpur Highway Charging", 21.4669, 83.9812, 4, 1, "DC Fast Charger", 80, "Available", "National Highway, Sambalpur"));
            seedData.add(new ChargingStation("Puri Beach EV Hub", 19.8134, 85.8312, 6, 6, "AC & DC Charger", 50, "Available", "Marine Drive, Puri"));
            seedData.add(new ChargingStation("Balasore Town EV Station", 21.4934, 86.9337, 3, 0, "DC Fast Charger", 30, "Offline", "Station Road, Balasore"));
            seedData.add(new ChargingStation("Kendujhargarh Charging Hub", 21.6289, 85.5817, 4, 2, "AC Type 2", 22, "Available", "Keonjhar Bypass, Kendujhargarh"));
            seedData.add(new ChargingStation("Angul Industrial EV Charge", 20.8444, 85.1511, 6, 3, "CCS2 DC Fast", 100, "Available", "Industrial Area, Angul"));
            seedData.add(new ChargingStation("Dhenkanal Bypass Charge", 20.6621, 85.6000, 4, 1, "DC Fast", 60, "Available", "NH 55, Dhenkanal"));
            seedData.add(new ChargingStation("Bhadrak EV Hub", 21.0574, 86.4958, 4, 2, "DC Fast Charger", 50, "Available", "Bhadrak bypass, Bhadrak"));

            // Other Metro regions in India
            seedData.add(new ChargingStation("Delhi Dwarka EV Station", 28.5921, 77.0494, 8, 5, "CCS2 DC Ultra Fast", 150, "Available", "Sector 10, Dwarka, New Delhi"));
            seedData.add(new ChargingStation("Delhi Connaught Place EV", 28.6304, 77.2177, 4, 1, "DC Fast Charger", 50, "Available", "Connaught Place, New Delhi"));
            seedData.add(new ChargingStation("Mumbai Bandra Kurla EV Hub", 19.0596, 72.8631, 10, 4, "CCS2 DC Fast", 120, "Available", "BKC, Mumbai"));
            seedData.add(new ChargingStation("Mumbai Andheri East Charging", 19.1176, 72.8631, 6, 0, "AC Type 2", 22, "Busy", "Andheri East, Mumbai"));
            seedData.add(new ChargingStation("Bengaluru Indiranagar EV Station", 12.9719, 77.6412, 6, 3, "DC Fast Charger", 60, "Available", "Indiranagar, Bengaluru"));
            seedData.add(new ChargingStation("Bengaluru Electronic City Hub", 12.8452, 77.6631, 12, 8, "CCS2 DC Fast", 120, "Available", "Phase 1, Electronic City, Bengaluru"));
            seedData.add(new ChargingStation("Pune Kothrud EV Station", 18.5074, 73.8077, 4, 2, "DC Fast Charger", 50, "Available", "Kothrud, Pune"));
            seedData.add(new ChargingStation("Hyderabad Gachibowli Charging", 17.4401, 78.3489, 8, 5, "CCS2 DC Fast", 100, "Available", "Gachibowli, Hyderabad"));

            repository.saveAll(seedData);
            System.out.println(">>> Seeded " + seedData.size() + " EV Charging Stations into the database.");
        }
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<ChargingStation>> getNearbyStations(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(required = false, defaultValue = "50") double radius) {

        List<ChargingStation> stations = repository.findAll();

        List<ChargingStation> nearby = stations.stream()
                .peek(station -> {
                    double dist = calculateDistance(latitude, longitude, station.getLatitude(), station.getLongitude());
                    station.setDistanceKm(Math.round(dist * 10.0) / 10.0); // Round to 1 decimal place
                })
                .filter(station -> station.getDistanceKm() <= radius)
                .sorted((a, b) -> Double.compare(a.getDistanceKm(), b.getDistanceKm()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(nearby);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

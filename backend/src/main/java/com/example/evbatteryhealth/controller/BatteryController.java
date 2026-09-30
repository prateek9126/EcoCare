package com.example.evbatteryhealth.controller;

import com.example.evbatteryhealth.model.BatteryAnalysis;
import com.example.evbatteryhealth.service.BatteryAnalysisService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/battery")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost:5175", "http://127.0.0.1:5175"})
public class BatteryController {

    private final BatteryAnalysisService service;
    private final com.example.evbatteryhealth.service.CompanyService companyService;

    @Autowired
    public BatteryController(BatteryAnalysisService service, com.example.evbatteryhealth.service.CompanyService companyService) {
        this.service = service;
        this.companyService = companyService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeBattery(
            @Valid @RequestBody BatteryAnalysis analysis,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        try {
            BatteryAnalysis result = service.analyzeAndSave(analysis, userEmail);
            return ResponseEntity.ok(result);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(java.util.Map.of("message", se.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", iae.getMessage()));
        }
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<?> getVehicleHistory(
            @PathVariable String vehicleId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        return service.findVehicleByVehicleId(vehicleId, userEmail)
                .map(vehicle -> {
                    List<BatteryAnalysis> history = service.getHistoryByVehicleId(vehicleId, userEmail);
                    java.util.Map<String, Object> response = new java.util.HashMap<>();
                    response.put("vehicle", vehicle);
                    response.put("history", history);
                    return ResponseEntity.ok((Object) response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{batteryId}/history")
    public ResponseEntity<?> getBatteryHistory(
            @PathVariable String batteryId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        return getVehicleHistory(batteryId, userEmail);
    }

    @GetMapping("/history")
    public ResponseEntity<List<BatteryAnalysis>> getAnalysisHistory(
            @RequestParam(required = false) String manufacturer,
            @RequestParam(required = false) String model,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        
        List<BatteryAnalysis> history;
        if (manufacturer != null && model != null) {
            history = service.getHistoryByModel(userEmail, manufacturer, model);
        } else {
            history = service.getHistory(userEmail);
        }
        return ResponseEntity.ok(history);
    }

    @GetMapping("/vehicles")
    public ResponseEntity<?> getVehicles(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        List<com.example.evbatteryhealth.model.Vehicle> vehicles = service.getVehiclesByUserEmail(userEmail);
        List<java.util.Map<String, Object>> response = new java.util.ArrayList<>();
        
        for (com.example.evbatteryhealth.model.Vehicle v : vehicles) {
            List<BatteryAnalysis> history = service.getHistoryByVehicleId(v.getVehicleId(), userEmail);
            if (history.isEmpty()) continue;
            
            BatteryAnalysis latest = history.get(history.size() - 1);
            
            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("vehicleId", v.getVehicleId());
            item.put("manufacturer", v.getManufacturer());
            item.put("model", v.getModel());
            item.put("vehicleType", v.getVehicleType());
            item.put("lastChecked", latest.getCreatedAt());
            item.put("lastStatus", latest.getCondition());
            item.put("lastScore", latest.getSoh());
            item.put("assessmentsCount", history.size());
            response.add(item);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public/assessment/{id}")
    public ResponseEntity<?> getPublicAssessment(@PathVariable Long id) {
        return service.getPublicAssessment(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/history")
    public ResponseEntity<String> clearHistory() {
        service.clearHistory();
        return ResponseEntity.ok("Analysis history cleared successfully.");
    }

    @PostMapping("/complaint")
    public ResponseEntity<?> raiseComplaint(
            @RequestBody java.util.Map<String, Object> payload,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        com.example.evbatteryhealth.model.ServiceIssue issue = companyService.registerComplaint(payload, userEmail);
        return ResponseEntity.ok(issue);
    }
}

package com.example.evbatteryhealth.controller;

import com.example.evbatteryhealth.model.User;
import com.example.evbatteryhealth.repository.UserRepository;
import com.example.evbatteryhealth.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/company")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost:5175", "http://127.0.0.1:5175"})
public class CompanyController {

    private final CompanyService companyService;
    private final UserRepository userRepository;

    @Autowired
    public CompanyController(CompanyService companyService, UserRepository userRepository) {
        this.companyService = companyService;
        this.userRepository = userRepository;
    }

    private ResponseEntity<?> verifyAccess(String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required. X-User-Email header missing."));
        }
        if ("admin".equalsIgnoreCase(userEmail.trim())) {
            return null; // Allowed
        }
        
        java.util.Optional<User> optUser = userRepository.findByGmail(userEmail.trim().toLowerCase());
        if (optUser.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid authentication details. User not found."));
        }
        
        User user = optUser.get();
        if (!"ROLE_COMPANY".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied. Company authorization required."));
        }
        return null; // Allowed
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> getDashboardSummary(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;
        
        return ResponseEntity.ok(companyService.getDashboardSummary());
    }

    @GetMapping("/sales/monthly")
    public ResponseEntity<?> getMonthlySales(
            @RequestParam(defaultValue = "12 months") String range,
            @RequestParam(required = false) String model,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getMonthlySales(range, model));
    }

    @GetMapping("/sales/models")
    public ResponseEntity<?> getModelSalesPerformance(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getModelSalesPerformance());
    }

    @GetMapping("/models")
    public ResponseEntity<?> getAvailableModels(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getAvailableModels());
    }

    @GetMapping("/models/{modelName}")
    public ResponseEntity<?> getModelAnalytics(
            @PathVariable String modelName,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getModelAnalytics(modelName));
    }

    @GetMapping("/battery-health")
    public ResponseEntity<?> getBatteryHealthAnalytics(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getBatteryHealthAnalytics());
    }

    @GetMapping("/service/summary")
    public ResponseEntity<?> getServiceAnalytics(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getServiceAnalytics());
    }

    @GetMapping("/service/problems")
    public ResponseEntity<?> getCustomerProblemAnalytics(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getCustomerProblemAnalytics());
    }

    @GetMapping("/service/problems/by-model")
    public ResponseEntity<?> getProblemDistributionByModel(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getProblemDistributionByModel());
    }

    @GetMapping("/models/compare")
    public ResponseEntity<?> compareModels(
            @RequestParam String model1,
            @RequestParam String model2,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        // Extract manufacturer/model name parts
        // Assuming inputs look like "EV Company E1" or just "E1"
        // Let's pass the string directly as both manufacturer and model for lookup
        return ResponseEntity.ok(companyService.compareModels("EV Company", model1, "EV Company", model2));
    }

    @GetMapping("/vehicles/{vehicleId}")
    public ResponseEntity<?> getVehicleDetails(
            @PathVariable String vehicleId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        Map<String, Object> details = companyService.getVehicleDetails(vehicleId);
        if (details.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }

    @GetMapping("/insights")
    public ResponseEntity<?> getEngineeringInsights(@RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        ResponseEntity<?> accessCheck = verifyAccess(userEmail);
        if (accessCheck != null) return accessCheck;

        return ResponseEntity.ok(companyService.getEngineeringInsights());
    }

    @PostMapping("/service/complaints")
    public ResponseEntity<?> registerComplaint(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        com.example.evbatteryhealth.model.ServiceIssue issue = companyService.registerComplaint(payload, userEmail);
        return ResponseEntity.ok(issue);
    }

    @PostMapping("/complaints")
    public ResponseEntity<?> registerComplaintDirect(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        com.example.evbatteryhealth.model.ServiceIssue issue = companyService.registerComplaint(payload, userEmail);
        return ResponseEntity.ok(issue);
    }
}

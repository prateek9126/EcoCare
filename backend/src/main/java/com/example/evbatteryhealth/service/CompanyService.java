package com.example.evbatteryhealth.service;

import com.example.evbatteryhealth.model.*;
import com.example.evbatteryhealth.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final BatteryAnalysisRepository batteryAnalysisRepository;
    private final VehicleSaleRepository vehicleSaleRepository;
    private final ServiceRecordRepository serviceRecordRepository;
    private final ServiceIssueRepository serviceIssueRepository;

    @Autowired
    public CompanyService(UserRepository userRepository,
                          VehicleRepository vehicleRepository,
                          BatteryAnalysisRepository batteryAnalysisRepository,
                          VehicleSaleRepository vehicleSaleRepository,
                          ServiceRecordRepository serviceRecordRepository,
                          ServiceIssueRepository serviceIssueRepository) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.batteryAnalysisRepository = batteryAnalysisRepository;
        this.vehicleSaleRepository = vehicleSaleRepository;
        this.serviceRecordRepository = serviceRecordRepository;
        this.serviceIssueRepository = serviceIssueRepository;
    }

    public Map<String, Object> getDashboardSummary() {
        long totalVehiclesSold = vehicleSaleRepository.count();
        long activeVehicles = vehicleRepository.count();
        long totalAssessments = batteryAnalysisRepository.count();
        long serviceVisits = serviceRecordRepository.count();
        long openIssues = serviceIssueRepository.findAll().stream()
                .filter(i -> i.getResolvedDate() == null)
                .count();

        // Calculate average SoH from the latest assessments of each vehicle
        List<Vehicle> vehicles = vehicleRepository.findAll();
        double avgSoh = 0.0;
        int countWithSoh = 0;
        for (Vehicle v : vehicles) {
            List<BatteryAnalysis> history = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtDesc(v.getVehicleId());
            if (!history.isEmpty()) {
                avgSoh += history.get(0).getSoh();
                countWithSoh++;
            }
        }
        avgSoh = countWithSoh > 0 ? round(avgSoh / countWithSoh, 1) : 0.0;

        // Calculate percentage changes (Growth rates this month vs last month)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        LocalDateTime sixtyDaysAgo = now.minusDays(60);

        // Sales MoM
        long salesThisMonth = vehicleSaleRepository.findAll().stream()
                .filter(s -> s.getSaleDate().isAfter(thirtyDaysAgo))
                .count();
        long salesLastMonth = vehicleSaleRepository.findAll().stream()
                .filter(s -> s.getSaleDate().isAfter(sixtyDaysAgo) && s.getSaleDate().isBefore(thirtyDaysAgo))
                .count();
        double salesChange = calculatePercentageChange(salesThisMonth, salesLastMonth);

        // Assessments MoM
        long assessmentsThisMonth = batteryAnalysisRepository.findAll().stream()
                .filter(a -> a.getCreatedAt().isAfter(thirtyDaysAgo))
                .count();
        long assessmentsLastMonth = batteryAnalysisRepository.findAll().stream()
                .filter(a -> a.getCreatedAt().isAfter(sixtyDaysAgo) && a.getCreatedAt().isBefore(thirtyDaysAgo))
                .count();
        double assessmentsChange = calculatePercentageChange(assessmentsThisMonth, assessmentsLastMonth);

        // Service Visits MoM
        long servicesThisMonth = serviceRecordRepository.findAll().stream()
                .filter(s -> s.getServiceDate().isAfter(thirtyDaysAgo))
                .count();
        long servicesLastMonth = serviceRecordRepository.findAll().stream()
                .filter(s -> s.getServiceDate().isAfter(sixtyDaysAgo) && s.getServiceDate().isBefore(thirtyDaysAgo))
                .count();
        double servicesChange = calculatePercentageChange(servicesThisMonth, servicesLastMonth);

        // Open Issues MoM
        long openIssuesThisMonth = serviceIssueRepository.findAll().stream()
                .filter(i -> i.getResolvedDate() == null && i.getReportedDate().isAfter(thirtyDaysAgo))
                .count();
        long openIssuesLastMonth = serviceIssueRepository.findAll().stream()
                .filter(i -> i.getResolvedDate() == null && i.getReportedDate().isAfter(sixtyDaysAgo) && i.getReportedDate().isBefore(thirtyDaysAgo))
                .count();
        double openIssuesChange = calculatePercentageChange(openIssuesThisMonth, openIssuesLastMonth);

        // SoH MoM change
        double sohThisMonthSum = 0.0;
        int sohThisMonthCount = 0;
        double sohLastMonthSum = 0.0;
        int sohLastMonthCount = 0;
        for (Vehicle v : vehicles) {
            List<BatteryAnalysis> assessments = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtDesc(v.getVehicleId());
            
            // Find latest in last 30 days
            Optional<BatteryAnalysis> latestThisMonth = assessments.stream()
                    .filter(a -> a.getCreatedAt().isAfter(thirtyDaysAgo))
                    .findFirst();
            if (latestThisMonth.isPresent()) {
                sohThisMonthSum += latestThisMonth.get().getSoh();
                sohThisMonthCount++;
            }
            
            // Find latest in 30-60 days
            Optional<BatteryAnalysis> latestLastMonth = assessments.stream()
                    .filter(a -> a.getCreatedAt().isAfter(sixtyDaysAgo) && a.getCreatedAt().isBefore(thirtyDaysAgo))
                    .findFirst();
            if (latestLastMonth.isPresent()) {
                sohLastMonthSum += latestLastMonth.get().getSoh();
                sohLastMonthCount++;
            }
        }
        double avgSohThisMonth = sohThisMonthCount > 0 ? sohThisMonthSum / sohThisMonthCount : avgSoh;
        double avgSohLastMonth = sohLastMonthCount > 0 ? sohLastMonthSum / sohLastMonthCount : avgSoh;
        double sohChangePct = round(avgSohThisMonth - avgSohLastMonth, 1);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalVehiclesSold", totalVehiclesSold);
        summary.put("salesChange", salesChange);
        
        summary.put("activeVehicles", activeVehicles);
        summary.put("activeVehiclesChange", calculatePercentageChange(activeVehicles, activeVehicles - salesThisMonth)); // estimation

        summary.put("totalBatteryAssessments", totalAssessments);
        summary.put("assessmentsChange", assessmentsChange);

        summary.put("serviceVisits", serviceVisits);
        summary.put("servicesChange", servicesChange);

        summary.put("openIssues", openIssues);
        summary.put("openIssuesChange", openIssuesChange);

        summary.put("avgBatterySoh", avgSoh);
        summary.put("sohChange", sohChangePct);

        return summary;
    }

    public List<Map<String, Object>> getMonthlySales(String range, String modelFilter) {
        List<VehicleSale> sales = vehicleSaleRepository.findAll();
        
        // Filter by model if requested
        if (modelFilter != null && !modelFilter.trim().isEmpty() && !"All Models".equalsIgnoreCase(modelFilter.trim())) {
            String trimmedModel = modelFilter.trim().toLowerCase();
            sales = sales.stream()
                    .filter(s -> s.getModel().toLowerCase().contains(trimmedModel) || trimmedModel.contains(s.getModel().toLowerCase()))
                    .collect(Collectors.toList());
        }

        // Determine number of months
        int monthsCount = 12;
        if ("6 months".equalsIgnoreCase(range)) {
            monthsCount = 6;
        } else if ("this year".equalsIgnoreCase(range)) {
            monthsCount = LocalDateTime.now().getMonthValue();
        }

        LocalDateTime now = LocalDateTime.now();
        List<Map<String, Object>> result = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = monthsCount - 1; i >= 0; i--) {
            LocalDateTime targetMonth = now.minusMonths(i);
            int year = targetMonth.getYear();
            int month = targetMonth.getMonthValue();

            long count = sales.stream()
                    .filter(s -> s.getSaleDate().getYear() == year && s.getSaleDate().getMonthValue() == month)
                    .count();

            Map<String, Object> monthData = new LinkedHashMap<>();
            monthData.put("name", targetMonth.format(formatter));
            monthData.put("sales", count);
            result.add(monthData);
        }

        return result;
    }

    public Map<String, Object> getModelSalesPerformance() {
        List<VehicleSale> sales = vehicleSaleRepository.findAll();
        Map<String, Long> salesByModel = sales.stream()
                .collect(Collectors.groupingBy(VehicleSale::getModel, Collectors.counting()));

        List<Map<String, Object>> rankings = new ArrayList<>();
        String mostSoldModel = "No Sales yet";
        long mostSoldCount = 0;
        String leastSoldModel = "No Sales yet";
        long leastSoldCount = Long.MAX_VALUE;

        for (Map.Entry<String, Long> entry : salesByModel.entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("model", entry.getKey());
            item.put("sold", entry.getValue());
            rankings.add(item);

            if (entry.getValue() > mostSoldCount) {
                mostSoldCount = entry.getValue();
                mostSoldModel = entry.getKey();
            }
            if (entry.getValue() < leastSoldCount) {
                leastSoldCount = entry.getValue();
                leastSoldModel = entry.getKey();
            }
        }

        if (salesByModel.isEmpty()) {
            leastSoldModel = "No Sales yet";
            leastSoldCount = 0;
        }

        // Sort rankings descending
        rankings.sort((a, b) -> Long.compare((Long) b.get("sold"), (Long) a.get("sold")));

        Map<String, Object> response = new HashMap<>();
        response.put("rankings", rankings);
        response.put("mostSoldModel", mostSoldModel);
        response.put("mostSoldCount", mostSoldCount);
        response.put("leastSoldModel", leastSoldModel);
        response.put("leastSoldCount", leastSoldCount);

        return response;
    }

    public List<String> getAvailableModels() {
        return vehicleRepository.findAll().stream()
                .map(Vehicle::getModel)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public Map<String, Object> getModelAnalytics(String modelName) {
        List<Vehicle> modelVehicles = vehicleRepository.findAll().stream()
                .filter(v -> v.getModel().equalsIgnoreCase(modelName))
                .collect(Collectors.toList());

        long totalSold = vehicleSaleRepository.findAll().stream()
                .filter(s -> s.getModel().equalsIgnoreCase(modelName))
                .count();

        long activeCount = modelVehicles.size();

        double avgSoh = 0.0;
        double avgAge = 0.0;
        double avgCycles = 0.0;
        int sohCount = 0;

        for (Vehicle v : modelVehicles) {
            List<BatteryAnalysis> history = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtDesc(v.getVehicleId());
            if (!history.isEmpty()) {
                BatteryAnalysis latest = history.get(0);
                avgSoh += latest.getSoh();
                avgAge += latest.getBatteryAge();
                avgCycles += latest.getChargingCycles();
                sohCount++;
            }
        }

        avgSoh = sohCount > 0 ? round(avgSoh / sohCount, 1) : 0.0;
        avgAge = sohCount > 0 ? round(avgAge / sohCount, 1) : 0.0;
        avgCycles = sohCount > 0 ? round(avgCycles / sohCount, 0) : 0.0;

        long serviceVisits = serviceRecordRepository.findAll().stream()
                .filter(s -> s.getModel().equalsIgnoreCase(modelName))
                .count();

        long reportedProblems = serviceIssueRepository.findAll().stream()
                .filter(i -> i.getModel().equalsIgnoreCase(modelName))
                .count();

        // Average Service Interval: average difference between service center dates for vehicles with multiple services
        double avgServiceIntervalMonths = 0.0;
        int intervalCount = 0;
        for (Vehicle v : modelVehicles) {
            List<ServiceRecord> services = serviceRecordRepository.findByVehicleIdOrderByServiceDateAsc(v.getVehicleId());
            if (services.size() > 1) {
                for (int i = 1; i < services.size(); i++) {
                    long days = ChronoUnit.DAYS.between(services.get(i-1).getServiceDate(), services.get(i).getServiceDate());
                    avgServiceIntervalMonths += (days / 30.4);
                    intervalCount++;
                }
            }
        }
        avgServiceIntervalMonths = intervalCount > 0 ? round(avgServiceIntervalMonths / intervalCount, 1) : 0.0;
        if (avgServiceIntervalMonths == 0.0 && activeCount > 0 && serviceVisits > 0) {
            // fallback: average age divided by service count
            avgServiceIntervalMonths = round((avgAge * 12.0) / (serviceVisits / (double) activeCount), 1);
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("model", modelName);
        analytics.put("totalSold", totalSold);
        analytics.put("activeVehicles", activeCount);
        analytics.put("avgBatterySoh", avgSoh);
        analytics.put("avgBatteryAge", avgAge);
        analytics.put("avgChargingCycles", (int) avgCycles);
        analytics.put("serviceVisits", serviceVisits);
        analytics.put("reportedProblems", reportedProblems);
        analytics.put("avgServiceInterval", avgServiceIntervalMonths);

        return analytics;
    }

    public List<Map<String, Object>> getBatteryHealthAnalytics() {
        List<String> models = getAvailableModels();
        List<Map<String, Object>> result = new ArrayList<>();

        for (String model : models) {
            List<Vehicle> modelVehicles = vehicleRepository.findAll().stream()
                    .filter(v -> v.getModel().equalsIgnoreCase(model))
                    .collect(Collectors.toList());

            if (modelVehicles.isEmpty()) continue;

            double totalSoh = 0.0;
            double totalCapacity = 0.0;
            double totalAge = 0.0;
            double totalCycles = 0.0;
            int count = 0;

            for (Vehicle v : modelVehicles) {
                List<BatteryAnalysis> history = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtDesc(v.getVehicleId());
                if (!history.isEmpty()) {
                    BatteryAnalysis latest = history.get(0);
                    totalSoh += latest.getSoh();
                    
                    double capacityRetention = latest.getOriginalCapacity() > 0 
                            ? (latest.getCurrentUsableCapacity() / latest.getOriginalCapacity()) * 100.0 
                            : 0.0;
                    totalCapacity += capacityRetention;
                    totalAge += latest.getBatteryAge();
                    totalCycles += latest.getChargingCycles();
                    count++;
                }
            }

            if (count == 0) continue;

            double avgSoh = round(totalSoh / count, 1);
            double avgCapacity = round(totalCapacity / count, 1);
            double avgAge = round(totalAge / count, 1);
            double avgCycles = round(totalCycles / count, 0);

            long totalProblems = serviceIssueRepository.findAll().stream()
                    .filter(i -> i.getModel().equalsIgnoreCase(model))
                    .count();
            double problemRate = round((totalProblems / (double) modelVehicles.size()) * 100.0, 1);

            Map<String, Object> item = new HashMap<>();
            item.put("model", model);
            item.put("avgSoh", avgSoh);
            item.put("avgCapacityRetained", avgCapacity);
            item.put("avgAge", avgAge);
            item.put("avgCycles", (int) avgCycles);
            item.put("problemRate", problemRate);
            result.add(item);
        }

        return result;
    }

    public Map<String, Object> getServiceAnalytics() {
        List<ServiceRecord> serviceRecords = serviceRecordRepository.findAll();
        long totalVisits = serviceRecords.size();

        if (totalVisits == 0) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("totalServiceVisits", 0);
            empty.put("avgServiceFrequencyMonths", 0.0);
            empty.put("mostServicedModel", "None");
            empty.put("mostCommonProblem", "None");
            empty.put("avgRepairTime", 0.0);
            empty.put("repeatServiceRate", 0.0);
            empty.put("lifecycleJourney", Collections.emptyMap());
            return empty;
        }

        // Average Repair Time
        double avgRepairTime = serviceRecords.stream()
                .filter(s -> s.getRepairTimeHours() != null)
                .mapToDouble(ServiceRecord::getRepairTimeHours)
                .average()
                .orElse(0.0);
        avgRepairTime = round(avgRepairTime, 1);

        // Repeat Service Rate
        long repeatVisitsCount = serviceRecords.stream()
                .filter(s -> s.getIsRepeatVisit() != null && s.getIsRepeatVisit())
                .count();
        double repeatServiceRate = round((repeatVisitsCount / (double) totalVisits) * 100.0, 1);

        // Most serviced model
        Map<String, Long> visitsByModel = serviceRecords.stream()
                .collect(Collectors.groupingBy(ServiceRecord::getModel, Collectors.counting()));
        String mostServicedModel = visitsByModel.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("None");

        // Most common problem from issues
        List<ServiceIssue> serviceIssues = serviceIssueRepository.findAll();
        Map<String, Long> issuesByType = serviceIssues.stream()
                .collect(Collectors.groupingBy(ServiceIssue::getIssueType, Collectors.counting()));
        String mostCommonProblem = issuesByType.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("None");

        // Average service frequency in months (average age of vehicles at service visits / visits count)
        double totalFrequencyAge = 0.0;
        int frequencyCount = 0;
        List<Vehicle> vehicles = vehicleRepository.findAll();
        for (Vehicle v : vehicles) {
            List<ServiceRecord> services = serviceRecordRepository.findByVehicleIdOrderByServiceDateAsc(v.getVehicleId());
            if (!services.isEmpty()) {
                List<BatteryAnalysis> assessments = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtAsc(v.getVehicleId());
                if (!assessments.isEmpty()) {
                    double age = assessments.get(assessments.size()-1).getBatteryAge();
                    totalFrequencyAge += (age * 12.0) / services.size();
                    frequencyCount++;
                }
            }
        }
        double avgServiceFrequencyMonths = frequencyCount > 0 ? round(totalFrequencyAge / frequencyCount, 1) : 0.0;

        // --- FIRST SERVICE / POST-SERVICE TRACKING ---
        // Funnel tracking: Purchase -> Telemetry -> First Service -> Repair -> Next Assessment
        long reachedFirstService = 0;
        double totalDaysToFirstService = 0.0;
        double firstServiceAvgSoh = 0.0;
        long requiringRepair = 0;
        long repeatServiceVisits = 0;
        long problemsAfterService = 0;

        for (Vehicle v : vehicles) {
            // Find purchase date
            Optional<VehicleSale> saleOpt = vehicleSaleRepository.findAll().stream()
                    .filter(s -> s.getVehicleId().equalsIgnoreCase(v.getVehicleId()))
                    .findFirst();
            
            List<ServiceRecord> services = serviceRecordRepository.findByVehicleIdOrderByServiceDateAsc(v.getVehicleId());
            
            if (!services.isEmpty()) {
                reachedFirstService++;
                ServiceRecord firstService = services.get(0);
                
                if (saleOpt.isPresent()) {
                    long days = ChronoUnit.DAYS.between(saleOpt.get().getSaleDate(), firstService.getServiceDate());
                    totalDaysToFirstService += days;
                }
                
                firstServiceAvgSoh += firstService.getBatterySoh();
                
                // Count issues in first service
                long issuesInFirst = serviceIssues.stream()
                        .filter(i -> i.getServiceRecordId() != null && i.getServiceRecordId().equals(firstService.getId()))
                        .count();
                if (issuesInFirst > 0) {
                    requiringRepair++;
                }

                // Repeat services
                if (services.size() > 1) {
                    repeatServiceVisits += (services.size() - 1);
                    
                    // Problems occurring after the first service date
                    long postFirstProblems = serviceIssues.stream()
                            .filter(i -> i.getVehicleId().equalsIgnoreCase(v.getVehicleId()) && i.getReportedDate().isAfter(firstService.getServiceDate()))
                            .count();
                    problemsAfterService += postFirstProblems;
                }
            }
        }

        double avgMonthsToFirstService = reachedFirstService > 0 
                ? round((totalDaysToFirstService / reachedFirstService) / 30.4, 1) 
                : 0.0;
        double avgSohAtFirstService = reachedFirstService > 0 
                ? round(firstServiceAvgSoh / reachedFirstService, 1) 
                : 0.0;

        Map<String, Object> lifecycleJourney = new LinkedHashMap<>();
        lifecycleJourney.put("reachedFirstService", reachedFirstService);
        lifecycleJourney.put("avgMonthsToFirstService", avgMonthsToFirstService);
        lifecycleJourney.put("avgSohAtFirstService", avgSohAtFirstService);
        lifecycleJourney.put("requiringRepairCount", requiringRepair);
        lifecycleJourney.put("repeatServiceVisitsCount", repeatServiceVisits);
        lifecycleJourney.put("problemsAfterServiceCount", problemsAfterService);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalServiceVisits", totalVisits);
        stats.put("avgServiceFrequencyMonths", avgServiceFrequencyMonths);
        stats.put("mostServicedModel", mostServicedModel);
        stats.put("mostCommonProblem", mostCommonProblem);
        stats.put("avgRepairTime", avgRepairTime);
        stats.put("repeatServiceRate", repeatServiceRate);
        stats.put("lifecycleJourney", lifecycleJourney);

        return stats;
    }

    public List<Map<String, Object>> getCustomerProblemAnalytics() {
        List<ServiceIssue> issues = serviceIssueRepository.findAll();
        Map<String, Long> countsByType = issues.stream()
                .collect(Collectors.groupingBy(ServiceIssue::getIssueType, Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        long totalIssues = issues.size();

        for (Map.Entry<String, Long> entry : countsByType.entrySet()) {
            String issueType = entry.getKey();
            long count = entry.getValue();

            // Calculate analytical parameters
            List<ServiceIssue> typeIssues = issues.stream()
                    .filter(i -> i.getIssueType().equalsIgnoreCase(issueType))
                    .collect(Collectors.toList());

            long affectedVehicles = typeIssues.stream().map(ServiceIssue::getVehicleId).distinct().count();
            
            // Affected models breakdown
            Map<String, Long> modelBreakdown = typeIssues.stream()
                    .collect(Collectors.groupingBy(ServiceIssue::getModel, Collectors.counting()));
            
            long totalVehiclesCount = vehicleRepository.count();
            double pctOfTotalVehicles = totalVehiclesCount > 0 
                    ? round((affectedVehicles / (double) totalVehiclesCount) * 100.0, 1) 
                    : 0.0;

            // Monthly trend (last 6 months)
            LocalDateTime now = LocalDateTime.now();
            List<Long> monthlyTrend = new ArrayList<>();
            for (int i = 5; i >= 0; i--) {
                LocalDateTime target = now.minusMonths(i);
                long mCount = typeIssues.stream()
                        .filter(iss -> iss.getReportedDate().getYear() == target.getYear() && iss.getReportedDate().getMonthValue() == target.getMonthValue())
                        .count();
                monthlyTrend.add(mCount);
            }

            // Average SOH & Age when issue reported
            double avgSoh = 0.0;
            double avgAge = 0.0;
            int countWithData = 0;
            
            for (ServiceIssue issue : typeIssues) {
                // Find assessment around that reported date or just look at historical assessment at that time
                List<BatteryAnalysis> assessments = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtAsc(issue.getVehicleId());
                if (!assessments.isEmpty()) {
                    // find closest assessment to reported date
                    BatteryAnalysis closest = assessments.get(0);
                    long minDiff = Math.abs(ChronoUnit.MINUTES.between(closest.getCreatedAt(), issue.getReportedDate()));
                    for (BatteryAnalysis a : assessments) {
                        long diff = Math.abs(ChronoUnit.MINUTES.between(a.getCreatedAt(), issue.getReportedDate()));
                        if (diff < minDiff) {
                            minDiff = diff;
                            closest = a;
                        }
                    }
                    avgSoh += closest.getSoh();
                    avgAge += closest.getBatteryAge();
                    countWithData++;
                }
            }

            double finalAvgSoh = countWithData > 0 ? round(avgSoh / countWithData, 1) : 0.0;
            double finalAvgAge = countWithData > 0 ? round(avgAge / countWithData, 1) : 0.0;
            
            long serviceVisitsCount = serviceRecordRepository.findAll().stream()
                    .filter(s -> {
                        // matches vehicle and within a few days of reported date
                        if (!s.getVehicleId().equalsIgnoreCase(typeIssues.get(0).getVehicleId())) return false;
                        long days = Math.abs(ChronoUnit.DAYS.between(s.getServiceDate(), typeIssues.get(0).getReportedDate()));
                        return days <= 7;
                    })
                    .count();
            if (serviceVisitsCount == 0) {
                serviceVisitsCount = typeIssues.size(); // default mapping
            }

            // Complaints filed for this specific issue type
            List<Map<String, Object>> complaintsList = typeIssues.stream().map(iss -> {
                Map<String, Object> c = new HashMap<>();
                c.put("id", iss.getId());
                c.put("vehicleId", iss.getVehicleId());
                c.put("model", iss.getModel());
                c.put("manufacturer", iss.getManufacturer());
                c.put("issueType", iss.getIssueType());
                c.put("severity", iss.getSeverity());
                c.put("description", iss.getDescription());
                c.put("reportedDate", iss.getReportedDate() != null ? iss.getReportedDate().toString() : "");
                c.put("resolvedDate", iss.getResolvedDate() != null ? iss.getResolvedDate().toString() : null);
                c.put("status", iss.getResolvedDate() == null ? "ACTIVE" : "RESOLVED");
                return c;
            }).collect(Collectors.toList());

            complaintsList.sort((a, b) -> {
                String d1 = (String) a.get("reportedDate");
                String d2 = (String) b.get("reportedDate");
                return d2.compareTo(d1);
            });

            Map<String, Object> item = new HashMap<>();
            item.put("problem", issueType);
            item.put("count", count);
            item.put("affectedVehicles", affectedVehicles);
            item.put("affectedUsersCount", affectedVehicles);
            item.put("percentageOfTotal", pctOfTotalVehicles);
            item.put("monthlyTrend", monthlyTrend);
            item.put("avgVehicleAge", finalAvgAge);
            item.put("avgBatterySoh", finalAvgSoh);
            item.put("serviceVisitsCaused", serviceVisitsCount);
            item.put("affectedModels", modelBreakdown);
            item.put("complaints", complaintsList);

            result.add(item);
        }

        // Sort descending by issue count
        result.sort((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")));
        return result;
    }

    public ServiceIssue registerComplaint(Map<String, Object> payload, String userEmail) {
        String vehicleId = payload.get("vehicleId") != null ? payload.get("vehicleId").toString().trim() : "UNKNOWN";
        String model = payload.get("model") != null ? payload.get("model").toString().trim() : "EV 360";
        String manufacturer = payload.get("manufacturer") != null ? payload.get("manufacturer").toString().trim() : "EV Company";
        String issueType = payload.get("issueType") != null ? payload.get("issueType").toString().trim() : "Battery degradation";
        String severity = payload.get("severity") != null ? payload.get("severity").toString().trim() : "MEDIUM";
        String description = payload.get("description") != null ? payload.get("description").toString().trim() : "";

        // If vehicle exists in db, pull actual model/manufacturer
        Optional<Vehicle> vOpt = vehicleRepository.findByVehicleId(vehicleId);
        if (vOpt.isPresent()) {
            Vehicle v = vOpt.get();
            if (v.getModel() != null && !v.getModel().isEmpty()) model = v.getModel();
            if (v.getManufacturer() != null && !v.getManufacturer().isEmpty()) manufacturer = v.getManufacturer();
        }

        ServiceIssue issue = new ServiceIssue();
        issue.setVehicleId(vehicleId);
        issue.setModel(model);
        issue.setManufacturer(manufacturer);
        issue.setIssueType(issueType);
        issue.setSeverity(severity);
        issue.setDescription(description);
        issue.setReportedDate(LocalDateTime.now());
        issue.setResolvedDate(null);

        return serviceIssueRepository.save(issue);
    }

    public Map<String, Object> getProblemDistributionByModel() {
        List<ServiceIssue> issues = serviceIssueRepository.findAll();
        List<String> models = getAvailableModels();
        List<String> issueTypes = issues.stream()
                .map(ServiceIssue::getIssueType)
                .distinct()
                .collect(Collectors.toList());

        Map<String, Map<String, Long>> matrix = new LinkedHashMap<>();

        for (String issueType : issueTypes) {
            Map<String, Long> modelCounts = new LinkedHashMap<>();
            for (String model : models) {
                long count = issues.stream()
                        .filter(i -> i.getIssueType().equalsIgnoreCase(issueType) && i.getModel().equalsIgnoreCase(model))
                        .count();
                modelCounts.put(model, count);
            }
            matrix.put(issueType, modelCounts);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("models", models);
        response.put("issueTypes", issueTypes);
        response.put("matrix", matrix);

        return response;
    }

    public Map<String, Object> compareModels(String m1Company, String m1Model, String m2Company, String m2Model) {
        Map<String, Object> m1Data = getModelAnalytics(m1Model);
        Map<String, Object> m2Data = getModelAnalytics(m2Model);

        List<BatteryAnalysis> m1Assessments = batteryAnalysisRepository.findByManufacturerAndModelOrderByCreatedAtAsc(m1Company, m1Model);
        List<BatteryAnalysis> m2Assessments = batteryAnalysisRepository.findByManufacturerAndModelOrderByCreatedAtAsc(m2Company, m2Model);

        double m1CapacityRetention = 0.0;
        double m1AvgRange = 0.0;
        if (!m1Assessments.isEmpty()) {
            m1CapacityRetention = m1Assessments.stream()
                    .mapToDouble(a -> (a.getCurrentUsableCapacity() / a.getOriginalCapacity()) * 100.0)
                    .average()
                    .orElse(0.0);
            m1AvgRange = m1Assessments.stream()
                    .mapToDouble(BatteryAnalysis::getAverageRange)
                    .average()
                    .orElse(0.0);
        }

        double m2CapacityRetention = 0.0;
        double m2AvgRange = 0.0;
        if (!m2Assessments.isEmpty()) {
            m2CapacityRetention = m2Assessments.stream()
                    .mapToDouble(a -> (a.getCurrentUsableCapacity() / a.getOriginalCapacity()) * 100.0)
                    .average()
                    .orElse(0.0);
            m2AvgRange = m2Assessments.stream()
                    .mapToDouble(BatteryAnalysis::getAverageRange)
                    .average()
                    .orElse(0.0);
        }

        long m1TotalVehicles = vehicleRepository.findAll().stream().filter(v -> v.getModel().equalsIgnoreCase(m1Model)).count();
        long m1TotalProblems = serviceIssueRepository.findAll().stream().filter(i -> i.getModel().equalsIgnoreCase(m1Model)).count();
        double m1ProblemRate = m1TotalVehicles > 0 ? round((m1TotalProblems / (double) m1TotalVehicles) * 100.0, 1) : 0.0;

        long m2TotalVehicles = vehicleRepository.findAll().stream().filter(v -> v.getModel().equalsIgnoreCase(m2Model)).count();
        long m2TotalProblems = serviceIssueRepository.findAll().stream().filter(i -> i.getModel().equalsIgnoreCase(m2Model)).count();
        double m2ProblemRate = m2TotalVehicles > 0 ? round((m2TotalProblems / (double) m2TotalVehicles) * 100.0, 1) : 0.0;

        // Get most common problem for each
        List<ServiceIssue> m1Issues = serviceIssueRepository.findAll().stream()
                .filter(i -> i.getModel().equalsIgnoreCase(m1Model)).collect(Collectors.toList());
        String m1CommonProblem = m1Issues.stream()
                .collect(Collectors.groupingBy(ServiceIssue::getIssueType, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("None");

        List<ServiceIssue> m2Issues = serviceIssueRepository.findAll().stream()
                .filter(i -> i.getModel().equalsIgnoreCase(m2Model)).collect(Collectors.toList());
        String m2CommonProblem = m2Issues.stream()
                .collect(Collectors.groupingBy(ServiceIssue::getIssueType, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("None");

        Map<String, Object> comparison = new HashMap<>();
        
        Map<String, Object> m1ComparisonDetails = new LinkedHashMap<>();
        m1ComparisonDetails.put("model", m1Model);
        m1ComparisonDetails.put("sales", m1Data.get("totalSold"));
        m1ComparisonDetails.put("avgSoh", m1Data.get("avgBatterySoh"));
        m1ComparisonDetails.put("capacityRetention", round(m1CapacityRetention, 1));
        m1ComparisonDetails.put("avgBatteryAge", m1Data.get("avgBatteryAge"));
        m1ComparisonDetails.put("chargingCycles", m1Data.get("avgChargingCycles"));
        m1ComparisonDetails.put("avgRange", round(m1AvgRange, 1));
        m1ComparisonDetails.put("serviceVisits", m1Data.get("serviceVisits"));
        m1ComparisonDetails.put("problemRate", m1ProblemRate);
        m1ComparisonDetails.put("commonProblem", m1CommonProblem);
        m1ComparisonDetails.put("serviceFrequency", m1Data.get("avgServiceInterval"));

        Map<String, Object> m2ComparisonDetails = new LinkedHashMap<>();
        m2ComparisonDetails.put("model", m2Model);
        m2ComparisonDetails.put("sales", m2Data.get("totalSold"));
        m2ComparisonDetails.put("avgSoh", m2Data.get("avgBatterySoh"));
        m2ComparisonDetails.put("capacityRetention", round(m2CapacityRetention, 1));
        m2ComparisonDetails.put("avgBatteryAge", m2Data.get("avgBatteryAge"));
        m2ComparisonDetails.put("chargingCycles", m2Data.get("avgChargingCycles"));
        m2ComparisonDetails.put("avgRange", round(m2AvgRange, 1));
        m2ComparisonDetails.put("serviceVisits", m2Data.get("serviceVisits"));
        m2ComparisonDetails.put("problemRate", m2ProblemRate);
        m2ComparisonDetails.put("commonProblem", m2CommonProblem);
        m2ComparisonDetails.put("serviceFrequency", m2Data.get("avgServiceInterval"));

        comparison.put("model1", m1ComparisonDetails);
        comparison.put("model2", m2ComparisonDetails);

        return comparison;
    }

    public Map<String, Object> getVehicleDetails(String vehicleId) {
        if (vehicleId == null || vehicleId.trim().isEmpty()) {
            return Collections.emptyMap();
        }
        String cleanId = vehicleId.trim();
        Optional<Vehicle> optVehicle = vehicleRepository.findByVehicleId(cleanId);
        if (optVehicle.isEmpty()) {
            optVehicle = vehicleRepository.findAll().stream()
                    .filter(v -> v.getVehicleId() != null && v.getVehicleId().equalsIgnoreCase(cleanId))
                    .findFirst();
        }
        if (optVehicle.isEmpty()) {
            return Collections.emptyMap();
        }

        Vehicle vehicle = optVehicle.get();
        String actualId = vehicle.getVehicleId();
        List<BatteryAnalysis> assessments = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtAsc(actualId);
        List<ServiceRecord> services = serviceRecordRepository.findByVehicleIdOrderByServiceDateAsc(actualId);
        List<ServiceIssue> issues = serviceIssueRepository.findByVehicleId(actualId);

        Optional<VehicleSale> saleOpt = vehicleSaleRepository.findAll().stream()
                .filter(s -> s.getVehicleId() != null && s.getVehicleId().equalsIgnoreCase(actualId))
                .findFirst();

        LocalDateTime purchaseDate = saleOpt.map(VehicleSale::getSaleDate).orElse(vehicle.getCreatedAt());
        double purchasePrice = saleOpt.map(VehicleSale::getSalePrice).orElse(0.0);

        double latestSoh = 0.0;
        double batteryAge = 0.0;
        int chargingCycles = 0;
        if (!assessments.isEmpty()) {
            BatteryAnalysis latest = assessments.get(assessments.size() - 1);
            latestSoh = latest.getSoh();
            batteryAge = latest.getBatteryAge();
            chargingCycles = latest.getChargingCycles();
        }

        Map<String, Object> details = new HashMap<>();
        details.put("vehicleId", vehicle.getVehicleId());
        details.put("manufacturer", vehicle.getManufacturer());
        details.put("model", vehicle.getModel());
        details.put("vehicleType", vehicle.getVehicleType());
        details.put("purchaseDate", purchaseDate);
        details.put("purchasePrice", purchasePrice);
        details.put("batteryAge", batteryAge);
        details.put("currentSoh", latestSoh);
        details.put("chargingCycles", chargingCycles);
        details.put("serviceVisitsCount", services.size());
        details.put("serviceVisits", services);
        details.put("problemsReported", issues);
        details.put("assessments", assessments);

        return details;
    }

    public List<Map<String, Object>> getEngineeringInsights() {
        List<Map<String, Object>> insights = new ArrayList<>();
        List<ServiceIssue> issues = serviceIssueRepository.findAll();
        List<Vehicle> vehicles = vehicleRepository.findAll();

        if (issues.isEmpty() || vehicles.isEmpty()) {
            return insights;
        }

        // Insight 1: Charging issue rates compared between EV 360 and E1
        long m1Total = vehicles.stream().filter(v -> v.getModel().equalsIgnoreCase("EV 360")).count();
        long m1ChargingIssues = issues.stream().filter(i -> i.getModel().equalsIgnoreCase("EV 360") && i.getIssueType().equalsIgnoreCase("Charging issue")).count();
        double m1Rate = m1Total > 0 ? (m1ChargingIssues / (double) m1Total) * 100.0 : 0.0;

        long m2Total = vehicles.stream().filter(v -> v.getModel().equalsIgnoreCase("E1")).count();
        long m2ChargingIssues = issues.stream().filter(i -> i.getModel().equalsIgnoreCase("E1") && i.getIssueType().equalsIgnoreCase("Charging issue")).count();
        double m2Rate = m2Total > 0 ? (m2ChargingIssues / (double) m2Total) * 100.0 : 0.0;

        if (m1Rate > 0 && m2Rate > 0) {
            double timesHigher = round(m1Rate / m2Rate, 1);
            Map<String, Object> ins1 = new HashMap<>();
            ins1.put("type", "WARNING");
            ins1.put("text", String.format("EV 360 shows a %.1f%% charging issue rate, which is %.1f× higher than E1 (%.1f%%).", m1Rate, timesHigher, m2Rate));
            insights.add(ins1);
        } else if (m1Rate > 0) {
            Map<String, Object> ins1 = new HashMap<>();
            ins1.put("type", "WARNING");
            ins1.put("text", String.format("EV 360 shows a %.1f%% charging issue rate, representing elevated reports in this model.", m1Rate));
            insights.add(ins1);
        }

        // Insight 2: E1 maintains strong health
        double e1AvgSoh = batteryAnalysisRepository.findAll().stream()
                .filter(a -> a.getModel().equalsIgnoreCase("E1"))
                .mapToDouble(BatteryAnalysis::getSoh)
                .average()
                .orElse(0.0);
        double e1AvgAge = batteryAnalysisRepository.findAll().stream()
                .filter(a -> a.getModel().equalsIgnoreCase("E1"))
                .mapToDouble(BatteryAnalysis::getBatteryAge)
                .average()
                .orElse(0.0);

        if (e1AvgSoh > 90.0 && e1AvgAge > 1.0) {
            Map<String, Object> ins2 = new HashMap<>();
            ins2.put("type", "SUCCESS");
            ins2.put("text", String.format("E1 maintains a strong average battery health of %.1f%% after %.1f years of operation.", e1AvgSoh, e1AvgAge));
            insights.add(ins2);
        }

        // Insight 3: Degradation becomes common after X cycles
        List<BatteryAnalysis> degradedAssessments = batteryAnalysisRepository.findAll().stream()
                .filter(a -> a.getSoh() < 85.0)
                .collect(Collectors.toList());
        double avgCyclesAtDegradation = degradedAssessments.stream()
                .mapToDouble(BatteryAnalysis::getChargingCycles)
                .average()
                .orElse(0.0);

        if (avgCyclesAtDegradation > 0) {
            Map<String, Object> ins3 = new HashMap<>();
            ins3.put("type", "INFO");
            ins3.put("text", String.format("Battery capacity degradation becomes statistically more common after approximately %.0f charging cycles.", avgCyclesAtDegradation));
            insights.add(ins3);
        }

        // Insight 4: Thermal related issues and temperature
        List<BatteryAnalysis> thermalIssues = batteryAnalysisRepository.findAll().stream()
                .filter(a -> a.getAverageTemperature() > 30.0 && a.getSoh() < 88.0)
                .collect(Collectors.toList());
        if (!thermalIssues.isEmpty()) {
            Map<String, Object> ins4 = new HashMap<>();
            ins4.put("type", "WARNING");
            ins4.put("text", "Thermal-related capacity loss increases when average operating temperature exceeds the recommended range (25°C).");
            insights.add(ins4);
        }

        return insights;
    }

    private double calculatePercentageChange(long current, long previous) {
        if (previous == 0) return current > 0 ? 100.0 : 0.0;
        double diff = (double) (current - previous);
        return round((diff / previous) * 100.0, 1);
    }

    private double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        if (Double.isNaN(value) || Double.isInfinite(value)) return 0.0;
        BigDecimal bd = BigDecimal.valueOf(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}

package com.example.evbatteryhealth.controller;

import com.example.evbatteryhealth.model.User;
import com.example.evbatteryhealth.model.PassportLink;
import com.example.evbatteryhealth.model.BatteryAnalysis;
import com.example.evbatteryhealth.model.OtpVerification;
import com.example.evbatteryhealth.repository.UserRepository;
import com.example.evbatteryhealth.repository.PassportLinkRepository;
import com.example.evbatteryhealth.repository.OtpVerificationRepository;
import com.example.evbatteryhealth.repository.BatteryAnalysisRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/marketplace/passport-links")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost:5175", "http://127.0.0.1:5175"})
public class PassportLinkController {

    private final UserRepository userRepository;
    private final PassportLinkRepository passportLinkRepository;
    private final OtpVerificationRepository otpRepository;
    private final BatteryAnalysisRepository batteryAnalysisRepository;
    private final JavaMailSender mailSender;

    @Autowired
    public PassportLinkController(UserRepository userRepository,
                                  PassportLinkRepository passportLinkRepository,
                                  OtpVerificationRepository otpRepository,
                                  BatteryAnalysisRepository batteryAnalysisRepository,
                                  JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passportLinkRepository = passportLinkRepository;
        this.otpRepository = otpRepository;
        this.batteryAnalysisRepository = batteryAnalysisRepository;
        this.mailSender = mailSender;
    }

    @PostMapping
    public ResponseEntity<?> linkPassport(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String vehicleId = request.get("vehicleId");

        if (phoneNumber == null || phoneNumber.trim().isEmpty() ||
            vehicleId == null || vehicleId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Phone number and Vehicle ID are required."));
        }

        phoneNumber = phoneNumber.trim();
        vehicleId = vehicleId.trim();

        // Get the latest BatteryAnalysis for this vehicleId
        List<BatteryAnalysis> analyses = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtDesc(vehicleId);
        if (analyses.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No battery passport exists for this Vehicle ID. Please generate a diagnostic passport first."));
        }

        BatteryAnalysis latestAnalysis = analyses.get(0);

        // Check if there is already a link for this phone number, and overwrite or update it
        PassportLink link = passportLinkRepository.findByPhoneNumber(phoneNumber)
                .orElse(new PassportLink());
        
        link.setPhoneNumber(phoneNumber);
        link.setVehicleId(vehicleId);
        link.setAssessmentId(latestAnalysis.getId());
        passportLinkRepository.save(link);

        return ResponseEntity.ok(Map.of("success", true, "message", "Phone number successfully linked to Vehicle ID " + vehicleId + " and battery passport."));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Phone number is required."));
        }
        phoneNumber = phoneNumber.trim();

        // Check if a link exists for this phone number
        Optional<PassportLink> optLink = passportLinkRepository.findByPhoneNumber(phoneNumber);
        if (optLink.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "No battery passport is linked to this phone number."));
        }

        // Find the user registered with this phone number (to get their Gmail)
        Optional<User> optUser = userRepository.findByPhoneNumber(phoneNumber);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "No registered user found with this phone number."));
        }

        User owner = optUser.get();
        String gmail = owner.getGmail().trim().toLowerCase();

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);

        // Save or update OTP verification record
        OtpVerification otpVerification = otpRepository.findByGmail(gmail)
                .orElse(new OtpVerification());
        otpVerification.setGmail(gmail);
        otpVerification.setOtp(otp);
        otpVerification.setExpiryTime(expiryTime);
        otpRepository.save(otpVerification);

        // Send Email using Gmail SMTP config
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("prateek2222kumar@gmail.com");
            message.setTo(gmail);
            message.setSubject("Battery Passport Authorization Code");
            message.setText("Dear User,\n\nA buyer or user has requested to view your shared EV Battery Digital Passport. Your 6-digit verification code is: " + otp + "\n\nThis OTP is valid for 5 minutes. Share this OTP with the buyer only if you authorize them to view your battery passport.\n\nBest regards,\nEV Diagnostics Terminal Team");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to send OTP via SMTP: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "OTP sent successfully to the seller's registered email."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtpAndGetPassport(@RequestBody Map<String, String> request) {
        String phoneNumber = request.get("phoneNumber");
        String otp = request.get("otp");

        if (phoneNumber == null || phoneNumber.trim().isEmpty() ||
            otp == null || otp.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Phone number and OTP are required."));
        }

        phoneNumber = phoneNumber.trim();
        otp = otp.trim();

        // Look up PassportLink
        Optional<PassportLink> optLink = passportLinkRepository.findByPhoneNumber(phoneNumber);
        if (optLink.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "No passport link found for this phone number."));
        }

        PassportLink link = optLink.get();

        // Find user by phone number to verify OTP
        Optional<User> optUser = userRepository.findByPhoneNumber(phoneNumber);
        if (optUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "No user found associated with this phone number."));
        }

        User owner = optUser.get();
        String gmail = owner.getGmail().trim().toLowerCase();

        // Verify OTP
        Optional<OtpVerification> optOtp = otpRepository.findByGmail(gmail);
        if (optOtp.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No OTP record found. Please request OTP first."));
        }

        OtpVerification otpVerification = optOtp.get();
        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "OTP has expired. Please request a new one."));
        }

        if (!otpVerification.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Incorrect OTP. Verification failed."));
        }

        // Delete used OTP record
        otpRepository.delete(otpVerification);

        // Fetch battery analysis and history logs
        Optional<BatteryAnalysis> optAnalysis = batteryAnalysisRepository.findById(link.getAssessmentId());
        if (optAnalysis.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Linked battery passport could not be found."));
        }

        BatteryAnalysis assessment = optAnalysis.get();
        List<BatteryAnalysis> historyLogs = batteryAnalysisRepository.findByVehicleVehicleIdOrderByCreatedAtAsc(link.getVehicleId());

        return ResponseEntity.ok(Map.of(
            "success", true,
            "assessment", assessment,
            "history", historyLogs
        ));
    }
}

package com.example.evbatteryhealth.controller;

import com.example.evbatteryhealth.model.User;
import com.example.evbatteryhealth.model.OtpVerification;
import com.example.evbatteryhealth.repository.UserRepository;
import com.example.evbatteryhealth.repository.OtpVerificationRepository;
import com.example.evbatteryhealth.util.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost:5175", "http://127.0.0.1:5175"})
public class AuthController {

    private final UserRepository userRepository;
    private final OtpVerificationRepository otpRepository;
    private final JavaMailSender mailSender;

    @Autowired
    public AuthController(UserRepository userRepository, 
                          OtpVerificationRepository otpRepository, 
                          JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.mailSender = mailSender;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String gmail = request.get("gmail");
        if (gmail == null || gmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Gmail is required."));
        }
        gmail = gmail.trim().toLowerCase();

        // Check if user already exists
        if (userRepository.findByGmail(gmail).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Gmail is already registered."));
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);

        // Save or Update OTP
        OtpVerification otpVerification = otpRepository.findByGmail(gmail)
                .orElse(new OtpVerification());
        otpVerification.setGmail(gmail);
        otpVerification.setOtp(otp);
        otpVerification.setExpiryTime(expiryTime);
        otpRepository.save(otpVerification);

        // Send Email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("prateek2222kumar@gmail.com");
            message.setTo(gmail);
            message.setSubject("Diagnostics Terminal Verification Code");
            message.setText("Dear User,\n\nYour 6-digit verification code for registration is: " + otp + "\n\nThis OTP is valid for 5 minutes. If you did not request this code, please ignore this email.\n\nBest regards,\nEV Diagnostics Terminal Team");
            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to send OTP via email: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "6-digit OTP code sent successfully to " + gmail));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String phoneNumber = request.get("phoneNumber");
        String gmail = request.get("gmail");
        String password = request.get("password");
        String otp = request.get("otp");
        String role = request.get("role");

        if (name == null || name.trim().isEmpty() ||
            gmail == null || gmail.trim().isEmpty() ||
            password == null || password.trim().isEmpty() ||
            otp == null || otp.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "All fields are required."));
        }

        gmail = gmail.trim().toLowerCase();
        otp = otp.trim();

        // Verify OTP
        Optional<OtpVerification> optOtp = otpRepository.findByGmail(gmail);
        if (optOtp.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No OTP record found. Please send OTP first."));
        }

        OtpVerification otpVerification = optOtp.get();
        if (otpVerification.getExpiryTime().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "OTP has expired. Please request a new one."));
        }

        if (!otpVerification.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Incorrect OTP. Verification failed."));
        }

        // Verify user doesn't exist
        if (userRepository.findByGmail(gmail).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Gmail is already registered."));
        }

        // Hash password
        String passwordHash = PasswordEncoder.hashPassword(password);

        // Save User with role
        User user = new User(name, phoneNumber, gmail, passwordHash, role);
        userRepository.save(user);

        // Delete used OTP record
        otpRepository.delete(otpVerification);

        return ResponseEntity.ok(Map.of("success", true, "message", "Registration successful. You can now log in."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String gmail = request.get("gmail");
        String password = request.get("password");

        if (gmail == null || gmail.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Gmail and password are required."));
        }

        gmail = gmail.trim().toLowerCase();

        // Find user
        Optional<User> optUser = userRepository.findByGmail(gmail);
        if (optUser.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid email or password."));
        }

        User user = optUser.get();
        if (!PasswordEncoder.checkPassword(password, user.getPasswordHash())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid email or password."));
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "name", user.getName(),
            "gmail", user.getGmail(),
            "role", user.getRole()
        ));
    }
}

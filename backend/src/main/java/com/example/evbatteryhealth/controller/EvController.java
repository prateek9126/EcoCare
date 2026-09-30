package com.example.evbatteryhealth.controller;

import com.example.evbatteryhealth.model.EvModel;
import com.example.evbatteryhealth.model.EvDealer;
import com.example.evbatteryhealth.model.EvServiceCenter;
import com.example.evbatteryhealth.repository.EvModelRepository;
import com.example.evbatteryhealth.repository.EvDealerRepository;
import com.example.evbatteryhealth.repository.EvServiceCenterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/evs")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000", "http://localhost:5175", "http://127.0.0.1:5175"})
public class EvController {

    private final EvModelRepository evRepository;
    private final EvDealerRepository dealerRepository;
    private final EvServiceCenterRepository serviceCenterRepository;

    @Autowired
    public EvController(EvModelRepository evRepository, 
                        EvDealerRepository dealerRepository, 
                        EvServiceCenterRepository serviceCenterRepository) {
        this.evRepository = evRepository;
        this.dealerRepository = dealerRepository;
        this.serviceCenterRepository = serviceCenterRepository;
    }

    @PostConstruct
    public void seedEvDatabase() {
        // Clean existing EV Models to reload the new master list schema
        evRepository.deleteAll();
        
        List<EvModel> evs = new ArrayList<>();
        
        // ==========================================
        // 1. ELECTRIC SCOOTERS
        // ==========================================
        
        // Scooter Budget ₹50,000–₹80,000
        evs.add(new EvModel("Ola", "S1 Z", "ELECTRIC_SCOOTER", "Utility", 59900.0, 74900.0, 
            100, 2.0, 300, "No", 75, 4.0, 112, 3, 3, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Extremely affordable entry pricing,Comfortable spacious footboard,Generous load capacity", 
            "No fast charging support,Instrument cluster display is very basic,Brakes are spongy in wet weather",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.18));
            
        evs.add(new EvModel("Vida", "VX2", "ELECTRIC_SCOOTER", "Standard", 65000.0, 78000.0, 
            105, 2.1, 320, "No", 70, 4.1, 88, 3, 3, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Removable battery convenience,Solid build quality from Hero MotoCorp,Good city suspensions", 
            "Relatively low top speed,Limited smart features compared to premium Vida models,Small underseat boot space",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.19));

        // Scooter Budget ₹80,000–₹1,00,000
        evs.add(new EvModel("Ola", "S1 X", "ELECTRIC_SCOOTER", "Standard", 79999.0, 99999.0, 
            151, 3.0, 360, "Yes", 90, 4.2, 320, 5, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Generous 34L under-seat boot storage,High certified range for its budget category,Responsive performance", 
            "Plastic panel quality feels basic,Requires physical key instead of app control,Stiff riding seat",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.20));

        evs.add(new EvModel("TVS", "Orbiter", "ELECTRIC_SCOOTER", "Standard", 84900.0, 97000.0, 
            120, 2.5, 280, "No", 80, 4.3, 115, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Highly comfortable seat padding,Reliable metal body panels,Very smooth throttle responses", 
            "Console lacks navigation features,Eco mode acceleration feels slow,No fast charging accessory",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.22));

        evs.add(new EvModel("Honda", "QC1", "ELECTRIC_SCOOTER", "Standard", 89900.0, 99000.0, 
            115, 2.3, 260, "No", 78, 4.4, 95, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Trusted Honda Japanese engineering,Excellent build finish quality,Plush and smooth ride suspension", 
            "Styling is extremely conservative,Lacks fast charging support,Dealer network only in tier-1 metro cities",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.21));

        evs.add(new EvModel("Kinetic Green", "E-Luna", "ELECTRIC_SCOOTER", "Utility", 79990.0, 94990.0, 
            110, 2.0, 240, "No", 50, 4.2, 140, 3, 3, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Heavy-duty tubular utility chassis,Excellent load carrying capacity,Low replacement parts cost", 
            "Very low top speed of 50 km/h,Minimal seating comfort padding,Very basic analog display dials",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.15));

        // Scooter Budget ₹1,00,000–₹1,25,000
        evs.add(new EvModel("Ola", "S1 X+", "ELECTRIC_SCOOTER", "Standard", 99999.0, 109000.0, 
            151, 3.0, 360, "Yes", 90, 4.3, 280, 5, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Smart connectivity features,Spacious under-seat boot,Competitive price-to-range value", 
            "Minor software bugs,Default suspension feels slightly firm over bumps,Plastic body creaking",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.20));

        evs.add(new EvModel("TVS", "iQube", "ELECTRIC_SCOOTER", "Standard", 107000.0, 122000.0, 
            100, 2.2, 300, "No", 78, 4.5, 510, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Extremely reliable TVS metal body shell,Quiet hub motor operation,Very comfortable for families", 
            "Conservative styling design,Underseat space is limited,No standard fast charging adapter",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "/images/tiago_ev.jpg", 0.24)); // Reusing loaded asset for visual diversity

        evs.add(new EvModel("Bajaj", "Chetak", "ELECTRIC_SCOOTER", "Standard", 115000.0, 120000.0, 
            113, 2.9, 290, "No", 73, 4.4, 420, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Full metal steel body panels,Premium neo-retro look and feel,High resale value", 
            "Low top speed,No front disc brakes in entry variant,Screen is basic monochrome LCD",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.23));

        evs.add(new EvModel("Bajaj", "Chetak C25", "ELECTRIC_SCOOTER", "Standard", 100000.0, 110000.0, 
            105, 2.5, 270, "No", 70, 4.2, 95, 3, 3, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Robust metal body shell,Sturdy riding frame,Reasonable price for Bajaj trust", 
            "Analog-style basic dashboard,Slightly slow acceleration compared to S1 X,No fast charge option",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.24));

        evs.add(new EvModel("Honda", "Activa e", "ELECTRIC_SCOOTER", "Standard", 110000.0, 125000.0, 
            102, 2.6, 280, "No", 80, 4.3, 110, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Strong brand trust and durability,Plush family seat,Sturdy suspension setup", 
            "No front disc brake,Lacks fancy screen widgets,Available only in select cities",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.22));

        evs.add(new EvModel("Vida", "V2", "ELECTRIC_SCOOTER", "Standard", 115000.0, 125000.0, 
            110, 2.8, 300, "Yes", 80, 4.2, 130, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Convenient dual removable battery packs,Sleek futuristic headlight cowl,Quick acceleration", 
            "Polarizing headlight looks,Relatively high seat height,Dashboard can glitch in heavy rains",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.21));

        evs.add(new EvModel("Ampere", "Nexus", "ELECTRIC_SCOOTER", "Standard", 110000.0, 120000.0, 
            136, 3.0, 200, "Yes", 93, 4.3, 145, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Durable LFP battery chemistry longevity,High top speed in category (93 km/h),Stable chassis", 
            "Suspension feels stiff on gravel,Basic instrumentation,Limited design color options",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.20));

        // Scooter Budget ₹1,25,000–₹1,50,000
        evs.add(new EvModel("Ola", "S1 Pro", "ELECTRIC_SCOOTER", "Performance", 125000.0, 147000.0, 
            195, 4.0, 390, "Yes", 120, 4.4, 520, 8, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "High top speed of 120 km/h,Massive 4.0 kWh battery range (195 km),Feature packed navigation screen", 
            "Customer service response is slow,Infotainment touch panel heats up in direct sun,Software restarts needed",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.20));

        evs.add(new EvModel("Ather", "450S", "ELECTRIC_SCOOTER", "Premium", 126000.0, 135000.0, 
            115, 2.9, 330, "Yes", 90, 4.5, 310, 5, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Precise battery range algorithms,Astonishing frame cornering handling,Durable battery warranty", 
            "Deep discharge issues if parked idle for weeks,Slightly expensive for the range offered",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.25));

        evs.add(new EvModel("Ather", "Rizta", "ELECTRIC_SCOOTER", "Standard", 125000.0, 145000.0, 
            123, 2.9, 340, "Yes", 80, 4.6, 180, 5, 5, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Largest family seat in segment,Brilliant traction control safety,Underseat and front storage hooks", 
            "Boxy rear styling design,Tuned conservatively (acceleration is gentle),Slightly wide floorboard",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.24));

        evs.add(new EvModel("TVS", "iQube S", "ELECTRIC_SCOOTER", "Premium", 125000.0, 148000.0, 
            145, 3.4, 270, "No", 78, 4.5, 290, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Excellent dual suspension comfort,Very readable TFT cluster,Spacious family footboard", 
            "Does not support DC fast chargers,Classic boxy styling looks old,Heavy overall vehicle weight",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.24));

        evs.add(new EvModel("Bajaj", "Chetak Premium", "ELECTRIC_SCOOTER", "Premium", 135000.0, 148000.0, 
            127, 3.2, 270, "No", 73, 4.5, 310, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "All metal construction durability,Premium colored TFT dashboard,Class-leading paint finish", 
            "Lower top speed of 73 km/h,Slow charger included in package,Front suspension can feel firm",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.23));

        evs.add(new EvModel("Bajaj", "Chetak Urbane", "ELECTRIC_SCOOTER", "Premium", 125000.0, 135000.0, 
            113, 2.9, 290, "No", 73, 4.3, 112, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Metal panels premium feel,Graceful smooth acceleration curves,Good commuter braking system", 
            "Lacks fast charging,Smaller battery than Premium variant,Dashboard UI is basic",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.24));

        evs.add(new EvModel("Simple Energy", "One", "ELECTRIC_SCOOTER", "Performance", 145000.0, 150000.0, 
            212, 4.8, 180, "Yes", 105, 4.2, 75, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Astonishing range (212 km real-world),Extreme 4.8 kWh dual battery setup,High top speed", 
            "Massive delivery booking waitlists,Relatively new brand with limited dealers,Weight is high",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.26));

        // Scooter Budget ₹1,50,000–₹2,00,000
        evs.add(new EvModel("Ather", "450X", "ELECTRIC_SCOOTER", "Performance", 154000.0, 172000.0, 
            150, 3.7, 340, "Yes", 90, 4.6, 580, 5, 5, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Brilliant cornering agility,Google Maps screen navigation integration,Reliable heat management system", 
            "Ather Grid public charging is paid subscription,Rear seat has tight legroom for pillion",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.28));

        evs.add(new EvModel("Ather", "450 Apex", "ELECTRIC_SCOOTER", "Performance", 189000.0, 199000.0, 
            157, 3.7, 340, "Yes", 100, 4.7, 92, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Exclusive transparent body panel design,Warp Plus throttle mode acceleration,High speed response", 
            "Extremely high acquisition cost,Firm suspension limits pillion comfort,No utility cargo room",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.30));

        evs.add(new EvModel("TVS", "iQube ST", "ELECTRIC_SCOOTER", "Premium", 155000.0, 185000.0, 
            150, 4.5, 250, "Yes", 82, 4.6, 210, 3, 5, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Massive battery capacity,Large comfortable sofa-style seats,Premium digital console touchscreen", 
            "Bulky vehicle chassis,High speed acceleration is gentle,Premium pricing bracket",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.24));

        evs.add(new EvModel("River", "Indie", "ELECTRIC_SCOOTER", "Utility", 150000.0, 160000.0, 
            120, 4.0, 300, "Yes", 90, 4.5, 84, 5, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Massive underseat utility storage,Unique guard cages and accessory rails,Excellent city suspension", 
            "Relatively heavy scooter weight,Brand is new with limited localized service centers,Wide seat",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981852-426c6c22a09a?auto=format&fit=crop&w=300&q=80", 0.25));

        
        // ==========================================
        // 2. ELECTRIC BIKES
        // ==========================================
        
        // Bike Budget ₹80,000–₹1,00,000
        evs.add(new EvModel("Ola", "Roadster X", "ELECTRIC_BIKE", "Commuter", 79999.0, 99999.0, 
            117, 2.5, 260, "Yes", 105, 4.2, 185, 8, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Budget entry pricing for an electric motorcycle,Sleek roadster styling,Sporty split seats", 
            "Lightweight build chassis,Braking lacks bite on high speeds,Basic software display",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.22));

        evs.add(new EvModel("Revolt", "RV1", "ELECTRIC_BIKE", "Commuter", 84900.0, 95000.0, 
            100, 2.2, 180, "No", 75, 4.1, 98, 5, 3, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Very low commuter running cost,Upright comfortable seating geometry,Metal guard frame standard", 
            "Low top speed,Basic digital dial without navigation maps,Average high speed performance",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.24));

        // Bike Budget ₹1,00,000–₹1,25,000
        evs.add(new EvModel("Ola", "Roadster X+", "ELECTRIC_BIKE", "Street", 110000.0, 120000.0, 
            150, 3.5, 300, "Yes", 115, 4.3, 112, 8, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Excellent acceleration and top speed,Generous range for street commuting,Digital cluster console", 
            "Customer service response is slow,Firm seat cushion,Stiff suspensions over deep potholes",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.22));

        evs.add(new EvModel("Revolt", "RV1+", "ELECTRIC_BIKE", "Commuter", 100000.0, 110000.0, 
            115, 2.8, 200, "No", 75, 4.2, 88, 5, 3, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Affordable price with decent range,Low maintenance bike parts,Excellent commuter ergonomics", 
            "Lacks high top speeds,Standard console lacks smart app maps,Hub motor power is modest",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.24));

        evs.add(new EvModel("Revolt", "RVX", "ELECTRIC_BIKE", "Street", 115000.0, 125000.0, 
            120, 3.0, 220, "No", 80, 4.2, 70, 5, 3, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Sporty graphics styling,Good commuter ride suspension,Sturdy metal frame panels", 
            "Average initial torque,Basic screen,Service network response is moderate",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.24));

        evs.add(new EvModel("Oben", "Rorr EZ", "ELECTRIC_BIKE", "Street", 110000.0, 120000.0, 
            110, 2.6, 200, "Yes", 95, 4.3, 56, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Robust LFP battery chemistry safety,High acceleration response,Sleek chassis styling", 
            "Basic cluster,Pillion seat is narrow,Brand is new with few dealerships",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.23));

        // Bike Budget ₹1,25,000–₹1,50,000
        evs.add(new EvModel("Revolt", "RV400", "ELECTRIC_BIKE", "Street", 125000.0, 149000.0, 
            150, 3.24, 270, "Yes", 85, 4.3, 520, 5, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Removable battery convenience,Artificial customizable engine sound speaker,Lightweight handling", 
            "Plastic panel quality could be improved,Suspension feels stiff,Basic digital dash",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "/images/revolt_bike.jpg", 0.25));

        evs.add(new EvModel("Oben", "Rorr", "ELECTRIC_BIKE", "Street", 149000.0, 150000.0, 
            187, 4.4, 120, "Yes", 100, 4.4, 110, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Fast home charging (2 hours full),High real-world range,Structural LFP battery block", 
            "Dashboard screen has software bugs,Seat foam is stiff,Limited tier-2 city service centers",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.22));

        evs.add(new EvModel("Tork", "Kratos R", "ELECTRIC_BIKE", "Performance", 149000.0, 150000.0, 
            180, 4.0, 120, "Yes", 105, 4.3, 140, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Axial Flux motor with strong mid-range torque,Eco mode performance efficiency,Sporty looks", 
            "Minimal rear pillion passenger comfort padding,DC fast charging requires extra setup,Brand presence",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.22));

        evs.add(new EvModel("Hop", "OXO", "ELECTRIC_BIKE", "Street", 130000.0, 140000.0, 
            135, 3.75, 240, "Yes", 90, 4.1, 48, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Very comfortable riding ergonomics,Decent range for daily street commute,Good braking", 
            "Console lacks navigation features,Firm rear shocks,Moderate acceleration response",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.24));

        // Bike Budget ₹1,50,000–₹2,00,000
        evs.add(new EvModel("Matter", "Aera", "ELECTRIC_BIKE", "Performance", 160000.0, 180000.0, 
            125, 5.0, 300, "Yes", 105, 4.4, 96, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Unique 4-speed manual gearbox,Liquid-cooled battery pack stability,Instant sports styling acceleration", 
            "Heavy motorcycle weight,Gearbox shifter needs getting used to,Brand network is limited",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.28));

        evs.add(new EvModel("Kabira Mobility", "KM3000", "ELECTRIC_BIKE", "Performance", 165000.0, 175000.0, 
            120, 4.0, 180, "Yes", 100, 4.2, 60, 3, 3, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Supersport fully faired racing styling,Rapid initial acceleration,Premium build design", 
            "Low ground clearance,Plastic fairings feel thin,Rear passenger seat is very high",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.26));

        evs.add(new EvModel("Orxa", "Mantis", "ELECTRIC_BIKE", "Performance", 180000.0, 200000.0, 
            150, 4.5, 210, "Yes", 110, 4.3, 40, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Futuristic streetfighter styling design,High speed handling performance,Lightweight frame", 
            "Stiff passenger seat,Relatively expensive pricing,Limited dealer touchpoints",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.27));

        evs.add(new EvModel("Hop", "OXO X", "ELECTRIC_BIKE", "Street", 160000.0, 170000.0, 
            150, 4.0, 200, "Yes", 95, 4.2, 38, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Durable commuter frame,Decent range specs,Ergonomic riding posture", 
            "No navigation map display,Conservative acceleration compared to Revolt,Firm shocks",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.25));

        // Bike Budget ₹2,00,000–₹2,50,000
        evs.add(new EvModel("Ultraviolette", "X47", "ELECTRIC_BIKE", "Performance", 210000.0, 230000.0, 
            160, 4.5, 180, "Yes", 125, 4.5, 68, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Stunning sports styling aesthetics,Aggressive streetfighter riding dynamics,Premium ADAS indicators", 
            "Committed forward sport stance,Premium acquisition cost,Hard seat cushion",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.32));

        // Bike Budget ₹2,50,000–₹3,00,000
        evs.add(new EvModel("Royal Enfield", "Flying Flea C6", "ELECTRIC_BIKE", "Performance", 260000.0, 290000.0, 
            150, 5.0, 120, "Yes", 120, 4.6, 122, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Classic vintage girder suspension aesthetic,Lightweight aluminum chassis,Smooth RE throttle curves", 
            "Premium price bracket,No luggage mount points,Limited pillion passenger seat space",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.30));

        // Bike Budget ₹3,00,000+
        evs.add(new EvModel("Ultraviolette", "F77 Mach 2", "ELECTRIC_BIKE", "Performance", 299000.0, 399000.0, 
            323, 10.3, 150, "Yes", 155, 4.8, 142, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Stunning rocket speed acceleration (0-60 in 2.8s),Massive 323 km driving range,Fascinating handling agility", 
            "Very high purchase cost,Stiff track oriented suspension setup,Rear pillion comfort is minimal",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.35));

        evs.add(new EvModel("Ultraviolette", "F77 SuperStreet", "ELECTRIC_BIKE", "Performance", 450000.0, 499000.0, 
            323, 10.3, 150, "Yes", 155, 4.9, 32, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Carbon fiber sports styling panels,Track-tuned high response throttle,Premium Brembo brakes", 
            "Extremely premium price tag,Rider posture is very committed,Limited city road practicality",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=300&q=80", 0.35));


        // ==========================================
        // 3. ELECTRIC CARS
        // ==========================================
        
        // Car Budget ₹5,00,000–₹8,00,000
        evs.add(new EvModel("Tata", "Tiago EV", "ELECTRIC_CAR", "Hatchback", 799000.0, 1099000.0, 
            315, 24.0, 340, "Yes, 25 kW DC", 120, 4.4, 380, 8, 4, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Superb budget-friendly entry price,Compact footprint perfect for city streets,Decent real-world range", 
            "AC home charging takes 6.9 hours,Highway range drops on high speed speeds,Infotainment startup is slow",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "/images/tiago_ev.jpg", 1.10));

        // Car Budget ₹8,00,000–₹10,00,000 (Covered by Tiago EV Higher variants above, keeping rules clean)

        // Car Budget ₹10,00,000–₹13,00,000
        evs.add(new EvModel("Tata", "Punch EV", "ELECTRIC_CAR", "SUV", 1099000.0, 1329000.0, 
            421, 35.0, 330, "Yes, 50 kW DC", 140, 4.5, 210, 8, 5, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "High ground clearance (190mm),Excellent SUV road posture,GNCAP 5-star crash safety certified", 
            "Real world range drops to ~310 km,Minor software glitches in instrument panel,Wide dashboard layout",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.15));

        evs.add(new EvModel("MG", "Comet EV", "ELECTRIC_CAR", "Hatchback", 699000.0, 858000.0, 
            230, 17.3, 420, "No", 100, 4.3, 142, 8, 3, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Ultra-compact city footprint,Extremely loaded tech infotainment cabin,Easy to park in tiny lanes", 
            "Does not support DC fast charging,Teeny tiny boot storage space,Poor highway stability above 90 km/h",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 0.90));

        evs.add(new EvModel("Citroën", "eC3", "ELECTRIC_CAR", "Hatchback", 1161000.0, 1262000.0, 
            320, 29.2, 340, "Yes, 30 kW DC", 107, 4.1, 75, 3, 3, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Superbly plush ride comfort suspension,Generous spacious front and rear seats,Large boot", 
            "Lacks basic automatic climate control,Modest highway motor performance,Cabin feels low cost",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.20));

        // Car Budget ₹13,00,000–₹16,00,000
        evs.add(new EvModel("Tata", "Nexon EV", "ELECTRIC_CAR", "SUV", 1449000.0, 1620000.0, 
            465, 40.5, 340, "Yes, 50 kW DC", 150, 4.5, 410, 8, 5, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "5-star GNCAP safety crash protection,Premium cabin styling with 360 camera,Excellent ride handling", 
            "Real-world highway range drops to ~310km,Infotainment lag in start,Wide pillars limit front view",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "/images/nexon_ev.jpg", 1.20));

        evs.add(new EvModel("MG", "Windsor EV", "ELECTRIC_CAR", "MPV", 1349000.0, 1549000.0, 
            331, 38.0, 240, "Yes, 50 kW DC", 130, 4.4, 180, 8, 4, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Plush rear lounge recline seats (256-degree),Massive 604L boot cargo room,Outstanding cabin space", 
            "BaaS battery subscription model can be complex,Styling is polarizing,No physical dashboard dials",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "/images/windsor_ev.jpg", 1.00));

        // Car Budget ₹16,00,000–₹20,00,000
        evs.add(new EvModel("Mahindra", "XUV400 EV", "ELECTRIC_CAR", "SUV", 1549000.0, 1749000.0, 
            456, 39.4, 300, "Yes, 50 kW DC", 150, 4.3, 160, 3, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Very spacious cabin legroom,Fierce acceleration (0-100 in 8.3s),Punchy electric steering response", 
            "Interior layout feels outdated,AC home charging is slow,Brand service focuses on diesel cars",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.25));

        evs.add(new EvModel("Tata", "Curvv EV", "ELECTRIC_CAR", "SUV", 1749000.0, 1999000.0, 
            585, 55.0, 240, "Yes, 70 kW DC", 160, 4.6, 210, 8, 5, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Stunning coupe-SUV sloping roof stance,Long real-world highway range (450km),Premium ADAS specs", 
            "Sloping rear roof limits headroom,Heavy steering response at low speeds,Rear boot loading lip is high",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.22));

        evs.add(new EvModel("Maruti Suzuki", "e Vitara", "ELECTRIC_CAR", "SUV", 1699000.0, 1999000.0, 
            500, 49.0, 280, "Yes, 60 kW DC", 150, 4.5, 340, 8, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Trusted Suzuki dependability and parts,Solid SUV stance,Good range performance", 
            "Plain steering styling,Moderate initial acceleration torque,Available cities are limited on launch",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.20));

        evs.add(new EvModel("Hyundai", "Creta Electric", "ELECTRIC_CAR", "SUV", 1800000.0, 1999000.0, 
            480, 45.0, 300, "Yes, 50 kW DC", 150, 4.6, 240, 5, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Highly popular exterior aesthetics,Full safety suite with Level 2 ADAS,Plush interior space", 
            "Waitlist delivery times are long,Steering feel is light,High pricing relative to Tiago/Punch",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.30));

        // Car Budget ₹20,00,000–₹25,00,000
        evs.add(new EvModel("Mahindra", "BE 6", "ELECTRIC_CAR", "SUV", 2000000.0, 2400000.0, 
            500, 60.0, 180, "Yes, 80 kW DC", 160, 4.5, 52, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Sporty design curves,Advanced layout digital cockpit,Fast charging response", 
            "Ride is firm on gravel roads,Lacks basic physical dials,Brand presence in EV is small",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.35));

        evs.add(new EvModel("Mahindra", "XEV 9e", "ELECTRIC_CAR", "SUV", 2100000.0, 2490000.0, 
            550, 70.0, 210, "Yes, 80 kW DC", 170, 4.6, 48, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Unique triple screen layout console,Stunning panoramic glass sunroof,Spacious passenger cabin", 
            "Very large dimensions difficult for tight parking,Premium price tag,Minor software console lag",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.40));

        evs.add(new EvModel("MG", "ZS EV", "ELECTRIC_CAR", "SUV", 1898000.0, 2544000.0, 
            461, 50.3, 360, "Yes, 50 kW DC", 140, 4.5, 310, 8, 5, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Linear power delivery,Panoramic sliding sunroof,Excellent cabin plastic fit and finish", 
            "Rear seat under-thigh support is basic,Suspension feels soft on undulating highways,Outdated layout",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.25));

        evs.add(new EvModel("Kia", "Carens Clavis EV", "ELECTRIC_CAR", "MPV", 2000000.0, 2400000.0, 
            450, 50.0, 280, "Yes, 60 kW DC", 140, 4.4, 72, 3, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Practical 3-row family seating,Excellent storage trays,Sleek LED headlight bars", 
            "Boxy profile,Steering feels overly light,Available only in select cities on launch",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.30));

        // Car Budget ₹25,00,000–₹35,00,000
        evs.add(new EvModel("MG", "M9", "ELECTRIC_CAR", "MPV", 2900000.0, 3400000.0, 
            540, 75.0, 300, "Yes, 80 kW DC", 160, 4.5, 34, 8, 4, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Super luxury MPV slide doors,First class flight lounge style seats,Excellent cabin quietness", 
            "Large size makes city parking difficult,Lacks sport handling curves,High pricing tier",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.45));

        evs.add(new EvModel("Hyundai", "Ioniq 5", "ELECTRIC_CAR", "SUV", 3495000.0, 3500000.0, 
            631, 72.6, 108, "Yes, 350 kW DC", 185, 4.8, 115, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Gorgeous pixel retro design stance,Extremely fast charging (10-80% in 18 mins),Relaxing front leg lounge", 
            "No rear windshield wiper,High ex-showroom price,Wide footprint",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.50));

        evs.add(new EvModel("Kia", "EV6", "ELECTRIC_CAR", "Crossover", 3390000.0, 3490000.0, 
            708, 77.4, 108, "Yes, 350 kW DC", 192, 4.8, 88, 3, 5, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Futuristic crossover styling,Very sharp and sporty steering dynamics,High battery driving range", 
            "Low rear passenger headroom,Stiff suspension over speed bumps,Low ground clearance",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.55));

        evs.add(new EvModel("BYD", "Atto 3", "ELECTRIC_CAR", "SUV", 2499000.0, 3399000.0, 
            521, 60.48, 300, "Yes, 80 kW DC", 160, 4.7, 95, 8, 5, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Superb blade battery fire safety,Quirky guitar-string layout door trims,Brilliant screen rotation console", 
            "Quirky interior styling is polarizing,Brand is relatively new in Indian market,Moderate rear headroom",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "/images/byd_atto.jpg", 1.30));

        evs.add(new EvModel("BYD", "Seal", "ELECTRIC_CAR", "Sedan", 2700000.0, 3500000.0, 
            650, 82.5, 270, "Yes, 150 kW DC", 180, 4.8, 84, 8, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Ultra aerodynamic sedan sport profile,Excellent pricing value-for-money ratio,Extremely quick acceleration", 
            "Very low ground clearance (145mm),Stiff track suspension over potholes,No rear camera wiper",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.40));

        // Car Budget ₹35,00,000–₹50,00,000
        evs.add(new EvModel("Kia", "EV9", "ELECTRIC_CAR", "SUV", 3800000.0, 4990000.0, 
            561, 99.8, 150, "Yes, 350 kW DC", 180, 4.7, 45, 3, 5, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Massive road presence three-row SUV,V2L power external electronics,High charging speed", 
            "Very large size hard to maneuver in lanes,High ex-showroom price,Heavy vehicle body weight",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.60));

        evs.add(new EvModel("BYD", "Sealion 7", "ELECTRIC_CAR", "SUV", 3600000.0, 4500000.0, 
            550, 80.0, 240, "Yes, 120 kW DC", 180, 4.6, 32, 8, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Premium leather interior upholstery comfort,Safe blade battery architecture,Comfortable ride suspension", 
            "Brand is new with few dealers,No physical dashboard dials,Low rear window visibility",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.45));

        evs.add(new EvModel("BMW", "iX1", "ELECTRIC_CAR", "SUV", 4500000.0, 4990000.0, 
            440, 66.4, 180, "Yes, 130 kW DC", 180, 4.5, 84, 8, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Exciting sporty driving dynamics,Premium curved screen infotainment,Sturdy build finish", 
            "Limited cargo trunk space,Rear passenger seat legroom is average,Stiff suspension",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.50));

        evs.add(new EvModel("Volvo", "EX30", "ELECTRIC_CAR", "SUV", 3500000.0, 4200000.0, 
            475, 69.0, 150, "Yes, 150 kW DC", 180, 4.5, 48, 5, 5, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Sustainable cabin materials styling,Excellent crash safety framework,Fast initial acceleration", 
            "Small rear seat legroom,No driver cluster display (all on central screen),Firm shocks",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.40));

        evs.add(new EvModel("Volvo", "EX40", "ELECTRIC_CAR", "SUV", 4300000.0, 4900000.0, 
            530, 78.0, 160, "Yes, 150 kW DC", 180, 4.6, 62, 5, 5, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Rugged masculine SUV design profile,Class-leading crash safety cage,Pleasing real-world range", 
            "Firm suspension limits back seat comfort,Rear window visibility is low,High price tag",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.45));

        evs.add(new EvModel("Audi", "Q4 e-tron", "ELECTRIC_CAR", "SUV", 4500000.0, 4990000.0, 
            511, 82.0, 180, "Yes, 135 kW DC", 180, 4.6, 52, 5, 5, 1, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Spacious and quiet cabin styling,Audi Virtual Cockpit dashboard,Comfortable soft ride", 
            "Acceleration is linear but not sport-fast,Touchpad steering controls are sensitive,Expensive",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.50));

        // Car Budget ₹50,00,000–₹75,00,000
        evs.add(new EvModel("BMW", "iX", "ELECTRIC_CAR", "SUV", 5500000.0, 7400000.0, 
            425, 76.6, 210, "Yes, 150 kW DC", 200, 4.7, 65, 8, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Lounge interior aesthetics design,Fascinating carbon fiber safety cage,Quiet highway ride comfort", 
            "Polarizing kidney grille looks,Range drop in freezing temperatures,Relatively heavy SUV",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.70));

        evs.add(new EvModel("BMW", "i5", "ELECTRIC_CAR", "Sedan", 6000000.0, 7200000.0, 
            516, 81.2, 180, "Yes, 205 kW DC", 230, 4.7, 54, 8, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Sharp athletic handling curves,Excellent curved screen infotainment console,Premium seat comfort", 
            "Stiff sport ride quality,Limited rear passenger headroom,High price bracket",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.65));

        evs.add(new EvModel("BMW", "i7", "ELECTRIC_CAR", "Sedan", 6500000.0, 7500000.0, 
            625, 101.7, 240, "Yes, 195 kW DC", 250, 4.8, 42, 8, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Theater-screen 31-inch roof console,Astounding interior sound insulation,Luxury back seat recline", 
            "Large chassis difficult for narrow roads,High premium cost,Complex dashboard controls",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.80));

        evs.add(new EvModel("Mercedes-Benz", "EQE", "ELECTRIC_CAR", "Sedan", 5500000.0, 7000000.0, 
            550, 90.6, 200, "Yes, 170 kW DC", 210, 4.6, 74, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Extremely low cabin wind noise,Luxurious wood interior trims,Smooth air suspension", 
            "Jellybean exterior shape is polarizing,Lower rear glass window limits view,Pricey options",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.70));

        evs.add(new EvModel("Mercedes-Benz", "EQS", "ELECTRIC_CAR", "Sedan", 6000000.0, 7500000.0, 
            857, 107.8, 240, "Yes, 200 kW DC", 210, 4.7, 98, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Unbelievable Hyperscreen dashboard console,Astounding 857 km driving range,Plush seat recline comfort", 
            "Rear passenger headroom is snug,Floaty highway ride character,Snouty front styling",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.75));

        evs.add(new EvModel("Porsche", "Macan EV", "ELECTRIC_CAR", "SUV", 6500000.0, 7500000.0, 
            613, 100.0, 126, "Yes, 270 kW DC", 220, 4.8, 38, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Fascinating sports SUV handling,Lightning-fast 270 kW charging speed,Sleek display console", 
            "Limited cargo trunk space,Very expensive options list,Rear seat space is average",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.80));

        // Car Budget ₹75,00,000+
        evs.add(new EvModel("Mercedes-Benz", "EQS SUV", "ELECTRIC_CAR", "SUV", 8500000.0, 9500000.0, 
            600, 108.4, 240, "Yes, 200 kW DC", 210, 4.7, 36, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Three-row luxury family space,Excellent soft air suspension,High driving range", 
            "Large size difficult for city roads,Very expensive acquisition cost,Heavy weight",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.85));

        evs.add(new EvModel("Porsche", "Taycan", "ELECTRIC_CAR", "Sedan", 9000000.0, 12000000.0, 
            500, 93.4, 135, "Yes, 270 kW DC", 260, 4.8, 82, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Astonishing sports car handling dynamics,Ultra-fast charging capability,Premium low stance look", 
            "Low ground clearance scrapes speedbumps,High maintenance costs,Snug cabin legroom",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 2.10));

        evs.add(new EvModel("Lotus", "Eletre", "ELECTRIC_CAR", "SUV", 9500000.0, 15000000.0, 
            600, 112.0, 120, "Yes, 350 kW DC", 265, 4.8, 22, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Extreme hyper-SUV performance specs,Futuristic aero-design tunnels,Ultra-fast charging speed", 
            "Huge vehicle footprint,Limited brand dealership touchpoints,Very expensive",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 2.20));

        evs.add(new EvModel("Rolls-Royce", "Spectre", "ELECTRIC_CAR", "Coupe", 75000000.0, 85000000.0, 
            530, 102.0, 210, "Yes, 195 kW DC", 250, 4.9, 12, 5, 5, 2, "Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "World's most silent luxury electric coupe ride,Handcrafted starlight cabin details,Aesthetic grace", 
            "Astounding purchase price,Massive dimensions difficult for narrow lanes,Heavy steering dynamics",
            "Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80", 4.50));

        // Seed EV Company models for dashboard reporting
        evs.add(new EvModel("EV Company", "EV 360", "ELECTRIC_CAR", "SUV", 1200000.0, 1400000.0, 
            360, 45.0, 240, "Yes, 50 kW DC", 140, 4.6, 420, 8, 5, 2, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Spacious premium cabin space,Advanced battery diagnostics suite,Excellent safety rating", 
            "Software glitches in dashboard telemetry,AC home charging is moderate speed",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.00));

        evs.add(new EvModel("EV Company", "E1", "ELECTRIC_CAR", "Hatchback", 850000.0, 1000000.0, 
            310, 30.0, 300, "Yes, 25 kW DC", 120, 4.5, 380, 5, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Affordable entry level price,Very compact for city traffic,Decent highway performance", 
            "AC home charging takes time,Limited legroom in the rear seat",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "/images/tiago_ev.jpg", 0.90));

        evs.add(new EvModel("EV Company", "E2", "ELECTRIC_CAR", "Sedan", 1050000.0, 1250000.0, 
            340, 38.0, 260, "Yes, 30 kW DC", 130, 4.4, 240, 5, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Elegant design styling,Smooth ride suspensions,Responsive brakes", 
            "Rear legroom is tight,Steering is light at high speeds",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 0.95));

        evs.add(new EvModel("EV Company", "E3", "ELECTRIC_CAR", "SUV", 1500000.0, 1800000.0, 
            420, 50.0, 220, "Yes, 50 kW DC", 150, 4.3, 110, 8, 4, 1, "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad",
            "Powerful dual motor drivetrain,Large boot storage space,High ground clearance", 
            "Firm suspension settings,Relatively premium pricing",
            "Jamshedpur,Bhubaneswar,Delhi,Mumbai,Bengaluru,Pune,Hyderabad", 
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=300&q=80", 1.20));

        evRepository.saveAll(evs);
        System.out.println(">>> Seeded " + evs.size() + " EV Models into database.");
        
        // Seed dealerships and service centers if they are empty
        seedDealersAndServiceCenters();
    }

    private void seedDealersAndServiceCenters() {
        if (dealerRepository.count() == 0) {
            List<EvDealer> dealers = new ArrayList<>();
            // Jamshedpur Dealers
            dealers.add(new EvDealer("Tata Motors - ABC Motors", "Jamshedpur", "Tata", "Bistupur Main Road, Jamshedpur", "+91 94311 02811", 4.3));
            dealers.add(new EvDealer("MG Jamshedpur - Singhania Motors", "Jamshedpur", "MG", "Outer Link Road, Adityapur, Jamshedpur", "+91 82911 39012", 4.4));
            dealers.add(new EvDealer("Ather Space Jamshedpur", "Jamshedpur", "Ather", "Sakchi Square, Jamshedpur", "+91 70761 45520", 4.6));
            dealers.add(new EvDealer("Ola Experience Center Jamshedpur", "Jamshedpur", "Ola", "Bistupur Shopping Area, Jamshedpur", "+91 93348 20042", 4.2));
            dealers.add(new EvDealer("TVS Jamshedpur - Speed Motors", "Jamshedpur", "TVS", "Sakchi Market, Jamshedpur", "+91 98351 10091", 4.5));
            dealers.add(new EvDealer("Revolt Hub Jamshedpur", "Jamshedpur", "Revolt", "L-Road, Bistupur, Jamshedpur", "+91 88472 10423", 4.1));
            dealers.add(new EvDealer("Tork Motors Jamshedpur", "Jamshedpur", "Tork", "Mango Main Road, Jamshedpur", "+91 92837 46522", 4.0));
            dealers.add(new EvDealer("Bajaj Chetak Jamshedpur Dealer", "Jamshedpur", "Bajaj", "Main Road Bistupur, Jamshedpur", "+91 99342 10243", 4.3));
            dealers.add(new EvDealer("Vida Hero Jamshedpur", "Jamshedpur", "Vida", "Sakchi Auto Lane, Jamshedpur", "+91 88371 90234", 4.2));

            // Bhubaneswar Dealers
            dealers.add(new EvDealer("Tata Motors - Gargya Motors", "Bhubaneswar", "Tata", "Cuttack-Puri Road, Bhubaneswar", "+91 94370 23812", 4.4));
            dealers.add(new EvDealer("MG Bhubaneswar - OSL Motors", "Bhubaneswar", "MG", "NH-16, Patia, Bhubaneswar", "+91 82911 39018", 4.5));
            dealers.add(new EvDealer("Ather Space Bhubaneswar", "Bhubaneswar", "Ather", "Janpath Road, Saheed Nagar, Bhubaneswar", "+91 70761 45529", 4.7));
            dealers.add(new EvDealer("Ola Experience Center Bhubaneswar", "Bhubaneswar", "Ola", "Infocity Road, Patia, Bhubaneswar", "+91 93348 20049", 4.3));
            dealers.add(new EvDealer("TVS Bhubaneswar - Subhadra TVS", "Bhubaneswar", "TVS", "Rasulgarh, Bhubaneswar", "+91 98351 10099", 4.6));
            dealers.add(new EvDealer("Revolt Hub Bhubaneswar", "Bhubaneswar", "Revolt", "Saheed Nagar, Bhubaneswar", "+91 88472 10429", 4.2));
            dealers.add(new EvDealer("Tork Motors Bhubaneswar", "Bhubaneswar", "Tork", "Nayapalli, Bhubaneswar", "+91 92837 46529", 4.1));
            dealers.add(new EvDealer("BYD Bhubaneswar - OSL BYD", "Bhubaneswar", "BYD", "NH-16, Rasulgarh, Bhubaneswar", "+91 95483 20381", 4.7));
            dealers.add(new EvDealer("Bajaj Chetak Bhubaneswar", "Bhubaneswar", "Bajaj", "Patia Square, Bhubaneswar", "+91 99371 98234", 4.4));

            // Fallback Metro Dealers (Bengaluru/Delhi)
            dealers.add(new EvDealer("Ather Space Indiranagar", "Bengaluru", "Ather", "100 Feet Rd, Indiranagar, Bengaluru", "+91 80471 86601", 4.8));
            dealers.add(new EvDealer("Ola Experience Center Koramangala", "Bengaluru", "Ola", "80 Feet Rd, Koramangala, Bengaluru", "+91 99000 12345", 4.4));
            dealers.add(new EvDealer("Tata Motors - Kropex Auto", "Bengaluru", "Tata", "Hosur Road, Bengaluru", "+91 90088 12345", 4.2));
            dealers.add(new EvDealer("MG Indiranagar", "Bengaluru", "MG", "100 Feet Rd, Indiranagar, Bengaluru", "+91 98888 77777", 4.5));
            dealers.add(new EvDealer("BMW Lutyens Delhi", "Delhi", "BMW", "Connaught Place, New Delhi", "+91 11432 90123", 4.7));
            dealers.add(new EvDealer("Mercedes-Benz Delhi - T&T Motors", "Delhi", "Mercedes-Benz", "Mathura Road, New Delhi", "+91 11452 89012", 4.6));
            dealers.add(new EvDealer("Mahindra EV Center Delhi", "Delhi", "Mahindra", "Dwarka Sector 10, New Delhi", "+91 99876 54321", 4.3));
            dealers.add(new EvDealer("Hyundai EV Plaza Delhi", "Delhi", "Hyundai", "South Ext Part-1, New Delhi", "+91 98123 45678", 4.5));

            dealerRepository.saveAll(dealers);
            System.out.println(">>> Seeded " + dealers.size() + " EV Dealerships.");
        }

        if (serviceCenterRepository.count() == 0) {
            List<EvServiceCenter> serviceCenters = new ArrayList<>();
            // Jamshedpur Service Centers
            serviceCenters.add(new EvServiceCenter("Tata Authorized EV Service - ABC Motors", "Jamshedpur", "Tata", "Bistupur Industrial Area, Jamshedpur", "+91 94311 02812", 4.4));
            serviceCenters.add(new EvServiceCenter("MG Service Center Jamshedpur", "Jamshedpur", "MG", "Adityapur Phase 2, Jamshedpur", "+91 82911 39013", 4.2));
            serviceCenters.add(new EvServiceCenter("Ather Care Jamshedpur", "Jamshedpur", "Ather", "Sakchi Industrial Estate, Jamshedpur", "+91 70761 45521", 4.7));
            serviceCenters.add(new EvServiceCenter("Ola Service Center Jamshedpur", "Jamshedpur", "Ola", "Jugsalai, Jamshedpur", "+91 93348 20043", 3.9));
            serviceCenters.add(new EvServiceCenter("TVS Service Workshop - Speed TVS", "Jamshedpur", "TVS", "Sakchi, Jamshedpur", "+91 98351 10092", 4.4));

            // Bhubaneswar Service Centers
            serviceCenters.add(new EvServiceCenter("Tata Service Center - Gargya Motors", "Bhubaneswar", "Tata", "Rasulgarh Industrial Area, Bhubaneswar", "+91 94370 23813", 4.3));
            serviceCenters.add(new EvServiceCenter("MG Service Center - Patia", "Bhubaneswar", "MG", "Patia Industrial Area, Bhubaneswar", "+91 82911 39019", 4.4));
            serviceCenters.add(new EvServiceCenter("Ather Care Saheed Nagar", "Bhubaneswar", "Ather", "Saheed Nagar, Bhubaneswar", "+91 70761 45522", 4.8));
            serviceCenters.add(new EvServiceCenter("Ola Service Center Patia", "Bhubaneswar", "Ola", "Patia, Bhubaneswar", "+91 93348 20044", 4.0));
            serviceCenters.add(new EvServiceCenter("TVS Workshop Rasulgarh", "Bhubaneswar", "TVS", "Rasulgarh, Bhubaneswar", "+91 98351 10093", 4.5));

            serviceCenterRepository.saveAll(serviceCenters);
            System.out.println(">>> Seeded " + serviceCenters.size() + " EV Service Centers.");
        }
    }

    // Endpoints
    @GetMapping
    public ResponseEntity<List<EvModel>> getAllEvs() {
        return ResponseEntity.ok(evRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvModel> getEvById(@PathVariable Long id) {
        return evRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Recommendation logic DTO
    public static class RecommendationRequest {
        public double budget;
        public String city;
        public String vehicleType; // ELECTRIC_SCOOTER, ELECTRIC_BIKE, ELECTRIC_CAR, ANY
        public Integer minRange;
        public String priority; // Price, Range, Charging, Reviews
    }

    public static class RecommendationResult {
        public EvModel ev;
        public double overallMatchScore;
        public double scoreBudget;
        public double scoreRange;
        public double scoreService;
        public double scoreReviews;
        public double scoreCharging;
        public double scoreValue;
        public List<String> explanation;
        public List<String> thingsToConsider;
        public List<EvDealer> localDealers;
        public int localServiceCentersCount;
    }

    @PostMapping("/recommend")
    public ResponseEntity<?> recommendEvs(@RequestBody RecommendationRequest request) {
        if (request.budget <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid budget. Budget must be greater than 0."));
        }
        if (request.city == null || request.city.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "City is required."));
        }

        List<EvModel> evs = evRepository.findAll();

        // 1. Filter by vehicle type strictly
        String filterType = request.vehicleType == null ? "ANY" : request.vehicleType.toUpperCase();
        List<EvModel> filtered = evs.stream()
                .filter(ev -> {
                    if (filterType.equals("ANY")) return true;
                    return ev.getVehicleType().equalsIgnoreCase(filterType);
                })
                .collect(Collectors.toList());

        if (filtered.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // 2. Score each vehicle
        List<RecommendationResult> results = new ArrayList<>();
        
        for (EvModel ev : filtered) {
            RecommendationResult result = new RecommendationResult();
            result.ev = ev;

            // Fetch local details based on brand name
            List<EvDealer> dealers = dealerRepository.findByCityIgnoreCaseAndBrandIgnoreCase(request.city, ev.getCompany());
            List<EvServiceCenter> serviceCenters = serviceCenterRepository.findByCityIgnoreCaseAndBrandIgnoreCase(request.city, ev.getCompany());
            
            result.localDealers = dealers;
            result.localServiceCentersCount = serviceCenters.size();
            if (result.localServiceCentersCount == 0 && ev.getServiceCenterCount() != null) {
                // If no specific service center entity exists in database, fallback to the model's static serviceCenterCount
                // or if the model specifies city availability, check if this city is within it
                String citiesStr = ev.getAvailableCities() != null ? ev.getAvailableCities().toLowerCase() : "";
                if (citiesStr.contains(request.city.toLowerCase())) {
                    result.localServiceCentersCount = ev.getServiceCenterCount();
                }
            }

            // Calculate Scoring categories (0-100)
            
            // A. Budget Fit (25%)
            // Prioritize vehicles whose ex-showroom price (minPrice / maxPrice) overlaps with user budget.
            double scoreBudgetVal = 0.0;
            if (ev.getMinPrice() <= request.budget) {
                if (ev.getMaxPrice() <= request.budget) {
                    scoreBudgetVal = 100.0; // Budget covers the entire range of variants
                } else {
                    // Budget covers the cheaper variants but not all
                    double rangeSize = ev.getMaxPrice() - ev.getMinPrice();
                    double excessCover = request.budget - ev.getMinPrice();
                    scoreBudgetVal = 80.0 + (20.0 * (rangeSize > 0 ? excessCover / rangeSize : 1.0));
                }
            } else {
                // Over budget
                double pctOver = (ev.getMinPrice() - request.budget) / request.budget;
                scoreBudgetVal = Math.max(0.0, 70.0 - (pctOver * 400.0)); // drops to 0 if minPrice is 17.5% over budget
            }
            result.scoreBudget = Math.round(scoreBudgetVal);

            // B. Range suitability (15%)
            double scoreRangeVal = 0.0;
            // Base range expectations on type
            double expectedMaxRange = 150.0;
            if (ev.getVehicleType().equalsIgnoreCase("ELECTRIC_CAR")) {
                expectedMaxRange = 600.0;
            } else if (ev.getVehicleType().equalsIgnoreCase("ELECTRIC_BIKE")) {
                expectedMaxRange = 250.0;
            }
            scoreRangeVal = Math.min(100.0, (ev.getRangeKm() / expectedMaxRange) * 100.0);
            
            // Penalize if it doesn't meet minimum user range
            if (request.minRange != null && ev.getRangeKm() < request.minRange) {
                scoreRangeVal = scoreRangeVal * 0.4;
            }
            result.scoreRange = Math.round(scoreRangeVal);

            // C. Service Availability in selected city (15%)
            double scoreServiceVal = 20.0; // baseline if 0 centers
            if (result.localServiceCentersCount >= 2) {
                scoreServiceVal = 100.0;
            } else if (result.localServiceCentersCount == 1) {
                scoreServiceVal = 80.0;
            }
            // Check if city is available at all
            String avCities = ev.getAvailableCities() != null ? ev.getAvailableCities().toLowerCase() : "";
            if (!avCities.contains(request.city.toLowerCase())) {
                scoreServiceVal = 0.0; // Not available/supported in this city
            }
            result.scoreService = Math.round(scoreServiceVal);

            // D. User Reviews (10%)
            double scoreReviewsVal = ev.getUserRating() != null ? (ev.getUserRating() / 5.0) * 100.0 : 80.0;
            result.scoreReviews = Math.round(scoreReviewsVal);

            // E. Charging Speed (10%)
            double scoreChargingVal = 50.0;
            if (ev.getChargingTimeMins() != null && ev.getChargingTimeMins() > 0) {
                // Lower charging time is better
                double expectedMinTime = ev.getVehicleType().equalsIgnoreCase("ELECTRIC_CAR") ? 120.0 : 180.0;
                double ratio = expectedMinTime / ev.getChargingTimeMins();
                scoreChargingVal = Math.min(100.0, ratio * 100.0);
            }
            if (ev.getFastCharging() != null && !ev.getFastCharging().equalsIgnoreCase("No")) {
                scoreChargingVal = Math.min(100.0, scoreChargingVal + 15.0);
            }
            result.scoreCharging = Math.round(scoreChargingVal);

            // F. Overall Value (10% + remaining)
            double scoreValueVal = 50.0;
            double safetyFactor = ev.getSafetyRating() != null ? (ev.getSafetyRating() / 5.0) * 50.0 : 35.0;
            double warrantyFactor = ev.getWarrantyYears() != null ? (ev.getWarrantyYears() / 8.0) * 50.0 : 35.0;
            scoreValueVal = Math.min(100.0, safetyFactor + warrantyFactor);
            result.scoreValue = Math.round(scoreValueVal);

            // 3. Compute weighted match score
            // Adjust weights if user selected priority
            double wBudget = 0.25;
            double wRange = 0.15;
            double wService = 0.15;
            double wReviews = 0.10;
            double wCharging = 0.10;
            double wValue = 0.15;

            if (request.priority != null && !request.priority.trim().isEmpty()) {
                String p = request.priority.trim().toLowerCase();
                if (p.contains("price") || p.contains("budget")) {
                    wBudget = 0.40; wRange = 0.12; wService = 0.12; wReviews = 0.08; wCharging = 0.08; wValue = 0.10;
                } else if (p.contains("range")) {
                    wRange = 0.35; wBudget = 0.20; wService = 0.12; wReviews = 0.08; wCharging = 0.08; wValue = 0.10;
                } else if (p.contains("charging")) {
                    wCharging = 0.30; wBudget = 0.20; wRange = 0.12; wService = 0.12; wReviews = 0.08; wValue = 0.10;
                } else if (p.contains("rating") || p.contains("reviews")) {
                    wReviews = 0.30; wBudget = 0.20; wRange = 0.12; wService = 0.12; wCharging = 0.08; wValue = 0.10;
                }
            }

            // Calculate overall score
            double totalScore = (result.scoreBudget * wBudget) + 
                                 (result.scoreRange * wRange) + 
                                 (result.scoreService * wService) + 
                                 (result.scoreReviews * wReviews) + 
                                 (result.scoreCharging * wCharging) + 
                                 (result.scoreValue * wValue);
            
            double sumWeights = wBudget + wRange + wService + wReviews + wCharging + wValue;
            double finalOverall = totalScore / sumWeights;
            
            // Penalize heavily if the company has zero support/availability in user selected city
            if (scoreServiceVal == 0.0) {
                finalOverall = finalOverall * 0.1; 
            }
            
            result.overallMatchScore = Math.round(finalOverall);

            // Generate explanations & considerations
            List<String> why = new ArrayList<>();
            List<String> consider = new ArrayList<>();

            if (ev.getMinPrice() <= request.budget) {
                why.add("Base price fits comfortably within your budget (starts at ₹" + String.format("%,.0f", ev.getMinPrice()) + " ex-showroom)");
            } else {
                consider.add("Minimum price exceeds your budget by ₹" + String.format("%,.0f", ev.getMinPrice() - request.budget));
            }

            if (scoreServiceVal > 0.0) {
                why.add("Available in " + request.city + " with direct brand support and service accessibility");
            } else {
                consider.add("Brand lacks localized service presence directly within " + request.city);
            }

            if (ev.getRangeKm() >= 300) {
                why.add("Long highway range of " + ev.getRangeKm() + " km on a single charge");
            } else if (ev.getRangeKm() >= 120) {
                why.add("Practical daily city driving range of " + ev.getRangeKm() + " km");
            } else {
                consider.add("Range of " + ev.getRangeKm() + " km is shorter; suitable primarily for close proximity city commutes");
            }

            if (ev.getUserRating() != null && ev.getUserRating() >= 4.4) {
                why.add("Highly rated by customers (" + ev.getUserRating() + "/5 stars) based on " + ev.getReviewsCount() + " reviews");
            }

            if (ev.getFastCharging() != null && !ev.getFastCharging().equalsIgnoreCase("No")) {
                why.add("Supports DC fast charging (" + ev.getFastCharging() + ") for quick battery top ups");
            }

            // Considerations
            if (ev.getNegativeFactors() != null && !ev.getNegativeFactors().trim().isEmpty()) {
                String[] negs = ev.getNegativeFactors().split(",");
                for (String neg : negs) {
                    if (consider.size() < 3) consider.add(neg.trim());
                }
            }

            result.explanation = why;
            result.thingsToConsider = consider;

            results.add(result);
        }

        // Sort by match score descending, filter out those with score < 15% (unsuitable), and limit to top 3
        List<RecommendationResult> top3 = results.stream()
                .filter(res -> res.overallMatchScore >= 15.0)
                .sorted((a, b) -> Double.compare(b.overallMatchScore, a.overallMatchScore))
                .limit(3)
                .collect(Collectors.toList());

        return ResponseEntity.ok(top3);
    }

    @GetMapping("/compare")
    public ResponseEntity<?> compareEvs(
            @RequestParam Long ev1,
            @RequestParam Long ev2,
            @RequestParam(required = false) Double budget,
            @RequestParam(required = false) String city) {

        Optional<EvModel> model1Opt = evRepository.findById(ev1);
        Optional<EvModel> model2Opt = evRepository.findById(ev2);

        if (model1Opt.isEmpty() || model2Opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "One or both EV Model IDs are invalid."));
        }

        EvModel m1 = model1Opt.get();
        EvModel m2 = model2Opt.get();

        String recommendedModelName = m1.getCompany() + " " + m1.getModel();
        List<String> reasons = new ArrayList<>();

        double score1 = 0;
        double score2 = 0;

        // Price comparison
        if (m1.getMinPrice() < m2.getMinPrice()) {
            score1 += 2;
            reasons.add(m1.getCompany() + " " + m1.getModel() + " starts at a lower price point (₹" + String.format("%,.0f", m1.getMinPrice()) + " vs ₹" + String.format("%,.0f", m2.getMinPrice()) + ")");
        } else if (m2.getMinPrice() < m1.getMinPrice()) {
            score2 += 2;
            reasons.add(m2.getCompany() + " " + m2.getModel() + " starts at a lower price point (₹" + String.format("%,.0f", m2.getMinPrice()) + " vs ₹" + String.format("%,.0f", m1.getMinPrice()) + ")");
        }

        // Range comparison
        if (m1.getRangeKm() > m2.getRangeKm()) {
            score1 += 2;
            reasons.add(m1.getCompany() + " " + m1.getModel() + " offers superior range (" + m1.getRangeKm() + " km vs " + m2.getRangeKm() + " km)");
        } else if (m2.getRangeKm() > m1.getRangeKm()) {
            score2 += 2;
            reasons.add(m2.getCompany() + " " + m2.getModel() + " offers superior range (" + m2.getRangeKm() + " km vs " + m1.getRangeKm() + " km)");
        }

        // Top Speed comparison
        Integer ts1 = m1.getTopSpeedKmh() != null ? m1.getTopSpeedKmh() : 0;
        Integer ts2 = m2.getTopSpeedKmh() != null ? m2.getTopSpeedKmh() : 0;
        if (ts1 > ts2) {
            score1 += 1.5;
            reasons.add(m1.getCompany() + " " + m1.getModel() + " provides a higher top speed of " + ts1 + " km/h");
        } else if (ts2 > ts1) {
            score2 += 1.5;
            reasons.add(m2.getCompany() + " " + m2.getModel() + " provides a higher top speed of " + ts2 + " km/h");
        }

        // Ratings comparison
        if (m1.getUserRating() > m2.getUserRating()) {
            score1 += 1.5;
            reasons.add(m1.getCompany() + " " + m1.getModel() + " holds stronger customer satisfaction ratings (" + m1.getUserRating() + "★ vs " + m2.getUserRating() + "★)");
        } else if (m2.getUserRating() > m1.getUserRating()) {
            score2 += 1.5;
            reasons.add(m2.getCompany() + " " + m2.getModel() + " holds stronger customer satisfaction ratings (" + m2.getUserRating() + "★ vs " + m1.getUserRating() + "★)");
        }

        // Service check
        if (city != null && !city.trim().isEmpty()) {
            int count1 = serviceCenterRepository.findByCityIgnoreCaseAndBrandIgnoreCase(city, m1.getCompany()).size();
            int count2 = serviceCenterRepository.findByCityIgnoreCaseAndBrandIgnoreCase(city, m2.getCompany()).size();
            if (count1 > count2) {
                score1 += 2;
                reasons.add(m1.getCompany() + " has better local brand service coverage in " + city + " (" + count1 + " vs " + count2 + " center(s))");
            } else if (count2 > count1) {
                score2 += 2;
                reasons.add(m2.getCompany() + " has better local brand service coverage in " + city + " (" + count2 + " vs " + count1 + " center(s))");
            }
        }

        // Determine recommended
        Long recommendedId = m1.getId();
        if (score2 > score1) {
            recommendedModelName = m2.getCompany() + " " + m2.getModel();
            recommendedId = m2.getId();
        }
        if (reasons.isEmpty()) {
            reasons.add("Both models present similar technical metrics and ex-showroom value.");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("ev1", m1);
        response.put("ev2", m2);
        response.put("recommendedEvId", recommendedId);
        response.put("recommendedEvName", recommendedModelName);
        response.put("comparisonScoreEv1", score1);
        response.put("comparisonScoreEv2", score2);
        response.put("reasons", reasons);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dealers")
    public ResponseEntity<List<EvDealer>> getDealers(
            @RequestParam String city,
            @RequestParam(required = false) String brand) {
        if (brand != null && !brand.trim().isEmpty()) {
            return ResponseEntity.ok(dealerRepository.findByCityIgnoreCaseAndBrandIgnoreCase(city, brand));
        }
        return ResponseEntity.ok(dealerRepository.findByCityIgnoreCase(city));
    }

    @GetMapping("/service-centers")
    public ResponseEntity<List<EvServiceCenter>> getServiceCenters(
            @RequestParam String city,
            @RequestParam(required = false) String brand) {
        if (brand != null && !brand.trim().isEmpty()) {
            return ResponseEntity.ok(serviceCenterRepository.findByCityIgnoreCaseAndBrandIgnoreCase(city, brand));
        }
        return ResponseEntity.ok(serviceCenterRepository.findByCityIgnoreCase(city));
    }
}

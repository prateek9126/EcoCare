package com.example.evbatteryhealth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class EvBatteryHealthApplication {
    public static void main(String[] args) {
        SpringApplication.run(EvBatteryHealthApplication.class, args);
    }
}

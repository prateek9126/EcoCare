package com.example.evbatteryhealth.repository;

import com.example.evbatteryhealth.model.PassportLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PassportLinkRepository extends JpaRepository<PassportLink, Long> {
    Optional<PassportLink> findByPhoneNumber(String phoneNumber);
}

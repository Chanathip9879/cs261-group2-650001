package com.example.demo.repository;

import com.example.demo.entity.OwnerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OwnerRepository extends JpaRepository<OwnerEntity, Long> {
    Optional<OwnerEntity> findByPhone(String phone);
    boolean existsByPhone(String phone);
    Optional<OwnerEntity> findByRestaurantId(Long restaurantId);
}

package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "owners")
public class OwnerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String phone;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public OwnerEntity() {
    }

    public OwnerEntity(String phone, String pinHash, Long restaurantId) {
        this.phone = phone;
        this.pinHash = pinHash;
        this.restaurantId = restaurantId;
    }

    public Long getId() {
        return id;
    }

    public String getPhone() {
        return phone;
    }

    public String getPinHash() {
        return pinHash;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setPinHash(String pinHash) {
        this.pinHash = pinHash;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }
}

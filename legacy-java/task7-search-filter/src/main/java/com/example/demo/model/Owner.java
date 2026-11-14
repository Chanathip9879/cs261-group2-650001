package com.example.demo.model;

// บัญชีเจ้าของร้านอาหาร (Task15/16: U4)
// เก็บ PIN เป็น hash เท่านั้น ห้ามเก็บ PIN ตรงๆ
public class Owner {

    private final Long id;
    private final String phone;
    private final String pinHash;
    private final Long restaurantId;

    public Owner(Long id, String phone, String pinHash, Long restaurantId) {
        this.id = id;
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

    // ร้านที่เจ้าของคนนี้จัดการได้ (ใช้ตรวจสิทธิ์ใน U5)
    public Long getRestaurantId() {
        return restaurantId;
    }
}

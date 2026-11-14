
package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "restaurants")
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "is_open", nullable = false)
    private boolean isOpen = false;

    public Restaurant() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public boolean isOpen() {
        return isOpen;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setOpen(boolean open) {
        isOpen = open;
    }
}
// วิธีที่ 1: รัน Spring Boot จาก IDE (แนะนำ)
// ถ้าคุณใช้ Spring Tool Suite (STS), Eclipse หรือ IntelliJ อยู่แล้ว ให้ทำตามนี้

// เพิ่มไฟล์ Restaurant.java, RestaurantRepository.java, RestaurantService.java และ RestaurantController.java ตามโค้ดก่อนหน้า

// เพิ่ม dependency JPA และ MySQL Driver ใน pom.xml

// ตั้งค่า application.properties ให้เชื่อมต่อกับ MySQL ที่ติดตั้งในเครื่อง

// สร้างฐานข้อมูลใน MySQL:


// sql
// CREATE DATABASE restaurant_db;
// รัน DemoApplication.java ด้วยคำสั่ง Run As → Spring Boot App หรือ Run Java Application ตาม IDE ที่ใช้

// เพิ่มข้อมูลทดสอบ:


// sql
// USE restaurant_db;

// INSERT INTO restaurants (name, is_open)
// VALUES ('My Restaurant', TRUE);
// เมื่อแอปเริ่มทำงานและสร้างตารางสำเร็จแล้ว ให้เรียก API:


// http
// GET http://localhost:8080/api/restaurants/1/status
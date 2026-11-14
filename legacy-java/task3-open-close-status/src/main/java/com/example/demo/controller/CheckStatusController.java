
package com.example.demo.controller;

import com.example.demo.model.CheckStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/check-status")
@CrossOrigin(origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
})

public class CheckStatusController {

    private final Map<Long, CheckStatus> restaurants = new HashMap<>();

    public CheckStatusController() {
        restaurants.put(1L,
            new CheckStatus(1L, "ร้านอาหาร A", true, false));

        restaurants.put(2L,
            new CheckStatus(2L, "ร้านอาหาร B", false, false));

        restaurants.put(3L,
            new CheckStatus(3L, "ร้านอาหาร C", true, true));
    }

    // GET: /api/check-status/1
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> checkStatus(
            @PathVariable Long id) {

        if (id == null || id <= 0) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Restaurant ID ต้องมากกว่า 0")
            );
        }

        CheckStatus restaurant = restaurants.get(id);

        if (restaurant == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                Map.of("message", "ไม่พบร้านอาหาร")
            );
        }

        String status = restaurant.checkStatus();

        Map<String, Object> response = new HashMap<>();
        response.put("restaurantId", restaurant.getId());
        response.put("restaurantName", restaurant.getName());
        response.put("status", status);
        response.put("isAvailable", restaurant.isAvailable());

        switch (status) {
            case "Open" ->
                response.put("message", "ร้านพร้อมให้บริการ");
            case "Closed" ->
                response.put("message", "ร้านปิดให้บริการ");
            case "TemporarilyClosed" ->
                response.put("message", "ร้านปิดชั่วคราว");
            default ->
                response.put("message", "ไม่ทราบสถานะร้าน");
        }

        return ResponseEntity.ok(response);
    }
}

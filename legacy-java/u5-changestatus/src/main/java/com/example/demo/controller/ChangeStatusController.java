
package com.example.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/restaurants")
@CrossOrigin(origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
})
public class ChangeStatusController {

    private final Map<Long, String> statuses =
            new ConcurrentHashMap<>();

    // GET: ตรวจสอบสถานะร้าน
    @GetMapping("/{id}/status")
    public Map<String, String> getStatus(
            @PathVariable Long id) {

        String status = statuses.getOrDefault(id, "CLOSED");

        return Map.of(
                "restaurantId", id.toString(),
                "status", status
        );
    }

    // PATCH: เปลี่ยนสถานะร้าน
    @PatchMapping("/{id}/status")
    public Map<String, String> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        if (id <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid restaurant ID"
            );
        }

        String status = request.get("status");

        if (status == null ||
                !Set.of("OPEN", "CLOSED", "BUSY").contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid status"
            );
        }

        statuses.put(id, status);

        return Map.of(
                "restaurantId", id.toString(),
                "status", status
        );
    }
}

package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/restaurants")
public class ChangeStatusController {

    private final Map<Long, String> statuses =
            new ConcurrentHashMap<>();

    @PatchMapping("/{id}/status")
    public Map<String, String> changeStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");

        if (status == null ||
                !java.util.Set.of("OPEN", "CLOSED", "BUSY")
                        .contains(status)) {
            throw new org.springframework.web.server
                    .ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Invalid status");
        }

        statuses.put(id, status);

        return Map.of(
                "restaurantId", id.toString(),
                "status", status
        );
    }
}
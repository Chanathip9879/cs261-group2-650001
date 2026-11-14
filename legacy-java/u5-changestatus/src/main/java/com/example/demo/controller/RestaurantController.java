
package com.example.demo.controller;

import com.example.demo.entity.Restaurant;
import com.example.demo.service.RestaurantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(
            RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<?> getRestaurantStatus(
            @PathVariable Long id) {

        return restaurantService.getRestaurantById(id)
                .<ResponseEntity<?>>map(restaurant -> {
                    Map<String, Object> response = Map.of(
                            "id", restaurant.getId(),
                            "name", restaurant.getName(),
                            "is_open", restaurant.isOpen()
                    );

                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "message", "Restaurant not found"
                        )));
    }
}

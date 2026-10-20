package com.example.demo.controller;

import com.example.demo.dto.RestaurantSearchDto;
import com.example.demo.service.RestaurantSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/restaurants")
@CrossOrigin(origins = "*")
public class RestaurantSearchController {

    private final RestaurantSearchService searchService;

    public RestaurantSearchController(RestaurantSearchService searchService) {
        this.searchService = searchService;
    }

    /**
     * ค้นหาร้านอาหารตามชื่อร้าน, ชื่อเมนู, โรงอาหาร (กรีนแคนทีน/คณะวิทย์) และหมวดหมู่อาหาร
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchRestaurants(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "canteen", required = false) String canteen,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "status", required = false) String status) {

        List<RestaurantSearchDto> results = searchService.search(query, canteen, category, status);

        return ResponseEntity.ok(Map.of(
                "total", results.size(),
                "query", query != null ? query : "",
                "canteenFilter", canteen != null ? canteen : "ALL",
                "categoryFilter", category != null ? category : "ALL",
                "data", results
        ));
    }
}

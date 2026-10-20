package com.example.demo.dto;

import java.util.List;

public record RestaurantSearchDto(
        Long id,
        String name,
        String canteenCode,
        String canteenNameTh,
        String stallNumber,
        boolean isOpen,
        String openTime,
        String closeTime,
        double rating,
        int reviewCount,
        List<String> categories,
        List<ProductSummaryDto> products
) {
    public record ProductSummaryDto(
            Long id,
            String name,
            double price,
            boolean isSoldOut
    ) {}
}

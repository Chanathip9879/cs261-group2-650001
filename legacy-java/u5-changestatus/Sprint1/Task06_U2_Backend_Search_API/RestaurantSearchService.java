package com.example.demo.service;

import com.example.demo.dto.RestaurantSearchDto;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RestaurantSearchService {

    // ตัวอย่าง Mock Database จำลองข้อมูล 2 โรงอาหารหลักของ มธ.รังสิต
    private final List<RestaurantSearchDto> mockDatabase = new ArrayList<>();

    public RestaurantSearchService() {
        seedSampleData();
    }

    private void seedSampleData() {
        mockDatabase.add(new RestaurantSearchDto(
                1L,
                "ร้านป้าศรี ข้าวแกงปักษ์ใต้",
                "GREEN_CANTEEN",
                "โรงอาหารกรีนแคนทีน",
                "ล็อค 3",
                true,
                "07:00",
                "15:30",
                4.8,
                38,
                List.of("ข้าวแกง", "อาหารปักษ์ใต้"),
                List.of(
                        new RestaurantSearchDto.ProductSummaryDto(101L, "ข้าวราดแกงไตปลา", 45.0, false),
                        new RestaurantSearchDto.ProductSummaryDto(102L, "คั่วกลิ้งหมู", 40.0, true) // เมนูหมด
                )
        ));

        mockDatabase.add(new RestaurantSearchDto(
                2L,
                "ก๋วยเตี๋ยวเรืออยุธยา ลุงหนุ่ม",
                "GREEN_CANTEEN",
                "โรงอาหารกรีนแคนทีน",
                "ล็อค 7",
                true,
                "08:30",
                "16:00",
                4.6,
                52,
                List.of("ก๋วยเตี๋ยว / บะหมี่"),
                List.of(
                        new RestaurantSearchDto.ProductSummaryDto(201L, "ก๋วยเตี๋ยวเรือหมูน้ำตก", 45.0, false),
                        new RestaurantSearchDto.ProductSummaryDto(202L, "กากหมูเจียว", 15.0, true) // เมนูหมด
                )
        ));

        mockDatabase.add(new RestaurantSearchDto(
                3L,
                "ชาพะยอม & กาแฟโบราณ",
                "GREEN_CANTEEN",
                "โรงอาหารกรีนแคนทีน",
                "ล็อค 12",
                true,
                "07:30",
                "17:00",
                4.7,
                24,
                List.of("เครื่องดื่ม / ชา กาแฟ"),
                List.of(
                        new RestaurantSearchDto.ProductSummaryDto(301L, "ชาเย็นโบราณ", 30.0, false),
                        new RestaurantSearchDto.ProductSummaryDto(302L, "โกโก้เข้มข้น", 35.0, false)
                )
        ));

        mockDatabase.add(new RestaurantSearchDto(
                4L,
                "ครัววิทย์ อาหารตามสั่ง",
                "SCIENCE_FACULTY",
                "โรงอาหารคณะวิทยาศาสตร์",
                "ห้อง SC1",
                true,
                "08:00",
                "16:30",
                4.5,
                45,
                List.of("อาหารตามสั่ง"),
                List.of(
                        new RestaurantSearchDto.ProductSummaryDto(401L, "กะเพราหมูกรอบไข่ดาว", 55.0, false),
                        new RestaurantSearchDto.ProductSummaryDto(402L, "ข้าวผัดพริกแกงไก่", 45.0, false)
                )
        ));

        mockDatabase.add(new RestaurantSearchDto(
                5L,
                "ข้าวมันไก่ตอน สูตรเบตง",
                "SCIENCE_FACULTY",
                "โรงอาหารคณะวิทยาศาสตร์",
                "ห้อง SC4",
                false, // ร้านปิด
                "07:30",
                "14:30",
                4.4,
                19,
                List.of("ข้าวมันไก่ / ข้าวหมูกรอบ"),
                List.of(
                        new RestaurantSearchDto.ProductSummaryDto(501L, "ข้าวมันไก่ตอนต้ม", 45.0, false),
                        new RestaurantSearchDto.ProductSummaryDto(502L, "ข้าวมันไก่ทอด", 45.0, true)
                )
        ));
    }

    public List<RestaurantSearchDto> search(String query, String canteen, String category, String status) {
        return mockDatabase.stream()
                .filter(r -> {
                    // กรองโรงอาหาร
                    if (canteen != null && !canteen.equalsIgnoreCase("ALL")) {
                        if (!r.canteenCode().equalsIgnoreCase(canteen)) {
                            return false;
                        }
                    }
                    // กรองสถานะ เปิด/ปิด
                    if (status != null && !status.equalsIgnoreCase("ALL")) {
                        if (status.equalsIgnoreCase("OPEN") && !r.isOpen()) return false;
                        if (status.equalsIgnoreCase("CLOSED") && r.isOpen()) return false;
                    }
                    // กรองหมวดหมู่
                    if (category != null && !category.equalsIgnoreCase("ALL")) {
                        boolean matchCategory = r.categories().stream()
                                .anyMatch(c -> c.toLowerCase().contains(category.toLowerCase()));
                        if (!matchCategory) return false;
                    }
                    // กรองข้อความค้นหา (ชื่อร้าน หรือ ชื่ออาหาร)
                    if (query != null && !query.trim().isEmpty()) {
                        String q = query.trim().toLowerCase();
                        boolean matchName = r.name().toLowerCase().contains(q);
                        boolean matchProduct = r.products().stream()
                                .anyMatch(p -> p.name().toLowerCase().contains(q));
                        return matchName || matchProduct;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }
}

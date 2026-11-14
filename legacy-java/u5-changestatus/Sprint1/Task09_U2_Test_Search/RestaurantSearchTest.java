package com.example.demo.controller;

import com.example.demo.service.RestaurantSearchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RestaurantSearchTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        RestaurantSearchService searchService = new RestaurantSearchService();
        RestaurantSearchController controller = new RestaurantSearchController(searchService);
        this.mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("TC-U2-01: ค้นหาร้านจากชื่อร้านสำเร็จ")
    void testSearchByRestaurantName() throws Exception {
        mockMvc.perform(get("/api/restaurants/search")
                        .param("q", "ป้าศรี")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].name", containsString("ป้าศรี")));
    }

    @Test
    @DisplayName("TC-U2-02: ค้นหาจากชื่อเมนูอาหารสำเร็จ")
    void testSearchByProductName() throws Exception {
        mockMvc.perform(get("/api/restaurants/search")
                        .param("q", "กะเพรา")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data[0].name", containsString("ครัววิทย์")));
    }

    @Test
    @DisplayName("TC-U2-03: กรองร้านเฉพาะในโรงอาหารกรีนแคนทีน")
    void testFilterByGreenCanteen() throws Exception {
        mockMvc.perform(get("/api/restaurants/search")
                        .param("canteen", "GREEN_CANTEEN")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].canteenCode", everyItem(is("GREEN_CANTEEN"))));
    }

    @Test
    @DisplayName("TC-U2-04: กรองร้านเฉพาะในโรงอาหารคณะวิทยาศาสตร์")
    void testFilterByScienceFaculty() throws Exception {
        mockMvc.perform(get("/api/restaurants/search")
                        .param("canteen", "SCIENCE_FACULTY")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].canteenCode", everyItem(is("SCIENCE_FACULTY"))));
    }

    @Test
    @DisplayName("TC-U2-05: กรองเฉพาะร้านที่เปิดให้บริการ (is_open = true)")
    void testFilterByOpenStatus() throws Exception {
        mockMvc.perform(get("/api/restaurants/search")
                        .param("status", "OPEN")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].isOpen", everyItem(is(true))));
    }

    @Test
    @DisplayName("TC-U2-07: ค้นหาคำที่ไม่พบในระบบ คืนค่ารายการว่าง (total: 0)")
    void testSearchNotFound() throws Exception {
        mockMvc.perform(get("/api/restaurants/search")
                        .param("q", "อาหารที่ไม่มีในโลก9999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(0)))
                .andExpect(jsonPath("$.data", empty()));
    }
}

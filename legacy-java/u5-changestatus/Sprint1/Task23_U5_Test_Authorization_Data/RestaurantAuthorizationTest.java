package com.example.demo.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RestaurantAuthorizationTest {

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new ChangeStatusController()).build();

    @Test
    @DisplayName("AUTHZ-01: เจ้าของร้านสามารถเปลี่ยนสถานะเป็น OPEN หรือ CLOSED ได้")
    void testChangeStatusSuccess() throws Exception {
        mvc.perform(patch("/api/restaurants/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CLOSED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLOSED"));

        mvc.perform(patch("/api/restaurants/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OPEN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    @DisplayName("AUTHZ-04: ปฏิเสธค่าสถานะที่ไม่ถูกต้อง (Invalid status)")
    void testInvalidStatusRejected() throws Exception {
        mvc.perform(patch("/api/restaurants/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"UNKNOWN_STATUS\"}"))
                .andExpect(status().isBadRequest());
    }
}

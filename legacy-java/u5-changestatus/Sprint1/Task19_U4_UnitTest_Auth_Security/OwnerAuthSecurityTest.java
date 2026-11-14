package com.example.demo.controller;

import com.example.demo.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OwnerAuthSecurityTest {

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        AuthService authService = new AuthService();
        AuthController authController = new AuthController(authService);
        this.mvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    private String loginPayload(String phone, String pin) {
        return "{\"phone\":\"" + phone + "\",\"pin\":\"" + pin + "\"}";
    }

    @Test
    @DisplayName("SEC-01: ล็อกอินสำเร็จด้วยเบอร์และ PIN ที่ถูกต้อง รับ Token สิทธิ์ OWNER")
    void testLoginSuccess() throws Exception {
        MvcResult res = mvc.perform(post("/api/auth/owner/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload("0812345678", "1234")))
                .andExpect(status().isOk())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        assertTrue(body.contains("\"token\""), "Response should contain session token");
        assertTrue(body.contains("\"role\":\"OWNER\""), "User should be assigned OWNER role");
    }

    @Test
    @DisplayName("SEC-02: ป้องกัน Brute Force - ใส่ PIN ผิดครบ 5 ครั้ง บัญชีจะถูกล็อกและส่ง Retry-After")
    void testBruteForceLockout() throws Exception {
        String testPhone = "0812345678";
        // ใส่รหัสผิด 4 ครั้งแรก -> 401
        for (int i = 0; i < 4; i++) {
            mvc.perform(post("/api/auth/owner/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(loginPayload(testPhone, "9999")))
                    .andExpect(status().isUnauthorized());
        }

        // ครั้งที่ 5 -> โดนล็อก ส่ง HTTP 429 พร้อม Retry-After header
        mvc.perform(post("/api/auth/owner/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(testPhone, "9999")))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));

        // พยายามใส่รหัสที่ถูกในขณะที่ยังถูกล็อก -> ยังคงต้องติดสถานะ Too Many Requests
        mvc.perform(post("/api/auth/owner/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(testPhone, "1234")))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("SEC-03: ป้องกัน Account Enumeration - เบอร์ไม่มีในระบบส่งรหัส Error เดียวกับ PIN ผิด")
    void testAccountEnumerationDefense() throws Exception {
        MvcResult wrongPhoneRes = mvc.perform(post("/api/auth/owner/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload("0899999999", "1234")))
                .andExpect(status().isUnauthorized())
                .andReturn();

        MvcResult wrongPinRes = mvc.perform(post("/api/auth/owner/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload("0812345678", "0000")))
                .andExpect(status().isUnauthorized())
                .andReturn();

        // ทั้งสองเคสต้องตอบกลับเหมือนกัน เพื่อไม่เปิดเผยว่าเบอร์ใดมีอยู่ในฐานข้อมูล
        assertFalse(wrongPhoneRes.getResponse().getContentAsString().contains("ไม่พบเบอร์"));
    }

    @Test
    @DisplayName("SEC-04: ตรวจสอบ Route Guard /api/auth/me ต้องมี Token ที่ถูกต้อง")
    void testMeEndpointProtection() throws Exception {
        // ไม่มี Header -> 401
        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        // ส่ง Fake Token -> 401
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer fake-token-12345"))
                .andExpect(status().isUnauthorized());
    }
}

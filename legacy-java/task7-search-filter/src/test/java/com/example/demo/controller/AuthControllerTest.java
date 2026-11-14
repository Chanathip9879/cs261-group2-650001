package com.example.demo.controller;

import com.example.demo.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new AuthController(new AuthService())).build();
    }

    private String loginJson(String phone, String pin) {
        return "{\"phone\":\"" + phone + "\",\"pin\":\"" + pin + "\"}";
    }

    private org.springframework.test.web.servlet.ResultActions login(String phone, String pin) throws Exception {
        return mvc.perform(post("/api/auth/owner/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(phone, pin)));
    }

    @Test
    void loginSuccessReturns200WithToken() throws Exception {
        MvcResult r = login("0812345678", "1234").andExpect(status().isOk()).andReturn();
        String body = r.getResponse().getContentAsString();
        assertTrue(body.contains("\"token\""), body);
        assertTrue(body.contains("OWNER"), body);
    }

    @Test
    void wrongPinReturns401() throws Exception {
        login("0812345678", "0000").andExpect(status().isUnauthorized());
    }

    @Test
    void badFormatReturns400() throws Exception {
        login("0812345678", "12").andExpect(status().isBadRequest());
    }

    @Test
    void fiveWrongAttemptsReturn429WithRetryAfter() throws Exception {
        for (int i = 0; i < 4; i++) {
            login("0812345678", "0000").andExpect(status().isUnauthorized());
        }
        login("0812345678", "0000")
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
        login("0812345678", "1234").andExpect(status().isTooManyRequests());
    }

    @Test
    void meRequiresValidToken() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer fake"))
                .andExpect(status().isUnauthorized());

        String body = login("0812345678", "1234").andReturn().getResponse().getContentAsString();
        Matcher m = Pattern.compile("\"token\":\"([^\"]+)\"").matcher(body);
        assertTrue(m.find(), body);
        String token = m.group(1);

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }
}

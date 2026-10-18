package com.example.demo.controller;

import com.example.demo.model.Owner;
import com.example.demo.service.AuthService;
import com.example.demo.service.AuthService.LoginResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    public record OwnerLoginRequest(String phone, String pin) {
    }

    // POST: /api/auth/owner/login  body: {"phone":"0812345678","pin":"1234"}
    @PostMapping("/owner/login")
    public ResponseEntity<Map<String, Object>> ownerLogin(@RequestBody OwnerLoginRequest request) {
        LoginResult result = authService.login(request.phone(), request.pin());

        switch (result.status()) {
            case INVALID_INPUT:
                return ResponseEntity.badRequest().body(
                        Map.of("message", "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก และ PIN ต้องเป็นตัวเลข 4-6 หลัก"));
            case LOCKED:
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .header(HttpHeaders.RETRY_AFTER, String.valueOf(result.retryAfterSeconds()))
                        .body(Map.of(
                                "message", "กรอก PIN ผิดหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง",
                                "retryAfterSeconds", result.retryAfterSeconds()));
            case INVALID_CREDENTIALS:
                // ข้อความเดียวกันไม่ว่าเบอร์หรือ PIN ผิด เพื่อไม่บอกว่ามีเบอร์นี้ในระบบ
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        Map.of("message", "เบอร์โทรศัพท์หรือ PIN ไม่ถูกต้อง"));
            default:
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("token", result.token());
                body.put("tokenType", "Bearer");
                body.put("role", "OWNER");
                body.put("ownerId", result.owner().getId());
                body.put("restaurantId", result.owner().getRestaurantId());
                body.put("expiresInSeconds", AuthService.TOKEN_LIFETIME.toSeconds());
                return ResponseEntity.ok(body);
        }
    }

    // GET: /api/auth/me  header: Authorization: Bearer <token>
    // Frontend ใช้เช็กว่า token ยังใช้ได้ไหม (Route guard ของ Task18)
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        Optional<Owner> owner = authService.authenticateHeader(authorization);
        if (owner.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("message", "ยังไม่ได้เข้าสู่ระบบหรือ token หมดอายุ"));
        }
        return ResponseEntity.ok(Map.of(
                "role", "OWNER",
                "ownerId", owner.get().getId(),
                "restaurantId", owner.get().getRestaurantId()));
    }

    // POST: /api/auth/logout
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            authService.logout(authorization.substring("Bearer ".length()).trim());
        }
        return ResponseEntity.noContent().build();
    }
}

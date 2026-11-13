package com.example.demo.service;

import com.example.demo.model.Owner;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

// ระบบ Login เจ้าของร้าน (U4): เบอร์โทรศัพท์ + PIN 4-6 หลัก
// ตอนนี้ข้อมูลอยู่ในหน่วยความจำ เหมือน CheckStatusController
// เมื่อมีฐานข้อมูลจริง (Task15) ให้เปลี่ยน findOwnerByPhone ไปอ่านจากตาราง owners
@Service
public class AuthService {

    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final Duration LOCK_DURATION = Duration.ofMinutes(5);
    public static final Duration TOKEN_LIFETIME = Duration.ofHours(8);

    private static final Pattern PHONE_PATTERN = Pattern.compile("^0\\d{9}$");
    private static final Pattern PIN_PATTERN = Pattern.compile("^\\d{4,6}$");

    public enum Status { SUCCESS, INVALID_INPUT, INVALID_CREDENTIALS, LOCKED }

    public record LoginResult(Status status, String token, Owner owner, long retryAfterSeconds) {
        static LoginResult of(Status status) {
            return new LoginResult(status, null, null, 0);
        }
    }

    private record Session(Owner owner, Instant expiresAt) {
    }

    private static class Attempts {
        int failed;
        Instant lockedUntil;
    }

    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Owner> ownersByPhone = new HashMap<>();
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final Map<String, Attempts> attemptsByPhone = new HashMap<>();
    // ใช้เทียบ PIN ปลอมเมื่อไม่พบเบอร์ เพื่อให้เวลาตอบใกล้เคียงกับกรณีเบอร์ถูก
    private final String dummyHash = PinHasher.hash("0000");

    public AuthService() {
        this(Clock.systemUTC());
    }

    public AuthService(Clock clock) {
        this.clock = clock;
        seedOwners();
    }

    // บัญชีทดสอบ ลบหรือย้ายไปฐานข้อมูลเมื่อพร้อม
    private void seedOwners() {
        List<Owner> owners = List.of(
                new Owner(1L, "0812345678", PinHasher.hash("1234"), 1L),
                new Owner(2L, "0898765432", PinHasher.hash("567890"), 2L));
        for (Owner owner : owners) {
            ownersByPhone.put(owner.getPhone(), owner);
        }
    }

    private Optional<Owner> findOwnerByPhone(String phone) {
        return Optional.ofNullable(ownersByPhone.get(phone));
    }

    public synchronized LoginResult login(String phone, String pin) {
        if (phone == null || pin == null
                || !PHONE_PATTERN.matcher(phone).matches()
                || !PIN_PATTERN.matcher(pin).matches()) {
            return LoginResult.of(Status.INVALID_INPUT);
        }

        Instant now = clock.instant();
        Attempts attempts = attemptsByPhone.computeIfAbsent(phone, p -> new Attempts());

        if (attempts.lockedUntil != null) {
            if (now.isBefore(attempts.lockedUntil)) {
                long wait = Duration.between(now, attempts.lockedUntil).toSeconds() + 1;
                return new LoginResult(Status.LOCKED, null, null, wait);
            }
            // หมดเวลาล็อกแล้ว เริ่มนับใหม่
            attempts.lockedUntil = null;
            attempts.failed = 0;
        }

        Optional<Owner> owner = findOwnerByPhone(phone);
        String hashToCheck = owner.map(Owner::getPinHash).orElse(dummyHash);
        boolean pinOk = PinHasher.matches(pin, hashToCheck);

        if (owner.isEmpty() || !pinOk) {
            attempts.failed++;
            if (attempts.failed >= MAX_FAILED_ATTEMPTS) {
                attempts.lockedUntil = now.plus(LOCK_DURATION);
                return new LoginResult(Status.LOCKED, null, null, LOCK_DURATION.toSeconds());
            }
            return LoginResult.of(Status.INVALID_CREDENTIALS);
        }

        attemptsByPhone.remove(phone);
        String token = newToken();
        sessions.put(token, new Session(owner.get(), now.plus(TOKEN_LIFETIME)));
        return new LoginResult(Status.SUCCESS, token, owner.get(), 0);
    }

    // ตรวจ token ว่ายังใช้ได้ไหม (ใช้ใน U5 เพื่อเช็กว่าเป็นเจ้าของร้านจริง)
    public Optional<Owner> authenticate(String token) {
        if (token == null) {
            return Optional.empty();
        }
        Session session = sessions.get(token);
        if (session == null) {
            return Optional.empty();
        }
        if (!clock.instant().isBefore(session.expiresAt())) {
            sessions.remove(token);
            return Optional.empty();
        }
        return Optional.of(session.owner());
    }

    // รับค่า header "Authorization: Bearer <token>"
    public Optional<Owner> authenticateHeader(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        }
        return authenticate(authorizationHeader.substring("Bearer ".length()).trim());
    }

    public void logout(String token) {
        if (token != null) {
            sessions.remove(token);
        }
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

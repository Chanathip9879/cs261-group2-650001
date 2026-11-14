package com.example.demo.service;

import com.example.demo.model.Owner;
import com.example.demo.service.AuthService.LoginResult;
import com.example.demo.service.AuthService.Status;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {

    // นาฬิกาปลอมที่เลื่อนเวลาได้ ใช้ทดสอบการล็อกและ token หมดอายุ
    static class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-10-18T00:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    private MutableClock clock;
    private AuthService auth;

    @BeforeEach
    void setUp() {
        clock = new MutableClock();
        auth = new AuthService(clock);
    }

    @Test
    void loginSuccessReturnsTokenAndOwner() {
        LoginResult r = auth.login("0812345678", "1234");
        assertEquals(Status.SUCCESS, r.status());
        assertNotNull(r.token());
        assertEquals(1L, r.owner().getRestaurantId());
    }

    @Test
    void wrongPinIsRejected() {
        assertEquals(Status.INVALID_CREDENTIALS, auth.login("0812345678", "9999").status());
    }

    @Test
    void unknownPhoneGivesSameResultAsWrongPin() {
        assertEquals(Status.INVALID_CREDENTIALS, auth.login("0800000000", "1234").status());
    }

    @Test
    void badFormatIsRejectedBeforeCheckingCredentials() {
        assertEquals(Status.INVALID_INPUT, auth.login("123", "1234").status());
        assertEquals(Status.INVALID_INPUT, auth.login("0812345678", "12").status());
        assertEquals(Status.INVALID_INPUT, auth.login("0812345678", "1234567").status());
        assertEquals(Status.INVALID_INPUT, auth.login("0812345678", "12ab").status());
        assertEquals(Status.INVALID_INPUT, auth.login(null, "1234").status());
        assertEquals(Status.INVALID_INPUT, auth.login("0812345678", null).status());
    }

    @Test
    void sixDigitPinWorks() {
        assertEquals(Status.SUCCESS, auth.login("0898765432", "567890").status());
    }

    @Test
    void lockedAfterFiveWrongAttemptsEvenWithCorrectPin() {
        for (int i = 0; i < 4; i++) {
            assertEquals(Status.INVALID_CREDENTIALS, auth.login("0812345678", "0000").status());
        }
        assertEquals(Status.LOCKED, auth.login("0812345678", "0000").status());

        LoginResult locked = auth.login("0812345678", "1234");
        assertEquals(Status.LOCKED, locked.status());
        assertTrue(locked.retryAfterSeconds() > 0);
    }

    @Test
    void lockExpiresAfterFiveMinutes() {
        for (int i = 0; i < 5; i++) {
            auth.login("0812345678", "0000");
        }
        clock.advance(Duration.ofMinutes(5).plusSeconds(1));
        assertEquals(Status.SUCCESS, auth.login("0812345678", "1234").status());
    }

    @Test
    void successfulLoginResetsFailedCounter() {
        for (int i = 0; i < 4; i++) {
            auth.login("0812345678", "0000");
        }
        assertEquals(Status.SUCCESS, auth.login("0812345678", "1234").status());
        for (int i = 0; i < 4; i++) {
            assertEquals(Status.INVALID_CREDENTIALS, auth.login("0812345678", "0000").status());
        }
    }

    @Test
    void lockIsPerPhoneNumber() {
        for (int i = 0; i < 5; i++) {
            auth.login("0812345678", "0000");
        }
        assertEquals(Status.SUCCESS, auth.login("0898765432", "567890").status());
    }

    @Test
    void tokenAuthenticatesUntilLogoutOrExpiry() {
        String token = auth.login("0812345678", "1234").token();
        Optional<Owner> owner = auth.authenticate(token);
        assertTrue(owner.isPresent());
        assertEquals(1L, owner.get().getRestaurantId());

        auth.logout(token);
        assertTrue(auth.authenticate(token).isEmpty());
    }

    @Test
    void tokenExpires() {
        String token = auth.login("0812345678", "1234").token();
        clock.advance(AuthService.TOKEN_LIFETIME.plusSeconds(1));
        assertTrue(auth.authenticate(token).isEmpty());
    }

    @Test
    void fakeOrMissingTokenIsRejected() {
        assertTrue(auth.authenticate("not-a-real-token").isEmpty());
        assertTrue(auth.authenticate(null).isEmpty());
        assertTrue(auth.authenticateHeader(null).isEmpty());
        assertTrue(auth.authenticateHeader("Basic abc").isEmpty());
    }

    @Test
    void authenticateHeaderAcceptsBearerToken() {
        String token = auth.login("0812345678", "1234").token();
        assertTrue(auth.authenticateHeader("Bearer " + token).isPresent());
    }

    @Test
    void pinIsNeverStoredAsPlainText() {
        String token = auth.login("0812345678", "1234").token();
        String stored = auth.authenticate(token).orElseThrow().getPinHash();
        assertNotEquals("1234", stored);
        assertFalse(stored.contains("1234"));
        assertTrue(PinHasher.matches("1234", stored));
        assertFalse(PinHasher.matches("1235", stored));
    }

    @Test
    void samePinGetsDifferentHashEachTime() {
        assertNotEquals(PinHasher.hash("1234"), PinHasher.hash("1234"));
    }
}

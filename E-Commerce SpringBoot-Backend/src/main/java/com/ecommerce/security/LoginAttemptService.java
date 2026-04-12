package com.ecommerce.security;

import com.ecommerce.exception.RateLimitExceededException;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Map<String, AttemptWindow> attempts = new ConcurrentHashMap<>();

    public void checkAllowed(String email) {
        String key = buildKey(email);
        AttemptWindow window = attempts.get(key);
        if (window == null) {
            return;
        }

        if (window.expiresAt().isBefore(Instant.now())) {
            attempts.remove(key);
            return;
        }

        if (window.count() >= MAX_ATTEMPTS) {
            throw new RateLimitExceededException("Too many failed login attempts. Please try again in 15 minutes.");
        }
    }

    public void recordFailure(String email) {
        String key = buildKey(email);
        attempts.compute(key, (ignored, existing) -> {
            Instant now = Instant.now();
            if (existing == null || existing.expiresAt().isBefore(now)) {
                return new AttemptWindow(1, now.plus(WINDOW));
            }
            return new AttemptWindow(existing.count() + 1, existing.expiresAt());
        });
    }

    public void clear(String email) {
        attempts.remove(buildKey(email));
    }

    private String buildKey(String email) {
        return normalize(email) + "|" + clientIp();
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String clientIp() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            return "unknown";
        }

        String forwarded = attrs.getRequest().getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }

        return attrs.getRequest().getRemoteAddr();
    }

    private record AttemptWindow(int count, Instant expiresAt) {}
}

package com.ecommerce.security;

import com.ecommerce.dto.response.JwtResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthCookieService {

    @Value("${app.jwt.cookie-name}")
    private String cookieName;

    @Value("${app.jwt.cookie-secure}")
    private boolean cookieSecure;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    public void addAuthCookie(HttpHeaders headers, String token) {
        headers.add(HttpHeaders.SET_COOKIE, ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(jwtExpiration / 1000)
                .build()
                .toString());
    }

    public void clearAuthCookie(HttpHeaders headers) {
        headers.add(HttpHeaders.SET_COOKIE, ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(0)
                .build()
                .toString());
    }

    public String extractToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    public JwtResponse sanitize(JwtResponse response) {
        return JwtResponse.builder()
                .token(null)
                .type(response.getType())
                .refreshToken(null)
                .id(response.getId())
                .name(response.getName())
                .email(response.getEmail())
                .emailVerified(response.isEmailVerified())
                .roles(response.getRoles())
                .build();
    }
}

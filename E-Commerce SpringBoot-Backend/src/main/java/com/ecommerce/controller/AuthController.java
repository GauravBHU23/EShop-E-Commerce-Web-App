package com.ecommerce.controller;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.*;
import com.ecommerce.security.AuthCookieService;
import com.ecommerce.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.web.csrf.CsrfToken;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, Login, Forgot/Reset Password")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @GetMapping("/csrf")
    @Operation(summary = "Fetch CSRF token for SPA requests")
    public ResponseEntity<ApiResponse<String>> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok(ApiResponse.success("CSRF token fetched", csrfToken.getToken()));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<JwtResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        JwtResponse response = authService.register(request);
        HttpHeaders headers = new HttpHeaders();
        authCookieService.addAuthCookie(headers, response.getToken());
        return ResponseEntity.status(HttpStatus.CREATED)
                .headers(headers)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<JwtResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        JwtResponse response = authService.login(request);
        HttpHeaders headers = new HttpHeaders();
        authCookieService.addAuthCookie(headers, response.getToken());
        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current user")
    public ResponseEntity<ApiResponse<Void>> logout() {
        HttpHeaders headers = new HttpHeaders();
        authCookieService.clearAuthCookie(headers);
        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.success("Logout successful"));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send password reset email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(
            "Password reset link sent to your email"));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully"));
    }
}

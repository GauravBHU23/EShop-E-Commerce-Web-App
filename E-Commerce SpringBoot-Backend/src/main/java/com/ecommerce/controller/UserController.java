package com.ecommerce.controller;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.*;
import com.ecommerce.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "Profile and Address Management")
@SecurityRequirement(name = "BearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Profile fetched",
                userService.getProfile(userDetails.getUsername())));
    }

    @PutMapping("/me")
    @Operation(summary = "Update profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Profile updated",
                userService.updateProfile(userDetails.getUsername(), request)));
    }

    @PostMapping("/me/avatar")
    @Operation(summary = "Upload profile picture")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Profile picture updated",
                userService.uploadProfileImage(userDetails.getUsername(), file)));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @PostMapping("/me/email-verification/otp")
    @Operation(summary = "Send email verification OTP")
    public ResponseEntity<ApiResponse<Void>> sendEmailVerificationOtp(
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.sendEmailVerificationOtp(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email"));
    }

    @PostMapping("/me/email-verification/verify")
    @Operation(summary = "Verify email with OTP")
    public ResponseEntity<ApiResponse<UserResponse>> verifyEmailOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EmailOtpVerificationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully",
                userService.verifyEmailOtp(userDetails.getUsername(), request)));
    }

    // ===== ADDRESSES =====

    @GetMapping("/me/addresses")
    @Operation(summary = "Get all addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Addresses fetched",
                userService.getAddresses(userDetails.getUsername())));
    }

    @PostMapping("/me/addresses")
    @Operation(summary = "Add new address")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Address added",
                        userService.addAddress(userDetails.getUsername(), request)));
    }

    @PutMapping("/me/addresses/{addressId}")
    @Operation(summary = "Update address")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long addressId,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Address updated",
                userService.updateAddress(userDetails.getUsername(), addressId, request)));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    @Operation(summary = "Delete address")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long addressId) {
        userService.deleteAddress(userDetails.getUsername(), addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted"));
    }
}

package com.ecommerce.service;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.*;
import com.ecommerce.entity.*;
import com.ecommerce.enums.RoleName;
import com.ecommerce.exception.*;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileUploadService fileUploadService;
    private final EmailService emailService;

    public UserResponse getProfile(String email) {
        User user = findUserByEmail(email);
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findUserByEmail(email);
        boolean changed = !user.getName().equals(request.getName()) ||
                (request.getPhone() != null && !request.getPhone().equals(user.getPhone()));
        user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        User savedUser = userRepository.save(user);
        if (changed) {
            emailService.sendProfileUpdatedEmail(savedUser);
        }
        return mapToUserResponse(savedUser);
    }

    @Transactional
    public UserResponse uploadProfileImage(String email, MultipartFile file) {
        User user = findUserByEmail(email);

        // Delete old image
        if (user.getProfileImage() != null) {
            fileUploadService.deleteFile(user.getProfileImage());
        }

        String imageUrl = fileUploadService.uploadImage(file, "profiles");
        user.setProfileImage(imageUrl);
        return mapToUserResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUserByEmail(email);
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        emailService.sendPasswordChangedEmail(user);
        log.info("Password changed for user: {}", email);
    }

    @Transactional
    public void sendEmailVerificationOtp(String email) {
        User user = findUserByEmail(email);

        if (user.isEmailVerified()) {
            throw new BadRequestException("Your email is already verified.");
        }

        String otp = generateOtp();
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendEmailVerificationOtp(user, otp);
        log.info("Email verification OTP generated for: {}", email);
    }

    @Transactional
    public UserResponse verifyEmailOtp(String email, EmailOtpVerificationRequest request) {
        User user = findUserByEmail(email);

        if (user.isEmailVerified()) {
            return mapToUserResponse(user);
        }

        if (user.getEmailVerificationOtp() == null || user.getEmailVerificationOtpExpiry() == null) {
            throw new BadRequestException("Please request an OTP first.");
        }

        if (user.getEmailVerificationOtpExpiry().isBefore(LocalDateTime.now())) {
            user.setEmailVerificationOtp(null);
            user.setEmailVerificationOtpExpiry(null);
            userRepository.save(user);
            throw new BadRequestException("OTP has expired. Please request a new OTP.");
        }

        if (!user.getEmailVerificationOtp().equals(request.getOtp())) {
            throw new BadRequestException("Invalid OTP. Please try again.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationOtpExpiry(null);

        User savedUser = userRepository.save(user);
        emailService.sendEmailVerifiedConfirmation(savedUser);
        log.info("Email verified successfully for: {}", email);
        return mapToUserResponse(savedUser);
    }

    // ===== ADDRESS =====
    public List<AddressResponse> getAddresses(String email) {
        User user = findUserByEmail(email);
        return addressRepository.findByUserId(user.getId()).stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressResponse addAddress(String email, AddressRequest request) {
        User user = findUserByEmail(email);

        if (request.isDefault()) {
            addressRepository.unsetDefaultByUserId(user.getId());
        }

        Address address = Address.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .street(request.getStreet())
                .landmark(request.getLandmark())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .country(request.getCountry())
                .isDefault(request.isDefault())
                .build();

        return mapToAddressResponse(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse updateAddress(String email, Long addressId, AddressRequest request) {
        User user = findUserByEmail(email);
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        if (request.isDefault()) {
            addressRepository.unsetDefaultByUserId(user.getId());
        }

        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setStreet(request.getStreet());
        address.setLandmark(request.getLandmark());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setPincode(request.getPincode());
        address.setCountry(request.getCountry());
        address.setDefault(request.isDefault());

        return mapToAddressResponse(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(String email, Long addressId) {
        User user = findUserByEmail(email);
        Address address = addressRepository.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
        addressRepository.delete(address);
    }

    // ===== HELPERS =====
    public User findUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public UserResponse mapToUserResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toList());
        boolean isDefaultAdmin = "admin@eshop.com".equalsIgnoreCase(user.getEmail()) &&
                roles.contains(RoleName.ROLE_ADMIN.name());
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .emailVerified(user.isEmailVerified())
                .phone(user.getPhone())
                .profileImage(user.getProfileImage())
                .isActive(isDefaultAdmin || user.isActive())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .build();
    }

    private AddressResponse mapToAddressResponse(Address a) {
        return AddressResponse.builder()
                .id(a.getId())
                .fullName(a.getFullName())
                .phone(a.getPhone())
                .street(a.getStreet())
                .landmark(a.getLandmark())
                .city(a.getCity())
                .state(a.getState())
                .pincode(a.getPincode())
                .country(a.getCountry())
                .isDefault(a.isDefault())
                .build();
    }

    private String generateOtp() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
    }
}

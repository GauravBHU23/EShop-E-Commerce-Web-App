package com.ecommerce.service;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.response.JwtResponse;
import com.ecommerce.entity.Role;
import com.ecommerce.entity.User;
import com.ecommerce.enums.RoleName;
import com.ecommerce.exception.DuplicateResourceException;
import com.ecommerce.repository.RoleRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtTokenProvider;
import com.ecommerce.security.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private EmailService emailService;
    @Mock private LoginAttemptService loginAttemptService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private Role userRole;
    private User mockUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest("Test User", "test@example.com", "password123", "9876543210");
        userRole = new Role(1L, RoleName.ROLE_USER);

        mockUser = User.builder()
                .id("user-uuid-123")
                .name("Test User")
                .email("test@example.com")
                .password("encodedPassword")
                .roles(Set.of(userRole))
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Register: success case")
    void register_Success() {
        given(userRepository.existsByEmailIgnoreCase(anyString())).willReturn(false);
        given(roleRepository.findByName(RoleName.ROLE_USER)).willReturn(Optional.of(userRole));
        given(passwordEncoder.encode(anyString())).willReturn("encodedPassword");
        given(userRepository.save(any(User.class))).willReturn(mockUser);
        given(jwtTokenProvider.generateTokenFromEmail(anyString())).willReturn("mock-jwt-token");
        given(jwtTokenProvider.generateRefreshToken(anyString())).willReturn("mock-refresh-token");
        willDoNothing().given(emailService).sendRegistrationEmail(any());

        JwtResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        then(userRepository).should().save(any(User.class));
        then(emailService).should().sendRegistrationEmail(any());
    }

    @Test
    @DisplayName("Register: duplicate email throws exception")
    void register_DuplicateEmail_ThrowsException() {
        given(userRepository.existsByEmailIgnoreCase("test@example.com")).willReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already registered");

        then(userRepository).should(never()).save(any());
    }

    @Test
    @DisplayName("Login: success case")
    void login_Success() {
        LoginRequest loginRequest = new LoginRequest("test@example.com", "password123");
        Authentication mockAuth = mock(Authentication.class);

        given(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .willReturn(mockAuth);
        given(userRepository.findByEmailIgnoreCase("test@example.com")).willReturn(Optional.of(mockUser));
        given(jwtTokenProvider.generateToken(mockAuth)).willReturn("mock-jwt-token");
        given(jwtTokenProvider.generateRefreshToken(anyString())).willReturn("mock-refresh-token");

        JwtResponse response = authService.login(loginRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getEmail()).isEqualTo("test@example.com");
    }
}

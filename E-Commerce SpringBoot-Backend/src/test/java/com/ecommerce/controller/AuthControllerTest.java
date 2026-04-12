package com.ecommerce.controller;

import com.ecommerce.dto.request.LoginRequest;
import com.ecommerce.dto.request.RegisterRequest;
import com.ecommerce.dto.response.JwtResponse;
import com.ecommerce.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@DisplayName("AuthController Integration Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private JwtResponse mockJwtResponse;

    @BeforeEach
    void setUp() {
        mockJwtResponse = JwtResponse.builder()
                .token("mock-jwt-token")
                .type("Bearer")
                .id("user-123")
                .name("Test User")
                .email("test@example.com")
                .roles(List.of("ROLE_USER"))
                .build();
    }

    @Test
    @DisplayName("POST /api/auth/register - success returns 201")
    void register_Success_Returns201() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Test User", "test@example.com", "password123", "9876543210");

        given(authService.register(any(RegisterRequest.class))).willReturn(mockJwtResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register - invalid email returns 400")
    void register_InvalidEmail_Returns400() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Test User", "not-an-email", "password123", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("POST /api/auth/register - short password returns 400")
    void register_ShortPassword_Returns400() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Test User", "test@example.com", "abc", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login - success returns 200 with token")
    void login_Success_Returns200() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        given(authService.login(any(LoginRequest.class))).willReturn(mockJwtResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.roles[0]").value("ROLE_USER"));
    }

    @Test
    @DisplayName("POST /api/auth/login - blank password returns 400")
    void login_BlankPassword_Returns400() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}

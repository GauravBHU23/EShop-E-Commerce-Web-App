package com.ecommerce.dto.response;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private String id;
    private String name;
    private String email;
    private boolean emailVerified;
    private String phone;
    private String profileImage;
    private boolean isActive;
    private List<String> roles;
    private LocalDateTime createdAt;
}

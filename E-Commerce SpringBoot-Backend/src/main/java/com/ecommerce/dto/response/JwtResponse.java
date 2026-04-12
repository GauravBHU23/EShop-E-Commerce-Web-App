package com.ecommerce.dto.response;
import lombok.*;
import java.util.List;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String refreshToken;
    private String id;
    private String name;
    private String email;
    private boolean emailVerified;
    private List<String> roles;
}

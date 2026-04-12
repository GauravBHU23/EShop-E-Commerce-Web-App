package com.ecommerce.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ResetPasswordRequest {
    @NotBlank private String token;
    @NotBlank @Size(min=6,max=40) private String newPassword;
}

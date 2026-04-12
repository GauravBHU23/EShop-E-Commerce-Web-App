package com.ecommerce.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChangePasswordRequest {
    @NotBlank private String oldPassword;
    @NotBlank @Size(min=6,max=40) private String newPassword;
}

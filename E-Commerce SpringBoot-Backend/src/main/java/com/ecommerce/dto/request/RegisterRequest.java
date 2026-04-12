package com.ecommerce.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    @NotBlank @Size(min=2,max=100) private String name;
    @NotBlank @Email private String email;
    @NotBlank @Size(min=6,max=40) private String password;
    @Pattern(regexp="^[6-9]\\d{9}$", message="Invalid phone") private String phone;
}

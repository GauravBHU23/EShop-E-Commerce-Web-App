package com.ecommerce.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateProfileRequest {
    @NotBlank @Size(min=2,max=100) private String name;
    @Pattern(regexp="^[6-9]\\d{9}$", message="Invalid phone") private String phone;
}

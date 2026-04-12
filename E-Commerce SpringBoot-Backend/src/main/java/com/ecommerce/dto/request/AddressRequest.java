package com.ecommerce.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AddressRequest {
    @NotBlank private String fullName;
    @NotBlank private String phone;
    @NotBlank private String street;
    private String landmark;
    @NotBlank private String city;
    @NotBlank private String state;
    @NotBlank @Size(min=6,max=6) private String pincode;
    @NotBlank private String country;
    private boolean isDefault;
}

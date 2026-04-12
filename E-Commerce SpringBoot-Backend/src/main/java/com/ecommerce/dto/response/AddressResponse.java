package com.ecommerce.dto.response;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AddressResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String street;
    private String landmark;
    private String city;
    private String state;
    private String pincode;
    private String country;
    private boolean isDefault;
}

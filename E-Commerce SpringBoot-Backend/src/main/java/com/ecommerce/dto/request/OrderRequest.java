package com.ecommerce.dto.request;
import com.ecommerce.enums.PaymentMode;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderRequest {
    @NotNull private Long addressId;
    @NotNull private PaymentMode paymentMode;
    private String couponCode;
    private String notes;
}

package com.ecommerce.dto.request;
import com.ecommerce.enums.DiscountType;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CouponRequest {
    @NotBlank private String code;
    @NotBlank private String description;
    @NotNull private DiscountType discountType;
    @NotNull @DecimalMin("0.01") private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private Integer usageLimit;
    @NotNull private LocalDateTime expiryDate;
}

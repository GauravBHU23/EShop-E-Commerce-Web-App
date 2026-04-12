package com.ecommerce.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {
    @NotBlank private String name;
    @NotBlank private String description;
    @NotNull @DecimalMin("0.01") private BigDecimal price;
    private BigDecimal discountPrice;
    @NotNull @Min(0) private Integer stockQty;
    private String brand;
    @NotNull private Long categoryId;
}

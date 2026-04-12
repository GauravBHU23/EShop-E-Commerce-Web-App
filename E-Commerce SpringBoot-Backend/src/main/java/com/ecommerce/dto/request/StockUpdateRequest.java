package com.ecommerce.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StockUpdateRequest {
    @NotNull @Min(0) private Integer quantity;
}

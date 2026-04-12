package com.ecommerce.dto.request;
import com.ecommerce.enums.OrderStatus;
import jakarta.validation.constraints.*;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateOrderStatusRequest {
    @NotNull private OrderStatus status;
}

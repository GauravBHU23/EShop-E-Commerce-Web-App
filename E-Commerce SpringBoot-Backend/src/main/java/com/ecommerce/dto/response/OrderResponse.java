package com.ecommerce.dto.response;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.PaymentMode;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private List<OrderItemResponse> items;
    private String shippingName;
    private String shippingPhone;
    private String shippingStreet;
    private String shippingCity;
    private String shippingState;
    private String shippingPincode;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private PaymentMode paymentMode;
    private String couponCode;
    private PaymentResponse payment;
    private LocalDateTime placedAt;
}

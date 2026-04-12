package com.ecommerce.dto.response;

import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.PaymentStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentVerificationResponse {
    private Long orderId;
    private String orderNumber;
    private String paymentRequestId;
    private String paymentId;
    private PaymentStatus paymentStatus;
    private OrderStatus orderStatus;
    private boolean verified;
}

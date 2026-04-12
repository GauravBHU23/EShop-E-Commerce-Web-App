package com.ecommerce.dto.response;

import com.ecommerce.enums.PaymentStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInitiationResponse {
    private Long orderId;
    private String orderNumber;
    private String paymentRequestId;
    private String paymentUrl;
    private PaymentStatus paymentStatus;
}

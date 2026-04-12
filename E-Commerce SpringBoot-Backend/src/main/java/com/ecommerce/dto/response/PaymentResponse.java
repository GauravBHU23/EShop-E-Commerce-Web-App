package com.ecommerce.dto.response;
import com.ecommerce.enums.PaymentMode;
import com.ecommerce.enums.PaymentStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentResponse {
    private Long id;
    private PaymentMode paymentMode;
    private PaymentStatus status;
    private BigDecimal amount;
    private String transactionId;
    private LocalDateTime paidAt;
}

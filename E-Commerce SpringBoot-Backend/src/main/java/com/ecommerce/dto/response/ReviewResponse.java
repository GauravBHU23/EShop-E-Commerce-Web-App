package com.ecommerce.dto.response;
import lombok.*;
import java.time.LocalDateTime;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewResponse {
    private Long id;
    private String userId;
    private String userName;
    private Integer rating;
    private String comment;
    private boolean isVerifiedPurchase;
    private LocalDateTime createdAt;
}

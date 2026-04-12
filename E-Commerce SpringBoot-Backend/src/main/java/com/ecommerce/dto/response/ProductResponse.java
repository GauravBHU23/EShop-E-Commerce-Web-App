package com.ecommerce.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Integer stockQty;
    private String brand;
    private Double avgRating;
    private Integer totalReviews;
    private boolean isActive;
    private CategoryResponse category;
    private List<ProductImageResponse> images;
    private LocalDateTime createdAt;
}

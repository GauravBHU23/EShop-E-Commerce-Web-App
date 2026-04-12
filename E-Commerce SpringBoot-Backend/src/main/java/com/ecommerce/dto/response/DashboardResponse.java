package com.ecommerce.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardResponse {
    private Long totalUsers;
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private Long totalProducts;
    private Long ordersThisMonth;
    private BigDecimal revenueThisMonth;
    private List<ProductResponse> topSellingProducts;
}

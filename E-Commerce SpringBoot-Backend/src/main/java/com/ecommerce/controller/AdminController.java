package com.ecommerce.controller;

import com.ecommerce.dto.request.*;
import com.ecommerce.dto.response.*;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.service.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin Panel APIs")
@SecurityRequirement(name = "BearerAuth")
public class AdminController {

    private final AdminService adminService;
    private final OrderService orderService;
    private final InventoryService inventoryService;
    private final CouponService couponService;

    // ===== DASHBOARD =====

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard data",
                adminService.getDashboard()));
    }

    // ===== USER MANAGEMENT =====

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Users fetched",
                adminService.getAllUsers(page, size)));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success("User fetched",
                adminService.getUserById(userId)));
    }

    @PatchMapping("/users/{userId}/toggle-status")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success("User status updated",
                adminService.toggleUserStatus(userId)));
    }

    // ===== ORDER MANAGEMENT =====

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<PagedResponse<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success("Orders fetched",
                orderService.getAllOrders(page, size, status)));
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Order status updated",
                orderService.updateOrderStatus(orderId, request.getStatus())));
    }

    // ===== INVENTORY =====

    @GetMapping("/inventory/low-stock")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts() {
        return ResponseEntity.ok(ApiResponse.success("Low stock products",
                inventoryService.getLowStockProducts()));
    }

    @PatchMapping("/inventory/products/{productId}/restock")
    public ResponseEntity<ApiResponse<ProductResponse>> restockProduct(
            @PathVariable Long productId,
            @Valid @RequestBody StockUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Stock updated",
                inventoryService.restockProduct(productId, request.getQuantity())));
    }

    @PutMapping("/inventory/products/{productId}/stock")
    public ResponseEntity<ApiResponse<ProductResponse>> setStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Stock set",
                inventoryService.setStock(productId, request.getQuantity())));
    }

    // ===== COUPONS =====

    @GetMapping("/coupons")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getAllCoupons() {
        return ResponseEntity.ok(ApiResponse.success("Coupons fetched",
                couponService.getAllCoupons()));
    }

    @PostMapping("/coupons")
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(
            @Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Coupon created",
                        couponService.createCoupon(request)));
    }

    @PatchMapping("/coupons/{couponId}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleCoupon(@PathVariable Long couponId) {
        couponService.toggleCoupon(couponId);
        return ResponseEntity.ok(ApiResponse.success("Coupon status toggled"));
    }
}

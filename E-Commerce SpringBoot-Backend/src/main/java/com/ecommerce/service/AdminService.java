package com.ecommerce.service;

import com.ecommerce.dto.response.*;
import com.ecommerce.entity.User;
import com.ecommerce.enums.RoleName;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final UserService userService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0);

        Long totalUsers    = userRepository.count();
        Long totalOrders   = orderRepository.countTotalOrders();
        Long totalProducts = productRepository.count();

        BigDecimal totalRevenue    = orderRepository.getTotalRevenue();
        BigDecimal revenueMonth    = orderRepository.getRevenueSince(monthStart);
        Long ordersThisMonth       = orderRepository.countOrdersSince(monthStart);

        List<ProductResponse> topSelling = productRepository
                .findTopSellingProducts(PageRequest.of(0, 5))
                .stream()
                .map(productService::mapToResponse)
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalProducts(totalProducts)
                .ordersThisMonth(ordersThisMonth)
                .revenueThisMonth(revenueMonth != null ? revenueMonth : BigDecimal.ZERO)
                .topSellingProducts(topSelling)
                .build();
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(
                userRepository.findAll(pageable).map(userService::mapToUserResponse));
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return userService.mapToUserResponse(user);
    }

    @Transactional
    public UserResponse toggleUserStatus(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean isAdminAccount = user.getRoles().stream()
                .anyMatch(role -> role.getName() == RoleName.ROLE_ADMIN);
        if (isAdminAccount && user.isActive()) {
            throw new BadRequestException("Admin accounts cannot be disabled.");
        }

        user.setActive(!user.isActive());
        log.info("User {} status toggled to: {}", userId, user.isActive());
        User savedUser = userRepository.save(user);
        emailService.sendAccountStatusChangedEmail(savedUser, savedUser.isActive());
        return userService.mapToUserResponse(savedUser);
    }
}

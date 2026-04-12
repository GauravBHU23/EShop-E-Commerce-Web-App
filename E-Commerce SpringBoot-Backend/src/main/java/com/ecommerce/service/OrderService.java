package com.ecommerce.service;

import com.ecommerce.dto.request.OrderRequest;
import com.ecommerce.dto.response.*;
import com.ecommerce.entity.*;
import com.ecommerce.enums.*;
import com.ecommerce.exception.*;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final PaymentRepository paymentRepository;
    private final CartService cartService;
    private final CouponService couponService;
    private final EmailService emailService;
    private final UserService userService;

    @Transactional
    public OrderResponse placeOrder(String email, OrderRequest request) {
        User user = userService.findUserByEmail(email);

        // 1. Get cart and validate it has items
        Cart cart = cartService.getOrCreateCart(user);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Your cart is empty");
        }

        // 2. Validate shipping address
        Address address = addressRepository.findByIdAndUserId(request.getAddressId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));

        // 3. Calculate amounts
        BigDecimal subtotal = cart.getTotalAmount();
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            discountAmount = couponService.validateAndCalculateDiscount(
                    request.getCouponCode(), subtotal);
        }

        BigDecimal totalAmount = subtotal.subtract(discountAmount);

        // 4. Build order
        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .shippingName(address.getFullName())
                .shippingPhone(address.getPhone())
                .shippingStreet(address.getStreet())
                .shippingCity(address.getCity())
                .shippingState(address.getState())
                .shippingPincode(address.getPincode())
                .shippingCountry(address.getCountry())
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .status(OrderStatus.PLACED)
                .paymentMode(request.getPaymentMode())
                .couponCode(request.getCouponCode())
                .notes(request.getNotes())
                .build();

        // 5. Build order items + deduct stock
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            // Atomic stock decrement
            int updated = productRepository.decreaseStock(product.getId(), cartItem.getQuantity());
            if (updated == 0) {
                throw new InsufficientStockException(
                        product.getName(), cartItem.getQuantity(), product.getStockQty());
            }

            String imageUrl = product.getImages() != null && !product.getImages().isEmpty()
                    ? product.getImages().get(0).getImageUrl() : null;

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productImage(imageUrl)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(cartItem.getPrice())
                    .totalPrice(cartItem.getSubtotal())
                    .build();
            orderItems.add(orderItem);
        }
        order.setItems(orderItems);

        // 6. Create payment record
        Payment payment = Payment.builder()
                .order(order)
                .paymentMode(request.getPaymentMode())
                .amount(totalAmount)
                .status(request.getPaymentMode() == PaymentMode.COD
                        ? PaymentStatus.PENDING : PaymentStatus.PENDING)
                .build();

        // For COD, simulate immediate confirmation
        if (request.getPaymentMode() == PaymentMode.COD) {
            payment.setTransactionId("COD-" + System.currentTimeMillis());
        }

        order.setPayment(payment);

        // 7. Save order
        Order savedOrder = orderRepository.save(order);

        // 8. Apply coupon usage
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            couponService.incrementUsage(request.getCouponCode());
        }

        // 9. Clear cart
        cartService.clearCart(cart);

        // 10. Send confirmation email
        emailService.sendOrderPlacedEmail(user, savedOrder);

        log.info("Order placed: {} for user: {}", savedOrder.getOrderNumber(), email);
        return mapToResponse(savedOrder);
    }

    @Transactional
    public Order createPendingOnlineOrder(String email, OrderRequest request) {
        if (request.getPaymentMode() == PaymentMode.COD) {
            throw new BadRequestException("Use the regular order endpoint for Cash on Delivery.");
        }

        User user = userService.findUserByEmail(email);
        Cart cart = cartService.getOrCreateCart(user);
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BadRequestException("Your cart is empty");
        }

        Address address = addressRepository.findByIdAndUserId(request.getAddressId(), user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", request.getAddressId()));

        BigDecimal subtotal = cart.getTotalAmount();
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            discountAmount = couponService.validateAndCalculateDiscount(
                    request.getCouponCode(), subtotal);
        }

        BigDecimal totalAmount = subtotal.subtract(discountAmount);

        Order order = Order.builder()
                .orderNumber(generateOrderNumber())
                .user(user)
                .shippingName(address.getFullName())
                .shippingPhone(address.getPhone())
                .shippingStreet(address.getStreet())
                .shippingCity(address.getCity())
                .shippingState(address.getState())
                .shippingPincode(address.getPincode())
                .shippingCountry(address.getCountry())
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .totalAmount(totalAmount)
                .status(OrderStatus.PLACED)
                .paymentMode(request.getPaymentMode())
                .couponCode(request.getCouponCode())
                .notes(request.getNotes())
                .build();

        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            int updated = productRepository.decreaseStock(product.getId(), cartItem.getQuantity());
            if (updated == 0) {
                throw new InsufficientStockException(
                        product.getName(), cartItem.getQuantity(), product.getStockQty());
            }

            String imageUrl = product.getImages() != null && !product.getImages().isEmpty()
                    ? product.getImages().get(0).getImageUrl() : null;

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productImage(imageUrl)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(cartItem.getPrice())
                    .totalPrice(cartItem.getSubtotal())
                    .build();
            orderItems.add(orderItem);
        }
        order.setItems(orderItems);

        Payment payment = Payment.builder()
                .order(order)
                .paymentMode(request.getPaymentMode())
                .amount(totalAmount)
                .status(PaymentStatus.PENDING)
                .providerName("INSTAMOJO")
                .build();

        order.setPayment(payment);

        Order savedOrder = orderRepository.save(order);
        log.info("Pending online payment order created: {} for user: {}", savedOrder.getOrderNumber(), email);
        return savedOrder;
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getUserOrders(String email, int page, int size) {
        User user = userService.findUserByEmail(email);
        Pageable pageable = PageRequest.of(page, size);
        Page<OrderResponse> result = orderRepository
                .findByUserIdAndHiddenByUserFalseOrderByPlacedAtDesc(user.getId(), pageable)
                .map(this::mapToResponse);
        return PagedResponse.from(result);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(String email, Long orderId) {
        User user = userService.findUserByEmail(email);
        Order order = orderRepository.findByIdAndUserIdAndHiddenByUserFalse(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return mapToResponse(order);
    }

    @Transactional
    public OrderResponse cancelOrder(String email, Long orderId) {
        User user = userService.findUserByEmail(email);
        Order order = orderRepository.findByIdAndUserIdAndHiddenByUserFalse(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() == OrderStatus.SHIPPED ||
            order.getStatus() == OrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot cancel order that is already " + order.getStatus());
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        // Restore stock
        for (OrderItem item : order.getItems()) {
            productRepository.increaseStock(item.getProduct().getId(), item.getQuantity());
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        emailService.sendOrderStatusUpdateEmail(user, saved);
        return mapToResponse(saved);
    }

    @Transactional
    public void hideOrderFromUserHistory(String email, Long orderId) {
        User user = userService.findUserByEmail(email);
        Order order = orderRepository.findByIdAndUserIdAndHiddenByUserFalse(orderId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != OrderStatus.CANCELLED && order.getStatus() != OrderStatus.REFUNDED) {
            throw new BadRequestException("Only cancelled or refunded orders can be removed from My Orders.");
        }

        order.setHiddenByUser(true);
        orderRepository.save(order);
        log.info("Order {} hidden from user history for user {}", orderId, email);
    }

    // ===== ADMIN =====
    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> getAllOrders(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("placedAt").descending());
        Page<Order> orders;
        if (status != null && !status.isBlank()) {
            OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
            orders = orderRepository.findByStatus(orderStatus, pageable);
        } else {
            orders = orderRepository.findAll(pageable);
        }
        return PagedResponse.from(orders.map(this::mapToResponse));
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderStatus currentStatus = order.getStatus();
        validateStatusTransition(currentStatus, newStatus);

        order.setStatus(newStatus);

        // If delivered, mark payment as success for COD
        if (newStatus == OrderStatus.DELIVERED
                && order.getPaymentMode() == PaymentMode.COD
                && order.getPayment() != null) {
            order.getPayment().setStatus(PaymentStatus.SUCCESS);
            order.getPayment().setPaidAt(LocalDateTime.now());
        }

        Order saved = orderRepository.save(order);
        emailService.sendOrderStatusUpdateEmail(saved.getUser(), saved);
        log.info("Order {} status updated: {} -> {}", orderId, currentStatus, newStatus);
        return mapToResponse(saved);
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PLACED    -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.SHIPPED   || next == OrderStatus.CANCELLED;
            case SHIPPED   -> next == OrderStatus.DELIVERED;
            case DELIVERED -> next == OrderStatus.REFUNDED;
            default        -> false;
        };
        if (!valid) {
            throw new BadRequestException(
                "Invalid status transition from " + current + " to " + next);
        }
    }

    private String generateOrderNumber() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String uniquePart = String.valueOf(System.currentTimeMillis()).substring(7);
        return "ORD-" + datePart + "-" + uniquePart;
    }

    public OrderResponse mapToResponse(Order o) {
        if (o.getItems() == null) {
            o.setItems(new java.util.ArrayList<>());
        }

        List<OrderItemResponse> items = o.getItems() == null ? List.of() :
                o.getItems().stream().map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .productImage(item.getProductImage())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        PaymentResponse paymentResponse = null;
        if (o.getPayment() != null) {
            Payment p = o.getPayment();
            paymentResponse = PaymentResponse.builder()
                    .id(p.getId())
                    .paymentMode(p.getPaymentMode())
                    .status(p.getStatus())
                    .amount(p.getAmount())
                    .transactionId(p.getTransactionId())
                    .paidAt(p.getPaidAt())
                    .build();
        }

        return OrderResponse.builder()
                .id(o.getId())
                .orderNumber(o.getOrderNumber())
                .items(items)
                .shippingName(o.getShippingName())
                .shippingPhone(o.getShippingPhone())
                .shippingStreet(o.getShippingStreet())
                .shippingCity(o.getShippingCity())
                .shippingState(o.getShippingState())
                .shippingPincode(o.getShippingPincode())
                .subtotal(o.getSubtotal())
                .discountAmount(o.getDiscountAmount())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus())
                .paymentMode(o.getPaymentMode())
                .couponCode(o.getCouponCode())
                .payment(paymentResponse)
                .placedAt(o.getPlacedAt())
                .build();
    }
}

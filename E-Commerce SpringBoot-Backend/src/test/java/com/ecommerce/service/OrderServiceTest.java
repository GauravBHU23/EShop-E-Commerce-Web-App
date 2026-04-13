package com.ecommerce.service;

import com.ecommerce.dto.request.OrderRequest;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.entity.Address;
import com.ecommerce.entity.Cart;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.PaymentMode;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.AddressRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.ecommerce.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService Tests")
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private ProductRepository productRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private CartService cartService;
    @Mock private CouponService couponService;
    @Mock private EmailService emailService;
    @Mock private UserService userService;

    @InjectMocks
    private OrderService orderService;

    private User mockUser;
    private Address mockAddress;
    private Cart mockCart;
    private CartItem mockCartItem;
    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id("user-123")
                .name("Test User")
                .email("test@example.com")
                .build();

        mockAddress = Address.builder()
                .id(1L).user(mockUser)
                .fullName("Test User").phone("9999999999")
                .street("123 MG Road").city("Mumbai")
                .state("Maharashtra").pincode("400001")
                .country("India")
                .build();

        mockProduct = Product.builder()
                .id(1L).name("Test Product")
                .price(new BigDecimal("999.00"))
                .stockQty(10).isActive(true)
                .images(new ArrayList<>())
                .build();

        mockCartItem = CartItem.builder()
                .id(1L).product(mockProduct)
                .quantity(2).price(new BigDecimal("999.00"))
                .build();

        mockCart = Cart.builder()
                .id(1L).user(mockUser)
                .items(new ArrayList<>(List.of(mockCartItem)))
                .totalAmount(new BigDecimal("1998.00"))
                .build();
    }

    @Test
    @DisplayName("Place order: empty cart throws exception")
    void placeOrder_EmptyCart_ThrowsException() {
        mockCart.setItems(new ArrayList<>());
        OrderRequest request = new OrderRequest(1L, PaymentMode.COD, null, null);

        given(userService.findUserByEmail(anyString())).willReturn(mockUser);
        given(cartService.getOrCreateCart(mockUser)).willReturn(mockCart);

        assertThatThrownBy(() -> orderService.placeOrder("test@example.com", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("empty");
    }

    @Test
    @DisplayName("Place order: invalid address throws exception")
    void placeOrder_InvalidAddress_ThrowsException() {
        OrderRequest request = new OrderRequest(99L, PaymentMode.COD, null, null);

        given(userService.findUserByEmail(anyString())).willReturn(mockUser);
        given(cartService.getOrCreateCart(mockUser)).willReturn(mockCart);
        given(addressRepository.findByIdAndUserId(99L, "user-123")).willReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.placeOrder("test@example.com", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Address");
    }

    @Test
    @DisplayName("Cancel order: DELIVERED order cannot be cancelled")
    void cancelOrder_DeliveredOrder_ThrowsException() {
        Order deliveredOrder = Order.builder()
                .id(1L).status(OrderStatus.DELIVERED)
                .user(mockUser).items(new ArrayList<>())
                .build();

        given(userService.findUserByEmail(anyString())).willReturn(mockUser);
        given(orderRepository.findVisibleOrderByIdAndUserId(1L, "user-123"))
                .willReturn(Optional.of(deliveredOrder));

        assertThatThrownBy(() -> orderService.cancelOrder("test@example.com", 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot cancel");
    }

    @Test
    @DisplayName("Update status: invalid transition throws exception")
    void updateStatus_InvalidTransition_ThrowsException() {
        Order order = Order.builder()
                .id(1L).status(OrderStatus.PLACED)
                .user(mockUser).items(new ArrayList<>())
                .build();

        given(orderRepository.findById(1L)).willReturn(Optional.of(order));

        // PLACED -> DELIVERED is invalid (must go PLACED -> CONFIRMED -> SHIPPED -> DELIVERED)
        assertThatThrownBy(() -> orderService.updateOrderStatus(1L, OrderStatus.DELIVERED))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid status transition");
    }

    @Test
    @DisplayName("Update status: valid transition PLACED -> CONFIRMED succeeds")
    void updateStatus_ValidTransition_Succeeds() {
        Order order = Order.builder()
                .id(1L).status(OrderStatus.PLACED)
                .user(mockUser).items(new ArrayList<>())
                .paymentMode(PaymentMode.ONLINE)
                .totalAmount(new BigDecimal("999.00"))
                .build();

        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(orderRepository.save(any(Order.class))).willReturn(order);
        willDoNothing().given(emailService).sendOrderStatusUpdateEmail(any(), any());

        OrderResponse response = orderService.updateOrderStatus(1L, OrderStatus.CONFIRMED);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        then(orderRepository).should().save(order);
    }
}

package com.ecommerce.service;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.*;
import com.ecommerce.repository.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CartService Tests")
class CartServiceTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private UserService userService;

    @InjectMocks
    private CartService cartService;

    private User mockUser;
    private Cart mockCart;
    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id("user-123").name("Test User").email("test@example.com").build();

        mockProduct = Product.builder()
                .id(1L).name("Test Product")
                .price(new BigDecimal("500.00"))
                .discountPrice(new BigDecimal("450.00"))
                .stockQty(20).isActive(true)
                .images(new ArrayList<>())
                .build();

        mockCart = Cart.builder()
                .id(1L).user(mockUser)
                .items(new ArrayList<>())
                .totalAmount(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("Add to cart: new item added successfully")
    void addToCart_NewItem_Success() {
        CartItemRequest request = new CartItemRequest(1L, 2);

        given(userService.findUserByEmail(anyString())).willReturn(mockUser);
        given(cartRepository.findByUserId(anyString())).willReturn(Optional.of(mockCart));
        given(productRepository.findById(1L)).willReturn(Optional.of(mockProduct));
        given(cartItemRepository.findByCartIdAndProductId(anyLong(), anyLong()))
                .willReturn(Optional.empty());
        given(cartRepository.save(any(Cart.class))).willReturn(mockCart);

        CartResponse response = cartService.addToCart("test@example.com", request);

        assertThat(response).isNotNull();
        then(cartRepository).should().save(any(Cart.class));
    }

    @Test
    @DisplayName("Add to cart: inactive product throws exception")
    void addToCart_InactiveProduct_ThrowsException() {
        mockProduct.setActive(false);
        CartItemRequest request = new CartItemRequest(1L, 1);

        given(userService.findUserByEmail(anyString())).willReturn(mockUser);
        given(cartRepository.findByUserId(anyString())).willReturn(Optional.of(mockCart));
        given(productRepository.findById(1L)).willReturn(Optional.of(mockProduct));

        assertThatThrownBy(() -> cartService.addToCart("test@example.com", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not available");
    }

    @Test
    @DisplayName("Add to cart: exceeds stock throws InsufficientStockException")
    void addToCart_ExceedsStock_ThrowsException() {
        mockProduct.setStockQty(1);
        CartItemRequest request = new CartItemRequest(1L, 5); // request 5, only 1 available

        given(userService.findUserByEmail(anyString())).willReturn(mockUser);
        given(cartRepository.findByUserId(anyString())).willReturn(Optional.of(mockCart));
        given(productRepository.findById(1L)).willReturn(Optional.of(mockProduct));

        assertThatThrownBy(() -> cartService.addToCart("test@example.com", request))
                .isInstanceOf(InsufficientStockException.class);
    }

    @Test
    @DisplayName("Remove from cart: item removed successfully")
    void removeFromCart_Success() {
        CartItem cartItem = CartItem.builder()
                .id(1L).cart(mockCart).product(mockProduct)
                .quantity(2).price(new BigDecimal("450.00"))
                .build();
        mockCart.getItems().add(cartItem);

        given(userService.findUserByEmail(anyString())).willReturn(mockUser);
        given(cartRepository.findByUserId(anyString())).willReturn(Optional.of(mockCart));
        given(cartItemRepository.findByCartIdAndProductId(1L, 1L))
                .willReturn(Optional.of(cartItem));
        given(cartRepository.save(any(Cart.class))).willReturn(mockCart);

        CartResponse response = cartService.removeFromCart("test@example.com", 1L);

        assertThat(response).isNotNull();
        assertThat(mockCart.getItems()).isEmpty();
    }
}

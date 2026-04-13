package com.ecommerce.service;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.*;
import com.ecommerce.entity.*;
import com.ecommerce.exception.*;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    @Transactional
    public CartResponse getCart(String email) {
        User user = userService.findUserByEmail(email);
        Cart cart = getOrCreateCart(user);
        return mapToResponse(cart);
    }

    @Transactional
    public CartResponse addToCart(String email, CartItemRequest request) {
        User user = userService.findUserByEmail(email);
        Cart cart = getOrCreateCart(user);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        if (!product.isActive()) {
            throw new BadRequestException("Product is not available: " + product.getName());
        }
        if (product.getStockQty() < request.getQuantity()) {
            throw new InsufficientStockException(product.getName(),
                    request.getQuantity(), product.getStockQty());
        }

        // Check if item already in cart
        Optional<CartItem> existingItem =
                cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.getQuantity();
            if (newQty > product.getStockQty()) {
                throw new InsufficientStockException(product.getName(), newQty, product.getStockQty());
            }
            item.setQuantity(newQty);
            cartItemRepository.save(item);
        } else {
            BigDecimal price = product.getDiscountPrice() != null
                    ? product.getDiscountPrice() : product.getPrice();

            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .price(price)
                    .build();
            cart.getItems().add(newItem);
        }

        recalculateTotal(cart);
        return mapToResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateCartItem(String email, Long productId, int quantity) {
        User user = userService.findUserByEmail(email);
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            Product product = item.getProduct();
            if (quantity > product.getStockQty()) {
                throw new InsufficientStockException(product.getName(), quantity, product.getStockQty());
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        recalculateTotal(cart);
        return mapToResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeFromCart(String email, Long productId) {
        User user = userService.findUserByEmail(email);
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        cart.getItems().remove(item);
        cartItemRepository.delete(item);
        recalculateTotal(cart);
        return mapToResponse(cartRepository.save(cart));
    }

    @Transactional
    public void clearCart(Cart cart) {
        cart.getItems().clear();
        cart.setTotalAmount(BigDecimal.ZERO);
        cartRepository.save(cart);
    }

    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .user(user)
                            .totalAmount(BigDecimal.ZERO)
                            .build();
                    if (newCart.getItems() == null) {
                        newCart.setItems(new java.util.ArrayList<>());
                    }
                    return cartRepository.save(newCart);
                });
    }

    private void recalculateTotal(Cart cart) {
        if (cart.getItems() == null) {
            cart.setItems(new java.util.ArrayList<>());
        }
        BigDecimal total = cart.getItems().stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        cart.setTotalAmount(total);
    }

    private CartResponse mapToResponse(Cart cart) {
        if (cart.getItems() == null) {
            cart.setItems(new java.util.ArrayList<>());
        }

        List<CartItemResponse> items = cart.getItems().stream()
                .map(item -> {
                    Product p = item.getProduct();
                    String imageUrl = p.getImages() != null && !p.getImages().isEmpty()
                            ? p.getImages().stream()
                                .filter(ProductImage::isPrimary)
                                .findFirst()
                                .map(ProductImage::getImageUrl)
                                .orElse(p.getImages().get(0).getImageUrl())
                            : null;
                    return CartItemResponse.builder()
                            .id(item.getId())
                            .productId(p.getId())
                            .productName(p.getName())
                            .productImage(imageUrl)
                            .price(item.getPrice())
                            .quantity(item.getQuantity())
                            .subtotal(item.getSubtotal())
                            .build();
                })
                .collect(Collectors.toList());

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .totalItems(items.size())
                .totalAmount(cart.getTotalAmount())
                .build();
    }
}

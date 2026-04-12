package com.ecommerce.service;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Tests")
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private FileUploadService fileUploadService;
    @Mock private CategoryService categoryService;

    @InjectMocks
    private ProductService productService;

    private Product mockProduct;
    private Category mockCategory;

    @BeforeEach
    void setUp() {
        mockCategory = new Category();
        mockCategory.setId(1L);
        mockCategory.setName("Electronics");
        mockCategory.setSlug("electronics");

        mockProduct = Product.builder()
                .id(1L)
                .name("Test Phone")
                .slug("test-phone")
                .description("A great phone")
                .price(new BigDecimal("9999.00"))
                .stockQty(50)
                .brand("TestBrand")
                .category(mockCategory)
                .isActive(true)
                .avgRating(0.0)
                .totalReviews(0)
                .images(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Get product by ID: success")
    void getProductById_Success() {
        given(productRepository.findById(1L)).willReturn(Optional.of(mockProduct));
        given(categoryService.mapToResponse(any())).willReturn(null);

        ProductResponse response = productService.getProductById(1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Test Phone");
        assertThat(response.getPrice()).isEqualByComparingTo("9999.00");
    }

    @Test
    @DisplayName("Get product by ID: not found throws exception")
    void getProductById_NotFound() {
        given(productRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProductById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Product");
    }

    @Test
    @DisplayName("Get all products: returns paged response")
    void getAllProducts_ReturnsPaged() {
        Page<Product> page = new PageImpl<>(List.of(mockProduct),
                PageRequest.of(0, 12), 1);
        given(productRepository.findByIsActiveTrue(any(Pageable.class))).willReturn(page);
        given(categoryService.mapToResponse(any())).willReturn(null);

        var result = productService.getAllProducts(0, 12, "createdAt", "desc");

        assertThat(result).isNotNull();
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("Create product: success")
    void createProduct_Success() {
        ProductRequest request = new ProductRequest(
                "New Product", "Description",
                new BigDecimal("1999.00"), null,
                100, "BrandX", 1L);

        given(categoryRepository.findById(1L)).willReturn(Optional.of(mockCategory));
        given(productRepository.existsBySlug(anyString())).willReturn(false);
        given(productRepository.save(any(Product.class))).willReturn(mockProduct);
        given(categoryService.mapToResponse(any())).willReturn(null);

        ProductResponse response = productService.createProduct(request, null);

        assertThat(response).isNotNull();
        then(productRepository).should().save(any(Product.class));
    }

    @Test
    @DisplayName("Create product: category not found throws exception")
    void createProduct_CategoryNotFound() {
        ProductRequest request = new ProductRequest(
                "New Product", "Desc",
                new BigDecimal("999.00"), null,
                10, "Brand", 99L);

        given(categoryRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.createProduct(request, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Category");
    }

    @Test
    @DisplayName("Delete product: soft delete sets isActive=false")
    void deleteProduct_SoftDelete() {
        given(productRepository.findById(1L)).willReturn(Optional.of(mockProduct));
        given(productRepository.save(any(Product.class))).willReturn(mockProduct);

        productService.deleteProduct(1L);

        assertThat(mockProduct.isActive()).isFalse();
        then(productRepository).should().save(mockProduct);
    }
}

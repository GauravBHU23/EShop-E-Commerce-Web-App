package com.ecommerce.service;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.*;
import com.ecommerce.entity.*;
import com.ecommerce.exception.*;
import com.ecommerce.repository.*;
import com.ecommerce.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FileUploadService fileUploadService;
    private final CategoryService categoryService;

    @Cacheable("products")
    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ProductResponse> result = productRepository.findByIsActiveTrue(pageable)
                .map(this::mapToResponse);
        return PagedResponse.from(result);
    }

    @Cacheable(value = "productById", key = "#id")
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = findById(id);
        return mapToResponse(product);
    }

    @Cacheable(value = "productBySlug", key = "#slug")
    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        Product product = productRepository.findActiveBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "slug", slug));
        return mapToResponse(product);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> searchProducts(
            String keyword, Long categoryId,
            BigDecimal minPrice, BigDecimal maxPrice,
            int page, int size, String sortBy, String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<ProductResponse> result = productRepository
                .filterProducts(categoryId, minPrice, maxPrice, keyword, pageable)
                .map(this::mapToResponse);
        return PagedResponse.from(result);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ProductResponse> getProductsByCategory(
            Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ProductResponse> result = productRepository
                .findByCategoryIdAndIsActiveTrue(categoryId, pageable)
                .map(this::mapToResponse);
        return PagedResponse.from(result);
    }

    @Transactional
    @CacheEvict(value = {"products", "productById", "productBySlug"}, allEntries = true)
    public ProductResponse createProduct(ProductRequest request, List<MultipartFile> images) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        String slug = SlugUtil.toSlug(request.getName());
        if (productRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Product product = Product.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .stockQty(request.getStockQty())
                .brand(request.getBrand())
                .category(category)
                .isActive(true)
                .avgRating(0.0)
                .totalReviews(0)
                .build();

        if (product.getImages() == null) {
            product.setImages(new java.util.ArrayList<>());
        }

        product = productRepository.save(product);

        // Upload and attach images
        if (images != null && !images.isEmpty()) {
            boolean first = true;
            for (MultipartFile img : images) {
                if (img != null && !img.isEmpty()) {
                    String url = fileUploadService.uploadImage(img, "products");
                    ProductImage productImage = ProductImage.builder()
                            .product(product)
                            .imageUrl(url)
                            .isPrimary(first)
                            .sortOrder(product.getImages().size())
                            .build();
                    product.getImages().add(productImage);
                    first = false;
                }
            }
            product = productRepository.save(product);
        }

        log.info("Product created: {} (id={})", product.getName(), product.getId());
        return mapToResponse(product);
    }

    @Transactional
    @CacheEvict(value = {"products", "productById", "productBySlug"}, allEntries = true)
    public ProductResponse updateProduct(Long id, ProductRequest request, List<MultipartFile> newImages) {
        Product product = findById(id);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountPrice(request.getDiscountPrice());
        product.setStockQty(request.getStockQty());
        product.setBrand(request.getBrand());
        product.setCategory(category);

        if (newImages != null && !newImages.isEmpty()) {
            if (product.getImages() == null) {
                product.setImages(new java.util.ArrayList<>());
            }
            for (MultipartFile img : newImages) {
                if (img != null && !img.isEmpty()) {
                    String url = fileUploadService.uploadImage(img, "products");
                    ProductImage productImage = ProductImage.builder()
                            .product(product)
                            .imageUrl(url)
                            .isPrimary(product.getImages().isEmpty())
                            .sortOrder(product.getImages().size())
                            .build();
                    product.getImages().add(productImage);
                }
            }
        }

        return mapToResponse(productRepository.save(product));
    }

    @Transactional
    @CacheEvict(value = {"products", "productById", "productBySlug"}, allEntries = true)
    public void deleteProduct(Long id) {
        Product product = findById(id);
        product.setActive(false); // soft delete
        productRepository.save(product);
        log.info("Product soft-deleted: {}", id);
    }

    @Transactional
    @CacheEvict(value = {"products", "productById", "productBySlug"}, allEntries = true)
    public void updateStock(Long id, int quantity) {
        findById(id); // validate existence
        productRepository.increaseStock(id, quantity);
        log.info("Stock updated for product {}: +{}", id, quantity);
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
    }

    public ProductResponse mapToResponse(Product p) {
        if (p.getImages() == null) {
            p.setImages(new java.util.ArrayList<>());
        }

        List<ProductImageResponse> images = p.getImages() == null ? List.of() :
                p.getImages().stream()
                        .map(img -> ProductImageResponse.builder()
                                .id(img.getId())
                                .imageUrl(img.getImageUrl())
                                .isPrimary(img.isPrimary())
                                .sortOrder(img.getSortOrder())
                                .build())
                        .collect(Collectors.toList());

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .slug(p.getSlug())
                .description(p.getDescription())
                .price(p.getPrice())
                .discountPrice(p.getDiscountPrice())
                .stockQty(p.getStockQty())
                .brand(p.getBrand())
                .avgRating(p.getAvgRating())
                .totalReviews(p.getTotalReviews())
                .isActive(p.isActive())
                .category(p.getCategory() != null
                        ? categoryService.mapToResponse(p.getCategory()) : null)
                .images(images)
                .createdAt(p.getCreatedAt())
                .build();
    }
}

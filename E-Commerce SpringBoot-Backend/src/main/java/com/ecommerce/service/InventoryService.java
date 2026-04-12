package com.ecommerce.service;

import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final ProductRepository productRepository;
    private final ProductService productService;

    private static final int LOW_STOCK_THRESHOLD = 5;

    @Transactional
    public ProductResponse restockProduct(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        productRepository.increaseStock(productId, quantity);
        log.info("Restocked product {} by {}", productId, quantity);
        // Reload fresh
        return productService.mapToResponse(productRepository.findById(productId).get());
    }

    @Transactional
    public ProductResponse setStock(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
        product.setStockQty(quantity);
        return productService.mapToResponse(productRepository.save(product));
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts(LOW_STOCK_THRESHOLD)
                .stream()
                .map(productService::mapToResponse)
                .collect(Collectors.toList());
    }

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void checkLowStockAlert() {
        List<Product> lowStockProducts =
                productRepository.findLowStockProducts(LOW_STOCK_THRESHOLD);
        if (!lowStockProducts.isEmpty()) {
            log.warn("LOW STOCK ALERT: {} products below threshold of {}",
                    lowStockProducts.size(), LOW_STOCK_THRESHOLD);
            lowStockProducts.forEach(p ->
                log.warn("  - {} (id={}) has only {} units left",
                    p.getName(), p.getId(), p.getStockQty()));
        }
    }
}

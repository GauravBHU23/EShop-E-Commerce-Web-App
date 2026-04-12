package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByIsActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndIsActiveTrue(Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
           "AND (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> filterProducts(
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.stockQty <= :threshold AND p.isActive = true")
    List<Product> findLowStockProducts(@Param("threshold") int threshold);

    @Modifying
    @Query("UPDATE Product p SET p.stockQty = p.stockQty - :qty WHERE p.id = :id AND p.stockQty >= :qty")
    int decreaseStock(@Param("id") Long id, @Param("qty") int qty);

    @Modifying
    @Query("UPDATE Product p SET p.stockQty = p.stockQty + :qty WHERE p.id = :id")
    void increaseStock(@Param("id") Long id, @Param("qty") int qty);

    @Query("SELECT p FROM Product p ORDER BY p.totalReviews DESC, p.avgRating DESC")
    List<Product> findTopSellingProducts(Pageable pageable);

    boolean existsBySlug(String slug);

    @Query("SELECT p FROM Product p WHERE LOWER(p.slug) = LOWER(:slug) AND p.isActive = true")
    Optional<Product> findActiveBySlug(@Param("slug") String slug);
}

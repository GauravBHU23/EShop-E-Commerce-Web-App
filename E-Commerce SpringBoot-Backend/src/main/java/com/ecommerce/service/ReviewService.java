package com.ecommerce.service;

import com.ecommerce.dto.request.ReviewRequest;
import com.ecommerce.dto.response.*;
import com.ecommerce.entity.*;
import com.ecommerce.exception.*;
import com.ecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    public PagedResponse<ReviewResponse> getProductReviews(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ReviewResponse> result = reviewRepository.findByProductId(productId, pageable)
                .map(this::mapToResponse);
        return PagedResponse.from(result);
    }

    @Transactional
    public ReviewResponse addReview(String email, Long productId, ReviewRequest request) {
        User user = userService.findUserByEmail(email);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (reviewRepository.existsByProductIdAndUserId(productId, user.getId())) {
            throw new DuplicateResourceException("You have already reviewed this product");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        review = reviewRepository.save(review);
        updateProductRating(product);

        return mapToResponse(review);
    }

    @Transactional
    public ReviewResponse updateReview(String email, Long reviewId, ReviewRequest request) {
        User user = userService.findUserByEmail(email);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only edit your own reviews");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review = reviewRepository.save(review);
        updateProductRating(review.getProduct());
        return mapToResponse(review);
    }

    @Transactional
    public void deleteReview(String email, Long reviewId) {
        User user = userService.findUserByEmail(email);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You can only delete your own reviews");
        }

        Product product = review.getProduct();
        reviewRepository.delete(review);
        updateProductRating(product);
    }

    private void updateProductRating(Product product) {
        Double avg = reviewRepository.getAverageRating(product.getId());
        Long count = reviewRepository.getReviewCount(product.getId());
        product.setAvgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        product.setTotalReviews(count != null ? count.intValue() : 0);
        productRepository.save(product);
    }

    private ReviewResponse mapToResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .isVerifiedPurchase(r.isVerifiedPurchase())
                .createdAt(r.getCreatedAt())
                .build();
    }
}

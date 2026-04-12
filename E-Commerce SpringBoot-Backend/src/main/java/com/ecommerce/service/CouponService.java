package com.ecommerce.service;

import com.ecommerce.dto.request.CouponRequest;
import com.ecommerce.dto.response.CouponResponse;
import com.ecommerce.entity.Coupon;
import com.ecommerce.enums.DiscountType;
import com.ecommerce.exception.*;
import com.ecommerce.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    public BigDecimal validateAndCalculateDiscount(String code, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByCodeAndIsActiveTrue(code)
                .orElseThrow(() -> new BadRequestException("Invalid or expired coupon code"));

        if (coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Coupon has expired");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new BadRequestException("Coupon usage limit reached");
        }
        if (coupon.getMinOrderAmount() != null
                && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new BadRequestException(
                "Minimum order amount for this coupon is ₹" + coupon.getMinOrderAmount());
        }

        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = orderAmount.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountAmount() != null) {
                discount = discount.min(coupon.getMaxDiscountAmount());
            }
        } else {
            discount = coupon.getDiscountValue().min(orderAmount);
        }

        return discount;
    }

    @Transactional
    public void incrementUsage(String code) {
        couponRepository.findByCodeAndIsActiveTrue(code).ifPresent(coupon -> {
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        });
    }

    @Transactional
    public CouponResponse createCoupon(CouponRequest request) {
        if (couponRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Coupon code already exists: " + request.getCode());
        }
        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .description(request.getDescription())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minOrderAmount(request.getMinOrderAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .usageLimit(request.getUsageLimit())
                .expiryDate(request.getExpiryDate())
                .isActive(true)
                .usedCount(0)
                .build();
        return mapToResponse(couponRepository.save(coupon));
    }

    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void toggleCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        coupon.setActive(!coupon.isActive());
        couponRepository.save(coupon);
    }

    private CouponResponse mapToResponse(Coupon c) {
        return CouponResponse.builder()
                .id(c.getId()).code(c.getCode()).description(c.getDescription())
                .discountType(c.getDiscountType()).discountValue(c.getDiscountValue())
                .minOrderAmount(c.getMinOrderAmount()).maxDiscountAmount(c.getMaxDiscountAmount())
                .usageLimit(c.getUsageLimit()).usedCount(c.getUsedCount())
                .expiryDate(c.getExpiryDate()).isActive(c.isActive())
                .build();
    }
}

package com.ecommerce.controller;

import com.ecommerce.dto.request.OrderRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.PaymentInitiationResponse;
import com.ecommerce.dto.response.PaymentVerificationResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.service.InstamojoPaymentService;
import com.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment integration APIs")
public class PaymentController {

    private final OrderService orderService;
    private final InstamojoPaymentService instamojoPaymentService;

    @PostMapping("/instamojo/start")
    public ResponseEntity<ApiResponse<PaymentInitiationResponse>> startInstamojoPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody OrderRequest request) {
        Order order = orderService.createPendingOnlineOrder(userDetails.getUsername(), request);
        PaymentInitiationResponse response = instamojoPaymentService.createPaymentRequest(order);
        return ResponseEntity.ok(ApiResponse.success("Instamojo payment initialized", response));
    }

    @GetMapping("/instamojo/verify")
    public ResponseEntity<ApiResponse<PaymentVerificationResponse>> verifyInstamojoPayment(
            @RequestParam("payment_request_id") String paymentRequestId,
            @RequestParam("payment_id") String paymentId) {
        PaymentVerificationResponse response = instamojoPaymentService.verifyPayment(paymentRequestId, paymentId);
        return ResponseEntity.ok(ApiResponse.success("Instamojo payment verified", response));
    }

    @PostMapping(
            value = "/instamojo/webhook",
            consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE
    )
    public ResponseEntity<ApiResponse<Void>> handleInstamojoWebhook(@RequestParam Map<String, String> payload) {
        instamojoPaymentService.handleWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success("Webhook processed"));
    }
}

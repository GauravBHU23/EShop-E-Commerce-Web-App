package com.ecommerce.service;

import com.ecommerce.dto.response.PaymentInitiationResponse;
import com.ecommerce.dto.response.PaymentVerificationResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.OrderItem;
import com.ecommerce.entity.Payment;
import com.ecommerce.entity.User;
import com.ecommerce.enums.OrderStatus;
import com.ecommerce.enums.PaymentStatus;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstamojoPaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final ProductService productService;
    private final CouponService couponService;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;
    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${app.payment.instamojo.base-url:https://www.instamojo.com/api/1.1}")
    private String instamojoBaseUrl;

    @Value("${app.payment.instamojo.api-key:}")
    private String apiKey;

    @Value("${app.payment.instamojo.auth-token:}")
    private String authToken;

    @Value("${app.payment.instamojo.salt:}")
    private String salt;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    private RestTemplate restTemplate() {
        return restTemplateBuilder.build();
    }

    @Transactional
    public PaymentInitiationResponse createPaymentRequest(Order order) {
        ensureCredentialsConfigured();

        User user = order.getUser();
        Payment payment = order.getPayment();
        if (payment == null) {
            throw new BadRequestException("Payment record not initialized for this order.");
        }

        MultiValueMap<String, String> requestBody = new LinkedMultiValueMap<>();
        requestBody.add("purpose", order.getOrderNumber());
        requestBody.add("amount", order.getTotalAmount().setScale(2, RoundingMode.HALF_UP).toPlainString());
        requestBody.add("buyer_name", order.getShippingName());
        requestBody.add("email", user.getEmail());
        requestBody.add("phone", order.getShippingPhone());
        requestBody.add("redirect_url", frontendUrl + "/payment/success");
        requestBody.add("webhook", backendUrl + "/api/payments/instamojo/webhook");
        requestBody.add("send_email", "false");
        requestBody.add("send_sms", "false");
        requestBody.add("allow_repeated_payments", "false");

        HttpHeaders headers = buildAuthHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response;
        try {
            response = restTemplate().postForEntity(
                    instamojoBaseUrl + "/payment-requests/",
                    entity,
                    String.class
            );
        } catch (RestClientResponseException ex) {
            log.error("Instamojo create payment request failed: status={}, body={}",
                    ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new BadRequestException("Instamojo rejected the payment request. Please check API credentials, account activation, and redirect URL.");
        } catch (ResourceAccessException ex) {
            log.error("Instamojo is not reachable", ex);
            throw new BadRequestException("Unable to reach Instamojo right now. Please try again later.");
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode paymentRequest = root.path("payment_request");
            String requestId = paymentRequest.path("id").asText(null);
            String paymentUrl = paymentRequest.path("longurl").asText(null);

            if (!root.path("success").asBoolean(false) || requestId == null || paymentUrl == null) {
                throw new BadRequestException("Unable to create Instamojo payment request.");
            }

            payment.setProviderName("INSTAMOJO");
            payment.setProviderRequestId(requestId);
            payment.setProviderPaymentUrl(paymentUrl);
            payment.setGatewayResponse(response.getBody());
            paymentRepository.save(payment);

            return PaymentInitiationResponse.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .paymentRequestId(requestId)
                    .paymentUrl(paymentUrl)
                    .paymentStatus(payment.getStatus())
                    .build();
        } catch (Exception ex) {
            log.error("Failed to parse Instamojo create request response", ex);
            throw new BadRequestException("Unable to initialize online payment.");
        }
    }

    @Transactional
    public PaymentVerificationResponse verifyPayment(String paymentRequestId, String paymentId) {
        ensureCredentialsConfigured();

        Payment payment = paymentRepository.findByProviderRequestId(paymentRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment request", "id", paymentRequestId));

        Order order = payment.getOrder();
        String responseBody = fetchPaymentDetails(paymentRequestId, paymentId);

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode paymentNode = root.path("payment");
            String paymentStatus = paymentNode.path("status").asText("");
            boolean success = "Credit".equalsIgnoreCase(paymentStatus);

            payment.setTransactionId(paymentId);
            payment.setGatewayResponse(responseBody);

            if (success) {
                if (payment.getStatus() != PaymentStatus.SUCCESS) {
                    payment.setStatus(PaymentStatus.SUCCESS);
                    payment.setPaidAt(LocalDateTime.now());
                    finalizeSuccessfulPayment(order);
                }
            } else if (payment.getStatus() != PaymentStatus.SUCCESS) {
                payment.setStatus(PaymentStatus.FAILED);
                markOrderFailed(order);
            }

            paymentRepository.save(payment);
            orderRepository.save(order);

            return PaymentVerificationResponse.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .paymentRequestId(paymentRequestId)
                    .paymentId(paymentId)
                    .paymentStatus(payment.getStatus())
                    .orderStatus(order.getStatus())
                    .verified(success)
                    .build();
        } catch (Exception ex) {
            log.error("Failed to verify Instamojo payment", ex);
            throw new BadRequestException("Unable to verify payment status.");
        }
    }

    @Transactional
    public void handleWebhook(Map<String, String> payload) {
        String mac = payload.get("mac");
        if (mac == null || !isValidWebhook(payload, mac)) {
            throw new BadRequestException("Invalid Instamojo webhook signature.");
        }

        String paymentRequestId = payload.get("payment_request_id");
        String paymentId = payload.get("payment_id");
        if (paymentRequestId == null || paymentId == null) {
            throw new BadRequestException("Missing payment identifiers in webhook.");
        }

        verifyPayment(paymentRequestId, paymentId);
    }

    private String fetchPaymentDetails(String paymentRequestId, String paymentId) {
        HttpHeaders headers = buildAuthHeaders();
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response;
        try {
            response = restTemplate().exchange(
                    instamojoBaseUrl + "/payment-requests/" + paymentRequestId + "/" + paymentId + "/",
                    HttpMethod.GET,
                    entity,
                    String.class
            );
        } catch (RestClientResponseException ex) {
            log.error("Instamojo verify payment failed: status={}, body={}",
                    ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new BadRequestException("Instamojo could not verify this payment.");
        } catch (ResourceAccessException ex) {
            log.error("Instamojo verification endpoint is not reachable", ex);
            throw new BadRequestException("Unable to verify payment because Instamojo is unreachable.");
        }

        return response.getBody();
    }

    private HttpHeaders buildAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);
        headers.set("X-Auth-Token", authToken);
        return headers;
    }

    private void ensureCredentialsConfigured() {
        if (apiKey == null || apiKey.isBlank() || authToken == null || authToken.isBlank()) {
            throw new BadRequestException("Instamojo credentials are not configured on the backend.");
        }
    }

    private void finalizeSuccessfulPayment(Order order) {
        if (order.getCouponCode() != null && !order.getCouponCode().isBlank()) {
            couponService.incrementUsage(order.getCouponCode());
        }

        cartService.clearCart(cartService.getOrCreateCart(order.getUser()));
        emailService.sendOrderPlacedEmail(order.getUser(), order);
    }

    private void markOrderFailed(Order order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }

        for (OrderItem item : order.getItems()) {
            productService.updateStock(item.getProduct().getId(), item.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
    }

    private boolean isValidWebhook(Map<String, String> payload, String mac) {
        if (salt == null || salt.isBlank()) {
            return false;
        }

        Map<String, String> sorted = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        sorted.putAll(payload);
        sorted.remove("mac");

        String signedPayload = String.join("|", sorted.values());
        String calculated = org.springframework.util.DigestUtils.appendMd5DigestAsHex(
                (signedPayload + salt).getBytes(StandardCharsets.UTF_8),
                new StringBuilder()
        ).toString();

        return calculated.equalsIgnoreCase(mac);
    }
}

package com.ecommerce.service;

import com.ecommerce.entity.Order;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Async
    public void sendRegistrationEmail(User user) {
        try {
            Context context = new Context();
            context.setVariable("name", user.getName());
            context.setVariable("email", user.getEmail());
            context.setVariable("loginLink", frontendUrl + "/auth/login");

            String html = templateEngine.process("email/registration-modern", context);
            sendEmail(user.getEmail(), "Welcome to EShop!", html);
        } catch (Exception e) {
            log.error("Failed to send registration email to {}", user.getEmail(), e);
        }
    }

    @Async
    public void sendOrderPlacedEmail(User user, Order order) {
        try {
            Context context = new Context();
            context.setVariable("name", user.getName());
            context.setVariable("orderNumber", order.getOrderNumber());
            context.setVariable("totalAmount", order.getTotalAmount());
            context.setVariable("items", order.getItems());
            context.setVariable("shippingAddress",
                order.getShippingStreet() + ", " + order.getShippingCity());

            String html = templateEngine.process("email/order-placed-modern", context);
            sendEmail(user.getEmail(),
                "Order Confirmed - #" + order.getOrderNumber(), html);
        } catch (Exception e) {
            log.error("Failed to send order email to {}", user.getEmail(), e);
        }
    }

    @Async
    public void sendOrderStatusUpdateEmail(User user, Order order) {
        try {
            Context context = new Context();
            context.setVariable("name", user.getName());
            context.setVariable("orderNumber", order.getOrderNumber());
            context.setVariable("status", order.getStatus().name());

            String html = templateEngine.process("email/order-status-modern", context);
            sendEmail(user.getEmail(),
                "Order Update - #" + order.getOrderNumber(), html);
        } catch (Exception e) {
            log.error("Failed to send status email", e);
        }
    }

    @Async
    public void sendForgotPasswordEmail(User user, String resetToken) {
        try {
            String resetLink = frontendUrl + "/auth/reset-password?token=" + resetToken;

            Context context = new Context();
            context.setVariable("name", user.getName());
            context.setVariable("resetLink", resetLink);

            String html = templateEngine.process("email/reset-password-modern", context);
            sendEmail(user.getEmail(), "Reset Your Password", html);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}", user.getEmail(), e);
            throw new BadRequestException("Reset email could not be sent. Please verify Gmail SMTP credentials and app password.");
        }
    }

    public void sendEmailVerificationOtp(User user, String otp) {
        try {
            Context context = new Context();
            context.setVariable("name", user.getName());
            context.setVariable("otp", otp);
            context.setVariable("validMinutes", 10);

            String html = templateEngine.process("email/verify-email-otp-modern", context);
            sendEmail(user.getEmail(), "Verify your EShop email", html);
        } catch (Exception e) {
            log.error("Failed to send email verification OTP to {}", user.getEmail(), e);
            throw new BadRequestException("Verification OTP could not be sent. Please verify mail credentials and try again.");
        }
    }

    @Async
    public void sendEmailVerifiedConfirmation(User user) {
        sendAccountEventEmail(
                user,
                "Email verified successfully",
                "Your email address has been verified successfully.",
                "Your account is now marked as verified and trusted for important account actions."
        );
    }

    @Async
    public void sendProfileUpdatedEmail(User user) {
        sendAccountEventEmail(
                user,
                "Profile updated",
                "Your profile details were updated successfully.",
                "If you did not make this change, please sign in and secure your account immediately."
        );
    }

    @Async
    public void sendPasswordChangedEmail(User user) {
        sendAccountEventEmail(
                user,
                "Password changed",
                "Your account password has been changed successfully.",
                "If this was not you, reset your password immediately and review your recent account activity."
        );
    }

    @Async
    public void sendPasswordResetSuccessEmail(User user) {
        sendAccountEventEmail(
                user,
                "Password reset successful",
                "Your password was reset successfully using the password recovery flow.",
                "If you did not perform this reset, please contact support and secure your email account as well."
        );
    }

    @Async
    public void sendAccountStatusChangedEmail(User user, boolean active) {
        sendAccountEventEmail(
                user,
                active ? "Account enabled" : "Account disabled",
                active
                        ? "Your account has been enabled by the admin team."
                        : "Your account has been disabled by the admin team.",
                active
                        ? "You can sign in again and continue using your account."
                        : "If you believe this change was made by mistake, please contact the store administrator."
        );
    }

    private void sendAccountEventEmail(User user, String subject, String headline, String description) {
        try {
            Context context = new Context();
            context.setVariable("name", user.getName());
            context.setVariable("headline", headline);
            context.setVariable("description", description);
            context.setVariable("accountLink", frontendUrl + "/profile");

            String html = templateEngine.process("email/account-event-modern", context);
            sendEmail(user.getEmail(), subject + " - EShop", html);
        } catch (Exception e) {
            log.error("Failed to send account event email to {}", user.getEmail(), e);
        }
    }

    private void sendEmail(String to, String subject, String htmlBody)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
        log.info("Email sent to {} with subject: {}", to, subject);
    }
}

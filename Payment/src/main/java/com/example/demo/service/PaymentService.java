//package com.example.demo.service;
//
//import com.example.demo.dto.CreateRazorpayOrderRequest;
//import com.example.demo.dto.CreateRazorpayOrderResponse;
//import com.example.demo.dto.VerifyPaymentRequest;
//import com.example.demo.dto.VerifyPaymentResponse;
//import com.example.demo.entity.Payment;
//import com.example.demo.feign.BookingClient;
//import com.example.demo.feign.DealerClient;
//import com.example.demo.repository.PaymentRepository;
//import com.razorpay.Order;
//import com.razorpay.RazorpayClient;
//import lombok.RequiredArgsConstructor;
//import org.json.JSONObject;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import javax.crypto.Mac;
//import javax.crypto.spec.SecretKeySpec;
//import java.math.BigDecimal;
//import java.math.RoundingMode;
//import java.nio.charset.StandardCharsets;
//import java.time.LocalDateTime;
//
//@Service
//@RequiredArgsConstructor
//@Transactional
//public class PaymentService {
//
//    private static final String MOCK_KEY_ID = "mock_key";
//    private static final String MOCK_ORDER_PREFIX = "mock_order_";
//    private static final String MOCK_PAYMENT_PREFIX = "mock_payment_";
//    private static final String MOCK_SIGNATURE = "mock_signature";
//
//    private final PaymentRepository paymentRepository;
//    private final BookingClient bookingClient;
//    private final DealerClient dealerClient;
//
//    @Value("${razorpay.keyId:}")
//    private String keyId;
//
//    @Value("${razorpay.keySecret:}")
//    private String keySecret;
//
//    @Value("${payment.currency:INR}")
//    private String currency;
//
//    @Value("${payment.mock-fallback:true}")
//    private boolean mockFallbackEnabled;
//
//    @Value("${payment.max-amount-in-paise:1000000000}")
//    private long maxAmountInPaise;
//
//    @Value("${payment.razorpay-order-cap-in-paise:2999900}")
//    private long razorpayOrderCapInPaise;
//
//    public CreateRazorpayOrderResponse createRazorpayOrder(CreateRazorpayOrderRequest req) {
//        if (req == null || req.getBookingId() == null || req.getCustomerId() == null) {
//            throw new RuntimeException("bookingId and customerId are required");
//        }
//
//        var booking = bookingClient.getBookingById(req.getBookingId());
//        if (booking == null || booking.id == null) {
//            throw new RuntimeException("Booking not found: " + req.getBookingId());
//        }
//
//        if (booking.customerId == null || !booking.customerId.equals(req.getCustomerId())) {
//            throw new RuntimeException("This booking does not belong to this customer");
//        }
//
//        if ("PAID".equalsIgnoreCase(booking.paymentStatus)) {
//            throw new RuntimeException("Booking already paid");
//        }
//
//        if (!"ACCEPTED".equalsIgnoreCase(booking.bookingStatus)) {
//            throw new RuntimeException("Booking not approved by dealer yet");
//        }
//
//        if (booking.amount == null || booking.amount <= 0) {
//            throw new RuntimeException("Invalid booking amount");
//        }
//
//        long amountInPaise = toPaiseSafe(booking.amount);
//        long checkoutAmountInPaise = resolveCheckoutAmountInPaise(amountInPaise);
//
//        String cleanKeyId = keyId == null ? "" : keyId.trim();
//        String cleanKeySecret = keySecret == null ? "" : keySecret.trim();
//        String cleanCurrency = (currency == null || currency.isBlank()) ? "INR" : currency.trim();
//
//        if (cleanKeyId.isBlank() || cleanKeySecret.isBlank()) {
//            if (mockFallbackEnabled) {
//                return createMockOrder(
//                        booking.id,
//                        booking.customerId,
//                        booking.amount,
//                        checkoutAmountInPaise,
//                        "Razorpay keys are not configured. Using local payment mode."
//                );
//            }
//            throw new RuntimeException("Razorpay keys are not configured");
//        }
//
//        JSONObject orderRequest = new JSONObject();
//        orderRequest.put("amount", checkoutAmountInPaise);
//        orderRequest.put("currency", cleanCurrency);
//        orderRequest.put("receipt", "booking_" + booking.id);
//
//        final String razorpayOrderId;
//
//        try {
//            RazorpayClient razorpayClient = new RazorpayClient(cleanKeyId, cleanKeySecret);
//            Order order = razorpayClient.orders.create(orderRequest);
//            razorpayOrderId = order.get("id").toString();
//        } catch (Exception e) {
//            e.printStackTrace();
//
//            if (mockFallbackEnabled) {
//                return createMockOrder(
//                        booking.id,
//                        booking.customerId,
//                        booking.amount,
//                        checkoutAmountInPaise,
//                        "Razorpay order creation failed. Using local payment mode. Reason: " + e.getMessage()
//                );
//            }
//
//            throw new RuntimeException("Razorpay order creation failed: " + e.getMessage(), e);
//        }
//
//        Payment payment = Payment.builder()
//                .bookingId(booking.id)
//                .customerId(booking.customerId)
//                .amount(booking.amount)
//                .razorpayOrderId(razorpayOrderId)
//                .paymentStatus("CREATED")
//                .createdAt(LocalDateTime.now())
//                .build();
//
//        paymentRepository.save(payment);
//
//        return CreateRazorpayOrderResponse.builder()
//                .keyId(cleanKeyId)
//                .currency(cleanCurrency)
//                .amountInPaise(checkoutAmountInPaise)
//                .razorpayOrderId(razorpayOrderId)
//                .mockMode(false)
//                .message(buildCheckoutMessage(amountInPaise, checkoutAmountInPaise))
//                .bookingId(booking.id)
//                .customerId(booking.customerId)
//                .build();
//    }
//
//    private CreateRazorpayOrderResponse createMockOrder(
//            Long bookingId,
//            Long customerId,
//            Double amount,
//            long amountInPaise,
//            String message
//    ) {
//        String mockOrderId = MOCK_ORDER_PREFIX + bookingId + "_" + System.currentTimeMillis();
//
//        Payment payment = Payment.builder()
//                .bookingId(bookingId)
//                .customerId(customerId)
//                .amount(amount)
//                .razorpayOrderId(mockOrderId)
//                .paymentStatus("CREATED")
//                .createdAt(LocalDateTime.now())
//                .build();
//
//        paymentRepository.save(payment);
//
//        return CreateRazorpayOrderResponse.builder()
//                .keyId(MOCK_KEY_ID)
//                .currency(currency)
//                .amountInPaise(amountInPaise)
//                .razorpayOrderId(mockOrderId)
//                .mockMode(true)
//                .message(message)
//                .bookingId(bookingId)
//                .customerId(customerId)
//                .build();
//    }
//
//    private long toPaiseSafe(Double amountRupees) {
//        if (amountRupees == null) {
//            throw new RuntimeException("Invalid booking amount");
//        }
//
//        long paise = BigDecimal.valueOf(amountRupees)
//                .setScale(2, RoundingMode.HALF_UP)
//                .movePointRight(2)
//                .setScale(0, RoundingMode.HALF_UP)
//                .longValueExact();
//
//        validateRazorpayAmount(paise);
//        return paise;
//    }
//
//    private void validateRazorpayAmount(long amountInPaise) {
//        if (amountInPaise <= 0) {
//            throw new RuntimeException("Invalid booking amount");
//        }
//        if (amountInPaise > maxAmountInPaise) {
//            throw new RuntimeException("Booking amount too large to pay online");
//        }
//    }
//
//    private long resolveCheckoutAmountInPaise(long bookingAmountInPaise) {
//        long configuredCap = razorpayOrderCapInPaise > 0 ? razorpayOrderCapInPaise : bookingAmountInPaise;
//        return Math.min(bookingAmountInPaise, configuredCap);
//    }
//
//    private String buildCheckoutMessage(long bookingAmountInPaise, long checkoutAmountInPaise) {
//        if (checkoutAmountInPaise < bookingAmountInPaise) {
//            return "Razorpay checkout amount was capped to the configured transaction limit.";
//        }
//        return "Razorpay order created successfully";
//    }
//
//    public VerifyPaymentResponse verifyPayment(VerifyPaymentRequest req) {
//        if (req == null
//                || req.getBookingId() == null
//                || req.getCustomerId() == null
//                || req.getRazorpayOrderId() == null
//                || req.getRazorpayPaymentId() == null
//                || req.getRazorpaySignature() == null) {
//            throw new RuntimeException("Invalid payment verification request");
//        }
//
//        Payment payment = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId())
//                .orElseThrow(() -> new RuntimeException("Payment order not found: " + req.getRazorpayOrderId()));
//
//        if (!payment.getBookingId().equals(req.getBookingId())
//                || !payment.getCustomerId().equals(req.getCustomerId())) {
//            throw new RuntimeException("Payment details do not match booking/customer");
//        }
//
//        boolean valid = isMockOrderId(req.getRazorpayOrderId())
//                ? isValidMockPayment(req)
//                : verifySignature(
//                        req.getRazorpayOrderId(),
//                        req.getRazorpayPaymentId(),
//                        req.getRazorpaySignature()
//                );
//
//        if (!valid) {
//            payment.setPaymentStatus("FAILED");
//            payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
//            payment.setRazorpaySignature(req.getRazorpaySignature());
//            payment.setPaymentDate(LocalDateTime.now());
//            paymentRepository.save(payment);
//
//            return VerifyPaymentResponse.builder()
//                    .status("FAILED")
//                    .message("Payment verification failed")
//                    .bookingId(payment.getBookingId())
//                    .transactionId(req.getRazorpayPaymentId())
//                    .build();
//        }
//
//        payment.setPaymentStatus("SUCCESS");
//        payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
//        payment.setRazorpaySignature(req.getRazorpaySignature());
//        payment.setTransactionId(req.getRazorpayPaymentId());
//        payment.setPaymentDate(LocalDateTime.now());
//        paymentRepository.save(payment);
//
//        bookingClient.confirmBooking(req.getBookingId());
//
//        try {
//            var booking = bookingClient.getBookingById(req.getBookingId());
//            if (booking != null && booking.dealerId != null) {
//                dealerClient.createNotification(
//                        booking.dealerId,
//                        new DealerClient.CreateNotificationRequest(
//                                "PAYMENT",
//                                "Payment received for Booking #" + booking.id + " (Rs." + booking.amount + ")"
//                        )
//                );
//            }
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//
//        return VerifyPaymentResponse.builder()
//                .status("SUCCESS")
//                .message(isMockOrderId(req.getRazorpayOrderId())
//                        ? "Payment completed in local payment mode"
//                        : "Payment verified and booking confirmed")
//                .bookingId(req.getBookingId())
//                .transactionId(req.getRazorpayPaymentId())
//                .build();
//    }
//
//    private boolean isMockOrderId(String orderId) {
//        return orderId != null && orderId.startsWith(MOCK_ORDER_PREFIX);
//    }
//
//    private boolean isValidMockPayment(VerifyPaymentRequest req) {
//        return req.getRazorpayOrderId() != null
//                && req.getRazorpayPaymentId() != null
//                && req.getRazorpayPaymentId().startsWith(MOCK_PAYMENT_PREFIX)
//                && MOCK_SIGNATURE.equals(req.getRazorpaySignature());
//    }
//
//    private boolean verifySignature(String orderId, String paymentId, String signature) {
//        try {
//            String cleanKeySecret = keySecret == null ? "" : keySecret.trim();
//            if (cleanKeySecret.isBlank()) {
//                return false;
//            }
//
//            String payload = orderId + "|" + paymentId;
//
//            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
//            SecretKeySpec secretKey = new SecretKeySpec(
//                    cleanKeySecret.getBytes(StandardCharsets.UTF_8),
//                    "HmacSHA256"
//            );
//            sha256Hmac.init(secretKey);
//
//            byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
//            String generatedSignature = bytesToHex(hash);
//
//            return generatedSignature.equals(signature);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return false;
//        }
//    }
//
//    private String bytesToHex(byte[] bytes) {
//        StringBuilder sb = new StringBuilder(bytes.length * 2);
//        for (byte b : bytes) {
//            sb.append(String.format("%02x", b));
//        }
//        return sb.toString();
//    }
//}


package com.example.demo.service;

import com.example.demo.dto.CreateRazorpayOrderRequest;
import com.example.demo.dto.CreateRazorpayOrderResponse;
import com.example.demo.dto.VerifyPaymentRequest;
import com.example.demo.dto.VerifyPaymentResponse;
import com.example.demo.entity.Payment;
import com.example.demo.feign.BookingClient;
import com.example.demo.feign.DealerClient;
import com.example.demo.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PaymentService {

    private static final String MOCK_KEY_ID = "mock_key";
    private static final String MOCK_ORDER_PREFIX = "mock_order_";
    private static final String MOCK_PAYMENT_PREFIX = "mock_payment_";
    private static final String MOCK_SIGNATURE = "mock_signature";

    private final PaymentRepository paymentRepository;
    private final BookingClient bookingClient;
    private final DealerClient dealerClient;

    @Value("${razorpay.keyId:}")
    private String keyId;

    @Value("${razorpay.keySecret:}")
    private String keySecret;

    @Value("${payment.currency:INR}")
    private String currency;

    @Value("${payment.mock-fallback:true}")
    private boolean mockFallbackEnabled;

    @Value("${payment.max-amount-in-paise:1000000000}")
    private long maxAmountInPaise;

    @Value("${payment.razorpay-order-cap-in-paise:10000}")
    private long razorpayOrderCapInPaise;

    public CreateRazorpayOrderResponse createRazorpayOrder(CreateRazorpayOrderRequest req) {
        if (req == null || req.getBookingId() == null || req.getCustomerId() == null) {
            throw new RuntimeException("bookingId and customerId are required");
        }

        var booking = bookingClient.getBookingById(req.getBookingId());
        if (booking == null || booking.id == null) {
            throw new RuntimeException("Booking not found: " + req.getBookingId());
        }

        if (booking.customerId == null || !booking.customerId.equals(req.getCustomerId())) {
            throw new RuntimeException("This booking does not belong to this customer");
        }

        if ("PAID".equalsIgnoreCase(booking.paymentStatus)) {
            throw new RuntimeException("Booking already paid");
        }

        if (!"ACCEPTED".equalsIgnoreCase(booking.bookingStatus)) {
            throw new RuntimeException("Booking not approved by dealer yet");
        }

        if (booking.amount == null || booking.amount <= 0) {
            throw new RuntimeException("Invalid booking amount");
        }

        long amountInPaise = toPaiseSafe(booking.amount);
        long checkoutAmountInPaise = resolveCheckoutAmountInPaise(amountInPaise);

        String cleanKeyId = keyId == null ? "" : keyId.trim();
        String cleanKeySecret = keySecret == null ? "" : keySecret.trim();
        String cleanCurrency = (currency == null || currency.isBlank()) ? "INR" : currency.trim();

        if (cleanKeyId.isBlank() || cleanKeySecret.isBlank()) {
            if (mockFallbackEnabled) {
                return createMockOrder(
                        booking.id,
                        booking.customerId,
                        booking.amount,
                        checkoutAmountInPaise,
                        "Razorpay keys are not configured. Using local payment mode."
                );
            }
            throw new RuntimeException("Razorpay keys are not configured");
        }

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", checkoutAmountInPaise);
        orderRequest.put("currency", cleanCurrency);
        orderRequest.put("receipt", "booking_" + booking.id);

        final String razorpayOrderId;

        try {
            RazorpayClient razorpayClient = new RazorpayClient(cleanKeyId, cleanKeySecret);
            Order order = razorpayClient.orders.create(orderRequest);
            razorpayOrderId = order.get("id").toString();
        } catch (Exception e) {
            log.warn("Razorpay order creation failed for bookingId={}", booking.id, e);

            if (mockFallbackEnabled) {
                return createMockOrder(
                        booking.id,
                        booking.customerId,
                        booking.amount,
                        checkoutAmountInPaise,
                        "Razorpay order creation failed. Using local payment mode. Reason: " + e.getMessage()
                );
            }

            throw new RuntimeException("Razorpay order creation failed: " + e.getMessage(), e);
        }

        Payment payment = Payment.builder()
                .bookingId(booking.id)
                .customerId(booking.customerId)
                .amount(booking.amount)
                .razorpayOrderId(razorpayOrderId)
                .paymentStatus("CREATED")
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return CreateRazorpayOrderResponse.builder()
                .keyId(cleanKeyId)
                .currency(cleanCurrency)
                .amountInPaise(checkoutAmountInPaise)
                .razorpayOrderId(razorpayOrderId)
                .mockMode(false)
                .message(buildCheckoutMessage(amountInPaise, checkoutAmountInPaise))
                .bookingId(booking.id)
                .customerId(booking.customerId)
                .build();
    }

    private CreateRazorpayOrderResponse createMockOrder(
            Long bookingId,
            Long customerId,
            Double amount,
            long amountInPaise,
            String message
    ) {
        String mockOrderId = MOCK_ORDER_PREFIX + bookingId + "_" + System.currentTimeMillis();

        Payment payment = Payment.builder()
                .bookingId(bookingId)
                .customerId(customerId)
                .amount(amount)
                .razorpayOrderId(mockOrderId)
                .paymentStatus("CREATED")
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return CreateRazorpayOrderResponse.builder()
                .keyId(MOCK_KEY_ID)
                .currency(currency)
                .amountInPaise(amountInPaise)
                .razorpayOrderId(mockOrderId)
                .mockMode(true)
                .message(message)
                .bookingId(bookingId)
                .customerId(customerId)
                .build();
    }

    private long toPaiseSafe(Double amountRupees) {
        if (amountRupees == null) {
            throw new RuntimeException("Invalid booking amount");
        }
        

        long paise = BigDecimal.valueOf(amountRupees)
                .setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();

        validateRazorpayAmount(paise);
        return paise;
    }

    private void validateRazorpayAmount(long amountInPaise) {
        if (amountInPaise <= 0) {
            throw new RuntimeException("Invalid booking amount");
        }
        if (amountInPaise > maxAmountInPaise) {
            throw new RuntimeException("Booking amount too large to pay online");
        }
    }

    private long resolveCheckoutAmountInPaise(long bookingAmountInPaise) {
        long configuredCap = razorpayOrderCapInPaise > 0 ? razorpayOrderCapInPaise : bookingAmountInPaise;
        return Math.min(bookingAmountInPaise, configuredCap);
    }

    private String buildCheckoutMessage(long bookingAmountInPaise, long checkoutAmountInPaise) {
        if (checkoutAmountInPaise < bookingAmountInPaise) {
            return "Razorpay checkout amount was capped to the configured transaction limit.";
        }
        return "Razorpay order created successfully";
    }

    public VerifyPaymentResponse verifyPayment(VerifyPaymentRequest req) {
        if (req == null
                || req.getBookingId() == null
                || req.getCustomerId() == null
                || req.getRazorpayOrderId() == null
                || req.getRazorpayPaymentId() == null
                || req.getRazorpaySignature() == null) {
            throw new RuntimeException("Invalid payment verification request");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId())
                .orElseThrow(() -> new RuntimeException("Payment order not found: " + req.getRazorpayOrderId()));

        if (!payment.getBookingId().equals(req.getBookingId())
                || !payment.getCustomerId().equals(req.getCustomerId())) {
            throw new RuntimeException("Payment details do not match booking/customer");
        }

        boolean valid = isMockOrderId(req.getRazorpayOrderId())
                ? isValidMockPayment(req)
                : verifySignature(
                        req.getRazorpayOrderId(),
                        req.getRazorpayPaymentId(),
                        req.getRazorpaySignature()
                );

        if (!valid) {
            payment.setPaymentStatus("FAILED");
            payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
            payment.setRazorpaySignature(req.getRazorpaySignature());
            payment.setPaymentDate(LocalDateTime.now());
            paymentRepository.save(payment);

            return VerifyPaymentResponse.builder()
                    .status("FAILED")
                    .message("Payment verification failed")
                    .bookingId(payment.getBookingId())
                    .transactionId(req.getRazorpayPaymentId())
                    .build();
        }

        payment.setPaymentStatus("SUCCESS");
        payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
        payment.setRazorpaySignature(req.getRazorpaySignature());
        payment.setTransactionId(req.getRazorpayPaymentId());
        payment.setPaymentDate(LocalDateTime.now());
        paymentRepository.save(payment);

        bookingClient.confirmBooking(req.getBookingId());

        try {
            var booking = bookingClient.getBookingById(req.getBookingId());
            if (booking != null && booking.dealerId != null) {
                dealerClient.createNotification(
                        booking.dealerId,
                        new DealerClient.CreateNotificationRequest(
                                "PAYMENT",
                                "Payment received for Booking #" + booking.id + " (Rs." + booking.amount + ")"
                        )
                );
            }
        } catch (Exception e) {
            log.warn("Dealer notification failed after payment verification for bookingId={}", req.getBookingId(), e);
        }

        return VerifyPaymentResponse.builder()
                .status("SUCCESS")
                .message(isMockOrderId(req.getRazorpayOrderId())
                        ? "Payment completed in local payment mode"
                        : "Payment verified and booking confirmed")
                .bookingId(req.getBookingId())
                .transactionId(req.getRazorpayPaymentId())
                .build();
    }

    private boolean isMockOrderId(String orderId) {
        return orderId != null && orderId.startsWith(MOCK_ORDER_PREFIX);
    }

    private boolean isValidMockPayment(VerifyPaymentRequest req) {
        return req.getRazorpayOrderId() != null
                && req.getRazorpayPaymentId() != null
                && req.getRazorpayPaymentId().startsWith(MOCK_PAYMENT_PREFIX)
                && MOCK_SIGNATURE.equals(req.getRazorpaySignature());
    }

    private boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            String cleanKeySecret = keySecret == null ? "" : keySecret.trim();
            if (cleanKeySecret.isBlank()) {
                return false;
            }

            String payload = orderId + "|" + paymentId;

            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(
                    cleanKeySecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            sha256Hmac.init(secretKey);

            byte[] hash = sha256Hmac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String generatedSignature = bytesToHex(hash);

            return generatedSignature.equals(signature);
        } catch (Exception e) {
            log.warn("Razorpay signature verification failed for orderId={}", orderId, e);
            return false;
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}

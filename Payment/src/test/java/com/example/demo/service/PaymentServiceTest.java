package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.demo.dto.CreateRazorpayOrderRequest;
import com.example.demo.dto.CreateRazorpayOrderResponse;
import com.example.demo.dto.VerifyPaymentRequest;
import com.example.demo.dto.VerifyPaymentResponse;
import com.example.demo.entity.Payment;
import com.example.demo.feign.BookingClient;
import com.example.demo.feign.DealerClient;
import com.example.demo.repository.PaymentRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingClient bookingClient;

    @Mock
    private DealerClient dealerClient;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(paymentService, "keyId", "");
        ReflectionTestUtils.setField(paymentService, "keySecret", "");
        ReflectionTestUtils.setField(paymentService, "currency", "INR");
        ReflectionTestUtils.setField(paymentService, "mockFallbackEnabled", true);
        ReflectionTestUtils.setField(paymentService, "maxAmountInPaise", 1_000_000_000L);
        ReflectionTestUtils.setField(paymentService, "razorpayOrderCapInPaise", 10_000L);
    }

    @Test
    void createRazorpayOrderShouldCreateMockOrderWhenKeysMissing() {
        CreateRazorpayOrderRequest request = new CreateRazorpayOrderRequest();
        request.setBookingId(11L);
        request.setCustomerId(22L);

        BookingClient.BookingDTO booking = booking(11L, 22L, 33L, 250.00, "ACCEPTED", "PENDING");
        when(bookingClient.getBookingById(11L)).thenReturn(booking);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateRazorpayOrderResponse result = paymentService.createRazorpayOrder(request);

        assertEquals(true, result.isMockMode());
        assertEquals("mock_key", result.getKeyId());
        assertEquals(10_000L, result.getAmountInPaise());
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void createRazorpayOrderShouldRejectWrongCustomer() {
        CreateRazorpayOrderRequest request = new CreateRazorpayOrderRequest();
        request.setBookingId(11L);
        request.setCustomerId(99L);

        when(bookingClient.getBookingById(11L))
                .thenReturn(booking(11L, 22L, 33L, 250.00, "ACCEPTED", "PENDING"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> paymentService.createRazorpayOrder(request));

        assertEquals("This booking does not belong to this customer", ex.getMessage());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void verifyPaymentShouldMarkMockPaymentSuccessfulAndConfirmBooking() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setBookingId(11L);
        request.setCustomerId(22L);
        request.setRazorpayOrderId("mock_order_11_123");
        request.setRazorpayPaymentId("mock_payment_999");
        request.setRazorpaySignature("mock_signature");

        Payment payment = Payment.builder()
                .bookingId(11L)
                .customerId(22L)
                .razorpayOrderId("mock_order_11_123")
                .paymentStatus("CREATED")
                .build();

        when(paymentRepository.findByRazorpayOrderId("mock_order_11_123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingClient.getBookingById(11L)).thenReturn(booking(11L, 22L, 33L, 250.00, "ACCEPTED", "PENDING"));

        VerifyPaymentResponse result = paymentService.verifyPayment(request);

        assertEquals("SUCCESS", result.getStatus());
        verify(bookingClient).confirmBooking(11L);
        verify(dealerClient).createNotification(any(), any());
    }

    @Test
    void verifyPaymentShouldReturnFailedForInvalidMockSignature() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setBookingId(11L);
        request.setCustomerId(22L);
        request.setRazorpayOrderId("mock_order_11_123");
        request.setRazorpayPaymentId("mock_payment_999");
        request.setRazorpaySignature("wrong_signature");

        Payment payment = Payment.builder()
                .bookingId(11L)
                .customerId(22L)
                .razorpayOrderId("mock_order_11_123")
                .paymentStatus("CREATED")
                .build();

        when(paymentRepository.findByRazorpayOrderId("mock_order_11_123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VerifyPaymentResponse result = paymentService.verifyPayment(request);

        assertEquals("FAILED", result.getStatus());
        verify(bookingClient, never()).confirmBooking(any());
        verify(dealerClient, never()).createNotification(any(), any());
    }

    @Test
    void verifyPaymentShouldRejectCustomerMismatch() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setBookingId(11L);
        request.setCustomerId(22L);
        request.setRazorpayOrderId("mock_order_11_123");
        request.setRazorpayPaymentId("mock_payment_999");
        request.setRazorpaySignature("mock_signature");

        Payment payment = Payment.builder()
                .bookingId(11L)
                .customerId(44L)
                .razorpayOrderId("mock_order_11_123")
                .build();

        when(paymentRepository.findByRazorpayOrderId("mock_order_11_123")).thenReturn(Optional.of(payment));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> paymentService.verifyPayment(request));

        assertEquals("Payment details do not match booking/customer", ex.getMessage());
    }

    @Test
    void verifyPaymentShouldPersistSuccessTransactionId() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setBookingId(11L);
        request.setCustomerId(22L);
        request.setRazorpayOrderId("mock_order_11_123");
        request.setRazorpayPaymentId("mock_payment_999");
        request.setRazorpaySignature("mock_signature");

        Payment payment = Payment.builder()
                .bookingId(11L)
                .customerId(22L)
                .razorpayOrderId("mock_order_11_123")
                .paymentStatus("CREATED")
                .build();

        when(paymentRepository.findByRazorpayOrderId("mock_order_11_123")).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingClient.getBookingById(11L)).thenReturn(booking(11L, 22L, 33L, 250.00, "ACCEPTED", "PENDING"));

        paymentService.verifyPayment(request);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        assertEquals("SUCCESS", captor.getValue().getPaymentStatus());
        assertEquals("mock_payment_999", captor.getValue().getTransactionId());
    }

    private BookingClient.BookingDTO booking(Long id, Long customerId, Long dealerId,
            Double amount, String bookingStatus, String paymentStatus) {
        BookingClient.BookingDTO booking = new BookingClient.BookingDTO();
        booking.id = id;
        booking.customerId = customerId;
        booking.dealerId = dealerId;
        booking.amount = amount;
        booking.bookingStatus = bookingStatus;
        booking.paymentStatus = paymentStatus;
        return booking;
    }
}

package com.example.demo.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.demo.dto.CreateRazorpayOrderRequest;
import com.example.demo.dto.CreateRazorpayOrderResponse;
import com.example.demo.dto.VerifyPaymentRequest;
import com.example.demo.dto.VerifyPaymentResponse;
import com.example.demo.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentController controller;

    @Test
    void createOrderShouldDelegateToService() {
        CreateRazorpayOrderRequest request = new CreateRazorpayOrderRequest();
        request.setBookingId(1L);
        request.setCustomerId(2L);

        CreateRazorpayOrderResponse response = CreateRazorpayOrderResponse.builder()
                .bookingId(1L)
                .customerId(2L)
                .razorpayOrderId("mock_order_1")
                .build();
        when(paymentService.createRazorpayOrder(request)).thenReturn(response);

        CreateRazorpayOrderResponse result = controller.createOrder(request);

        assertEquals("mock_order_1", result.getRazorpayOrderId());
        verify(paymentService).createRazorpayOrder(request);
    }

    @Test
    void verifyShouldDelegateToService() {
        VerifyPaymentRequest request = new VerifyPaymentRequest();
        request.setBookingId(1L);
        request.setCustomerId(2L);
        request.setRazorpayOrderId("mock_order_1");
        request.setRazorpayPaymentId("mock_payment_1");
        request.setRazorpaySignature("mock_signature");

        VerifyPaymentResponse response = VerifyPaymentResponse.builder()
                .status("SUCCESS")
                .transactionId("mock_payment_1")
                .build();
        when(paymentService.verifyPayment(request)).thenReturn(response);

        VerifyPaymentResponse result = controller.verify(request);

        assertEquals("SUCCESS", result.getStatus());
        verify(paymentService).verifyPayment(request);
    }
}

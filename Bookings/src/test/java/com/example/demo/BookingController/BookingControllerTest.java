package com.example.demo.BookingController;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.example.demo.controller.BookingController;
import com.example.demo.entity.Booking;
import com.example.demo.service.BookingService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Arrays;

@ExtendWith(MockitoExtension.class)
public class BookingControllerTest {

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController bookingController;

    @Test
    void testCreateBooking() {

        Booking booking = new Booking();
        booking.setId(1L);

        when(bookingService.createBooking(any())).thenReturn(booking);

        Booking result = bookingController.createBooking(booking);

        assertEquals(1L, result.getId());
    }

    @Test
    void testGetByCustomer() {

        Booking booking = new Booking();
        booking.setCustomerId(10L);

        when(bookingService.getBookingsByCustomer(10L))
                .thenReturn(Arrays.asList(booking));

        List<Booking> result = bookingController.getByCustomer(10L);

        assertEquals(1, result.size());
    }
}
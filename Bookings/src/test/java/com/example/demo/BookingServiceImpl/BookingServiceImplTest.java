package com.example.demo.BookingServiceImpl;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.example.demo.entity.Booking;
import com.example.demo.feign.DealerClient;
import com.example.demo.repository.BookingRepository;
import com.example.demo.service.BookingServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.List;
import java.util.Arrays;

@ExtendWith(MockitoExtension.class)
public class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private DealerClient dealerClient;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Booking booking;

    @BeforeEach
    void setup() {
        booking = Booking.builder()
                .id(1L)
                .customerId(10L)
                .dealerId(20L)
                .vehicleId(30L)
                .bookingStatus("REQUESTED")
                .paymentStatus("UNPAID")
                .amount(100000.0)
                .build();
    }

    @Test
    void testCreateBooking() {

        when(bookingRepository.save(any())).thenReturn(booking);

        Booking result = bookingService.createBooking(booking);

        assertNotNull(result);
        assertEquals("REQUESTED", result.getBookingStatus());

        verify(bookingRepository, times(1)).save(any());
    }

    @Test
    void testGetBookingsByCustomer() {

        when(bookingRepository.findByCustomerId(10L))
                .thenReturn(Arrays.asList(booking));

        List<Booking> result = bookingService.getBookingsByCustomer(10L);

        assertEquals(1, result.size());
    }

    @Test
    void testAcceptBooking() {

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any())).thenReturn(booking);

        Booking result = bookingService.acceptBooking(1L);

        assertEquals("ACCEPTED", result.getBookingStatus());
    }

    @Test
    void testRejectBooking() {

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any())).thenReturn(booking);

        Booking result = bookingService.rejectBooking(1L);

        assertEquals("REJECTED", result.getBookingStatus());
    }

    @Test
    void testGetById() {

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        Booking result = bookingService.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }
}
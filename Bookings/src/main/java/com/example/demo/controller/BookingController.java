package com.example.demo.controller;

import com.example.demo.entity.Booking;
import com.example.demo.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

  private final BookingService bookingService;

  @PostMapping
  public Booking createBooking(@Valid @RequestBody Booking booking) {
    return bookingService.createBooking(booking);
  }

  @GetMapping("/customer/{customerId}")
  public List<Booking> getByCustomer(@PathVariable Long customerId) {
    return bookingService.getBookingsByCustomer(customerId);
  }

  @GetMapping("/dealer/{dealerId}")
  public List<Booking> getByDealer(@PathVariable Long dealerId) {
    return bookingService.getBookingsByDealer(dealerId);
  }

  @PutMapping("/cancel/{bookingId}")
  public Booking cancelBooking(@PathVariable Long bookingId) {
    return bookingService.cancelBooking(bookingId);
  }

  @PutMapping("/{bookingId}/accept")
  public Booking acceptBooking(@PathVariable Long bookingId) {
    return bookingService.acceptBooking(bookingId);
  }

  @PutMapping("/{bookingId}/reject")
  public Booking rejectBooking(@PathVariable Long bookingId) {
    return bookingService.rejectBooking(bookingId);
  }

  // Internal endpoint used by payment-service after successful verification.
  @PutMapping("/confirm/{bookingId}")
  public Booking confirmBooking(@PathVariable Long bookingId) {
    return bookingService.confirmBooking(bookingId);
  }

  @GetMapping("/{id}")
  public Booking getById(@PathVariable Long id) {
    return bookingService.getById(id);
  }
}

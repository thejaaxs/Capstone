package com.example.demo.service;

import com.example.demo.entity.Booking;
import com.example.demo.feign.DealerClient;
import com.example.demo.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {

  private final BookingRepository bookingRepository;
  private final DealerClient dealerClient;

  @Override
  public Booking createBooking(Booking booking) {
    if (booking.getCustomerId() == null || booking.getDealerId() == null || booking.getVehicleId() == null) {
      throw new RuntimeException("customerId, dealerId and vehicleId are required");
    }

    log.info("Creating booking customerId={} dealerId={} vehicleId={}",
        booking.getCustomerId(), booking.getDealerId(), booking.getVehicleId());

    booking.setBookingDate(LocalDateTime.now());
    booking.setBookingStatus("REQUESTED");
    booking.setPaymentStatus("UNPAID");
    booking.setCreatedAt(LocalDateTime.now());

    Booking saved = bookingRepository.save(booking);
    log.info("Booking created id={} status={} paymentStatus={}", saved.getId(), saved.getBookingStatus(), saved.getPaymentStatus());

    try {
      dealerClient.createNotification(
          saved.getDealerId(),
          new DealerClient.CreateNotificationRequest(
              "BOOKING",
              "New booking request #" + saved.getId() + " from customer #" + saved.getCustomerId()
          )
      );
    } catch (Exception ex) {
      log.warn("Dealer notification failed for bookingId={}", saved.getId(), ex);
    }

    return saved;
  }

  @Override
  public List<Booking> getBookingsByCustomer(Long customerId) {
    return bookingRepository.findByCustomerId(customerId);
  }

  @Override
  public List<Booking> getBookingsByDealer(Long dealerId) {
    return bookingRepository.findByDealerId(dealerId);
  }

  @Override
  public Booking cancelBooking(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new RuntimeException("Booking not found"));

    if ("PAID".equalsIgnoreCase(booking.getPaymentStatus())) {
      throw new RuntimeException("Paid booking cannot be cancelled");
    }

    booking.setBookingStatus("CANCELLED");
    Booking saved = bookingRepository.save(booking);
    log.info("Booking cancelled id={}", bookingId);
    return saved;
  }

  @Override
  public Booking acceptBooking(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new RuntimeException("Booking not found"));

    if (!"REQUESTED".equalsIgnoreCase(booking.getBookingStatus())) {
      throw new RuntimeException("Only REQUESTED bookings can be accepted");
    }

    booking.setBookingStatus("ACCEPTED");
    Booking saved = bookingRepository.save(booking);
    log.info("Booking accepted id={}", bookingId);
    return saved;
  }

  @Override
  public Booking rejectBooking(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new RuntimeException("Booking not found"));

    if (!"REQUESTED".equalsIgnoreCase(booking.getBookingStatus())) {
      throw new RuntimeException("Only REQUESTED bookings can be rejected");
    }

    booking.setBookingStatus("REJECTED");
    Booking saved = bookingRepository.save(booking);
    log.info("Booking rejected id={}", bookingId);
    return saved;
  }

  @Override
  public Booking confirmBooking(Long bookingId) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new RuntimeException("Booking not found"));

    if (!"ACCEPTED".equalsIgnoreCase(booking.getBookingStatus())) {
      throw new RuntimeException("Booking is not approved by dealer yet");
    }

    booking.setBookingStatus("CONFIRMED");
    booking.setPaymentStatus("PAID");

    Booking saved = bookingRepository.save(booking);
    log.info("Booking confirmed and marked paid id={}", bookingId);
    return saved;
  }

  @Override
  public Booking getById(Long id) {
    return bookingRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Booking not found"));
  }
}

package com.example.demo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotNull(message = "Customer ID is required")
  @Positive(message = "Customer ID must be positive")
  @Column(nullable = false)
  private Long customerId;

  @NotNull(message = "Dealer ID is required")
  @Positive(message = "Dealer ID must be positive")
  @Column(nullable = false)
  private Long dealerId;

  @NotNull(message = "Vehicle ID is required")
  @Positive(message = "Vehicle ID must be positive")
  @Column(nullable = false)
  private Long vehicleId;

  private LocalDateTime bookingDate;

  private LocalDateTime deliveryDate;

  private String bookingStatus;

  private String paymentStatus;

  @Positive(message = "Amount must be greater than 0")
  private Double amount;

  private LocalDateTime createdAt;
}

package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "full_name", nullable = false)
  private String fullName;

  @Column(name = "email_id", nullable = false, unique = true)
  private String emailId;

  @Column(name = "password", nullable = false)
  private String password;

  @Column(name = "mobile_no", nullable = false)
  private String mobileNo;

  @Column(name = "address", nullable = false)
  private String address;

  @Enumerated(EnumType.STRING)
  @Column(name = "role", nullable = false)
  private Role role;

  @Enumerated(EnumType.STRING)
  @Column(name = "user_type", nullable = false)
  private UserType userType;

  @Column(name = "active", nullable = false)
  private boolean active;
}
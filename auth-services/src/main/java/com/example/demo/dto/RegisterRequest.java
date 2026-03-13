package com.example.demo.dto;

import com.example.demo.entity.UserType;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegisterRequest {

  @NotBlank(message = "Full name is required")
  @Size(min = 3, max = 120, message = "Full name must be between 3 and 120 characters")
  private String fullName;

  @Email(message = "Email address must be valid")
  @NotBlank(message = "Email address is required")
  private String emailId;

  @NotBlank(message = "Mobile number is required")
  @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must be exactly 10 digits")
  private String mobileNo;

  @NotBlank(message = "Address is required")
  @Size(min = 5, max = 255, message = "Address must be between 5 and 255 characters")
  private String address;

  @NotNull(message = "User type is required")
  private UserType userType; // CUSTOMER / DEALER / ADMIN

  @NotBlank(message = "Password is required")
  @Size(min = 6, max = 120, message = "Password must be between 6 and 120 characters")
  private String password;
}

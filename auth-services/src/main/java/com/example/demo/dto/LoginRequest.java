package com.example.demo.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginRequest {
  @Email(message = "Email address must be valid")
  @NotBlank(message = "Email address is required")
  private String emailId;

  @NotBlank(message = "Password is required")
  private String password;
}

package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "CUSTOMER-SERVICE")
public interface CustomerClient {

  @PostMapping("/customers")
  Object createCustomer(@RequestBody CustomerProfileRequest request);

  record CustomerProfileRequest(
      String customerName,
      String address,
      String email,
      String mobileNo) {
  }
}

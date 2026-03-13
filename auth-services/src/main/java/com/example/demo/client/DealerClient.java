package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "DEALER-SERVICE")
public interface DealerClient {

  @PostMapping("/dealers/add")
  Object createDealer(@RequestBody DealerProfileRequest request);

  record DealerProfileRequest(
      String fullName,
      String address,
      String mobileNo,
      String emailId) {
  }
}

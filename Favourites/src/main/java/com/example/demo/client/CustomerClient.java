package com.example.demo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "CUSTOMER-SERVICE")
public interface CustomerClient {

    @GetMapping("/customers/{id}")
    CustomerSummary getCustomer(@PathVariable("id") Long id);

    class CustomerSummary {
        public Long customerId;
        public String customerName;
        public String address;
        public String email;
        public String contactNumber;
    }
}

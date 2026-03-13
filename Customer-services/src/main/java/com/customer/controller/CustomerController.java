package com.customer.controller;

import com.customer.entity.Customer;
import com.customer.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService service;

    // CREATE
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Customer create(@RequestBody Customer customer) {
        return service.createCustomer(customer);
    }

    // UPDATE
    @PutMapping("/{customerId}")
    public Customer update(@PathVariable Long customerId,
                           @RequestBody Customer customer) {
        return service.updateCustomer(customerId, customer);
    }

    // DELETE
    @DeleteMapping("/{customerId}")
    public String delete(@PathVariable Long customerId) {
        service.deleteCustomer(customerId);
        return "Customer deleted successfully";
    }
    
    // GET BY ID
    @GetMapping("/{customerId}")
    public Customer getById(@PathVariable Long customerId) {
        return service.getCustomerById(customerId);
    }

    @GetMapping("/by-email")
    public Customer getByEmail(@RequestParam String email) {
        return service.getAllCustomers().stream()
                .filter(customer -> customer.getEmail() != null && customer.getEmail().equalsIgnoreCase(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + email));
    }

    // GET ALL
    @GetMapping
    public List<Customer> getAll() {
        return service.getAllCustomers();
    }

    @GetMapping("/list")
    public List<Customer> list() {
        return service.getAllCustomers();
    }
}

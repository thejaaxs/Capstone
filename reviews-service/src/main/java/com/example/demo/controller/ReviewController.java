package com.example.demo.controller;

import java.util.List;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.demo.dto.*;
import com.example.demo.service.ReviewService;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService service;
    
    @GetMapping("/")
    public String home() {
        return "Review service is running ✅";
    }

    // Normal user (customer) can add review
    @PostMapping("/add")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('USER')")
    public ReviewResponse add(@Valid @RequestBody ReviewCreateRequest request) {
        return service.add(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ReviewResponse update(@PathVariable Long id, @Valid @RequestBody ReviewUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('USER')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // List all reviews for a customer
    @GetMapping("/list")
    @PreAuthorize("hasRole('USER')")
    public List<ReviewResponse> list(@RequestParam(required = false) Long customerId) {
        if (customerId == null) return service.listAll(); // careful: exposes all to USER
        return service.listByCustomer(customerId);
    }

    // List reviews by  product name
    @GetMapping("/byProductName/{productName}")
    public List<ReviewResponse> byProduct(@PathVariable String productName) {
        return service.listByProductName(productName);
    }

    // Admin endpoint
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ReviewResponse> listAll() {
        return service.listAll();
    }
}
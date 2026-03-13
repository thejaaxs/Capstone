package com.example.demo.service;

import com.example.demo.client.CustomerClient;
import com.example.demo.dto.ReviewCreateRequest;
import com.example.demo.dto.ReviewResponse;
import com.example.demo.dto.ReviewUpdateRequest;
import com.example.demo.entity.Review;
import com.example.demo.repository.ReviewRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    @Mock
    private ReviewRepository repo;

    @Mock
    private CustomerClient customerClient;

    @InjectMocks
    private ReviewServiceImpl service;

    // ADD REVIEW
    @Test
    void add_ShouldSaveReview() {

        ReviewCreateRequest req = new ReviewCreateRequest();
        req.setCustomerId(1L);
        req.setProductName("Bike");
        req.setRating(5);
        req.setTitle("Good");
        req.setComment("Nice bike");

        Review saved = Review.builder()
                .id(1L)
                .customerId(1L)
                .productName("Bike")
                .rating(5)
                .title("Good")
                .comment("Nice bike")
                .build();

        // Mock Feign call
        when(customerClient.getCustomer(1L)).thenReturn(null);

        when(repo.existsByCustomerIdAndProductNameIgnoreCase(1L, "Bike"))
                .thenReturn(false);

        when(repo.save(any())).thenReturn(saved);

        ReviewResponse result = service.add(req);

        assertEquals("Bike", result.getProductName());
        assertEquals(5, result.getRating());
    }

    // UPDATE REVIEW
    @Test
    void update_ShouldUpdateReview() {

        Review existing = Review.builder()
                .id(1L)
                .customerId(1L)
                .productName("Bike")
                .rating(4)
                .build();

        ReviewUpdateRequest req = new ReviewUpdateRequest();
        req.setRating(5);

        when(repo.findById(1L)).thenReturn(Optional.of(existing));
        when(repo.save(any())).thenReturn(existing);

        ReviewResponse result = service.update(1L, req);

        assertEquals(5, result.getRating());
    }

    // DELETE REVIEW
    @Test
    void delete_ShouldRemoveReview() {

        Review review = Review.builder()
                .id(1L)
                .customerId(1L)
                .productName("Bike")
                .build();

        when(repo.findById(1L)).thenReturn(Optional.of(review));

        service.delete(1L);

        verify(repo).delete(review);
    }

    // LIST ALL REVIEWS
    @Test
    void listAll_ShouldReturnReviews() {

        Review r = Review.builder()
                .id(1L)
                .customerId(1L)
                .productName("Bike")
                .rating(5)
                .build();

        when(repo.findAll()).thenReturn(List.of(r));

        List<ReviewResponse> result = service.listAll();

        assertEquals(1, result.size());
    }
}
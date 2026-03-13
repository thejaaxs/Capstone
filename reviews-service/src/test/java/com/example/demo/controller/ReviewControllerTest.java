
package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.service.ReviewService;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

import org.springframework.security.test.context.support.WithMockUser;

import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReviewController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReviewService service;

    @Test
    @WithMockUser
    void home_ShouldReturnMessage() throws Exception {

        mockMvc.perform(get("/reviews/"))
                .andExpect(status().isOk())
                .andExpect(content().string("Review service is running ✅"));
    }

    @Test
    @WithMockUser
    void add_ShouldReturnCreatedReview() throws Exception {

        ReviewResponse resp = ReviewResponse.builder()
                .id(1L)
                .productName("Bike")
                .rating(5)
                .build();

        Mockito.when(service.add(Mockito.any())).thenReturn(resp);

        mockMvc.perform(post("/reviews/add")
                .contentType("application/json")
                .content("""
                        {
                          "customerId":1,
                          "productName":"Bike",
                          "rating":5,
                          "title":"Good",
                          "comment":"Nice bike"
                        }
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.productName", is("Bike")));
    }

    @Test
    @WithMockUser
    void list_ShouldReturnReviews() throws Exception {

        ReviewResponse resp = ReviewResponse.builder()
                .productName("Bike")
                .build();

        Mockito.when(service.listAll()).thenReturn(List.of(resp));

        mockMvc.perform(get("/reviews/list"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser
    void delete_ShouldReturnSuccessMessage() throws Exception {

        mockMvc.perform(delete("/reviews/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Review deleted successfully"));
    }
}

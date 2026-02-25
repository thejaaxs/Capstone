package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.*;
import com.example.demo.entity.Review;
import com.example.demo.exception.DuplicateReviewException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ReviewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

	private final ReviewRepository repo;

	@Override
	public ReviewResponse add(ReviewCreateRequest req) {
		if (repo.existsByCustomerIdAndProductNameIgnoreCase(req.getCustomerId(), req.getProductName())) {
			throw new DuplicateReviewException(
					"Review already exists for this customer and product. Please update instead.");
		}

		Review review = Review.builder().id(req.getId()) // ✅ REQUIRED
				.customerId(req.getCustomerId()).productName(req.getProductName().trim()).rating(req.getRating())
				.title(req.getTitle()).comment(req.getComment()).build();

		Review saved = repo.save(review);
		return toResponse(saved);
	}

	@Override
	public ReviewResponse update(Long id, ReviewUpdateRequest req) {
		Review review = repo.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));

		if (req.getRating() != null)
			review.setRating(req.getRating());
		if (req.getTitle() != null)
			review.setTitle(req.getTitle());
		if (req.getComment() != null)
			review.setComment(req.getComment());

		Review saved = repo.save(review);
		return toResponse(saved);
	}

	@Override
	public void delete(Long id) {
		Review review = repo.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Review not found with id: " + id));
		repo.delete(review);
	}

	@Override
	@Transactional(readOnly = true)
	public List<ReviewResponse> listByCustomer(Long customerId) {
		return repo.findByCustomerId(customerId).stream().map(this::toResponse).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<ReviewResponse> listByCustomerAndProduct(Long customerId, String productName) {
		return repo.findByCustomerIdAndProductNameIgnoreCase(customerId, productName).stream().map(this::toResponse)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<ReviewResponse> listByProductName(String productName) {
		return repo.findByProductNameIgnoreCase(productName).stream().map(this::toResponse).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<ReviewResponse> listAll() {
		return repo.findAll().stream().map(this::toResponse).toList();
	}

	private ReviewResponse toResponse(Review r) {
		return ReviewResponse.builder().id(r.getId()).customerId(r.getCustomerId()).productName(r.getProductName())
				.rating(r.getRating()).title(r.getTitle()).comment(r.getComment()).build();
	}
}
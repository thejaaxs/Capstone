package com.example.demo.exception;

import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex, HttpServletRequest request) {
    String msg = ex.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(e -> e.getField() + " " + e.getDefaultMessage())
        .orElse("Validation error");

    log.warn("Booking validation failed path={} message={}", request.getRequestURI(), msg);
    return build(HttpStatus.BAD_REQUEST, msg, request.getRequestURI());
  }

  @ExceptionHandler(FeignException.class)
  public ResponseEntity<ApiError> feign(FeignException ex, HttpServletRequest request) {
    int status = ex.status() <= 0 ? 503 : ex.status();
    log.warn("Downstream service error path={} status={} message={}", request.getRequestURI(), status, ex.getMessage());
    return build(HttpStatus.valueOf(status), ex.getMessage(), request.getRequestURI());
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiError> runtime(RuntimeException ex, HttpServletRequest request) {
    String message = ex.getMessage() == null ? "Request failed" : ex.getMessage();
    HttpStatus status = message.toLowerCase().contains("not found") ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
    log.warn("Booking runtime error path={} status={} message={}", request.getRequestURI(), status.value(), message);
    return build(status, message, request.getRequestURI());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> any(Exception ex, HttpServletRequest request) {
    log.error("Unhandled booking error path={}", request.getRequestURI(), ex);
    return build(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), request.getRequestURI());
  }

  private ResponseEntity<ApiError> build(HttpStatus status, String message, String path) {
    ApiError body = ApiError.builder()
        .timestamp(Instant.now())
        .status(status.value())
        .message(message)
        .path(path)
        .build();

    return ResponseEntity.status(status).body(body);
  }
}

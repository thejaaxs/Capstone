package com.example.demo.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
    String msg = ex.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(e -> e.getField() + " " + e.getDefaultMessage())
        .orElse("Validation error");

    log.warn("Validation failed for path={} message={}", req.getRequestURI(), msg);
    return build(HttpStatus.BAD_REQUEST, msg, req.getRequestURI());
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
    log.warn("Authentication failed for path={} reason=bad_credentials", req.getRequestURI());
    return build(HttpStatus.UNAUTHORIZED, "Bad credentials", req.getRequestURI());
  }

  @ExceptionHandler(UsernameNotFoundException.class)
  public ResponseEntity<ApiError> handleUserNotFound(UsernameNotFoundException ex, HttpServletRequest req) {
    log.warn("Authentication failed for path={} reason=user_not_found", req.getRequestURI());
    return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(DisabledException.class)
  public ResponseEntity<ApiError> handleDisabled(DisabledException ex, HttpServletRequest req) {
    log.warn("Access denied for disabled account on path={}", req.getRequestURI());
    return build(HttpStatus.FORBIDDEN, ex.getMessage(), req.getRequestURI());
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
    log.warn("Access denied on path={}", req.getRequestURI());
    return build(HttpStatus.FORBIDDEN, "Access denied", req.getRequestURI());
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest req) {
    log.warn("Data integrity violation on path={}", req.getRequestURI());
    return build(HttpStatus.CONFLICT, "Email already registered. Please login.", req.getRequestURI());
  }

  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiError> handleRuntime(RuntimeException ex, HttpServletRequest req) {
    final String message = ex.getMessage() == null ? "Request failed" : ex.getMessage();
    final String lower = message.toLowerCase();
    final HttpStatus status = (lower.contains("already exists") || lower.contains("duplicate"))
        ? HttpStatus.CONFLICT
        : HttpStatus.BAD_REQUEST;

    log.warn("Runtime exception on path={} status={} message={}", req.getRequestURI(), status.value(), message);
    return build(status, message, req.getRequestURI());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleAny(Exception ex, HttpServletRequest req) {
    log.error("Unhandled exception on path={}", req.getRequestURI(), ex);
    return build(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), req.getRequestURI());
  }

  private ResponseEntity<ApiError> build(HttpStatus status, String message, String path) {
    return ResponseEntity.status(status)
        .body(ApiError.builder()
            .timestamp(Instant.now())
            .status(status.value())
            .message(message)
            .path(path)
            .build());
  }
}

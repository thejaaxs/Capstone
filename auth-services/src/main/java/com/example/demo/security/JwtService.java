package com.example.demo.security;

import com.example.demo.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {

  @Value("${security.jwt.secret:${JWT_SECRET:change-this-jwt-secret-key-change-this-jwt-secret-key-123456}}")
  private String secret;

  @Value("${app.jwt.expiration-ms:3600000}")
  private long expirationMs;

  private Key signKey() {
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  public String generateToken(String emailId, Role role) {
    String authority = role.name();
    return Jwts.builder()
        .setSubject(emailId)
        .addClaims(Map.of(
            "role", authority,
            "roles", List.of(authority),
            "authorities", List.of(authority)))
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
        .signWith(signKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  public String extractEmail(String token) {
    return parseClaims(token).getSubject();
  }

  public String extractRole(String token) {
    Object role = parseClaims(token).get("role");
    return role == null ? null : role.toString();
  }

  public boolean isValid(String token) {
    try {
      parseClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException e) {
      return false;
    }
  }

  private Claims parseClaims(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(signKey())
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}

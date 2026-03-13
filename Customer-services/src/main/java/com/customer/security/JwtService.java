package com.customer.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    @Value("${security.jwt.secret}")
    private String jwtSecret;

    public Authentication buildAuthentication(String token) {
        Claims claims = parseToken(token);
        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new JwtException("JWT subject is missing");
        }
        return new UsernamePasswordAuthenticationToken(subject, token, extractAuthorities(claims));
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Collection<? extends GrantedAuthority> extractAuthorities(Claims claims) {
        Object rawAuthorities = claims.get("authorities");
        if (rawAuthorities == null) {
            rawAuthorities = claims.get("roles");
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        if (rawAuthorities instanceof Collection<?> values) {
            for (Object value : values) {
                addAuthority(authorities, value);
            }
        } else if (rawAuthorities instanceof String value) {
            for (String authority : value.split(",")) {
                addAuthority(authorities, authority);
            }
        }
        return authorities;
    }

    private void addAuthority(List<SimpleGrantedAuthority> authorities, Object value) {
        if (value == null) {
            return;
        }
        String authority = value.toString().trim();
        if (!authority.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority(authority));
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
}


package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	    http
	        .csrf(csrf -> csrf.disable())
	        .authorizeHttpRequests(auth -> auth
	            .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/images/**").permitAll()
	            .requestMatchers("/reviews/**").permitAll()   // ✅ allow /reviews/ in browser
	            .requestMatchers("/swagger/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
	            .anyRequest().authenticated()
	        )
	        .httpBasic(Customizer.withDefaults());

	    return http.build();
	}

    @Bean
    public UserDetailsService users(PasswordEncoder encoder) {
        UserDetails customer = User.withUsername("customer1")
                .password(encoder.encode("cust123"))
                .roles("USER")
                .build();

        UserDetails admin = User.withUsername("admin")
                .password(encoder.encode("admin123"))
                .roles("ADMIN")
                .build();

        return new InMemoryUserDetailsManager(customer, admin);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
package com.customer.service;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.customer.entity.Customer;
import com.customer.repository.CustomerRepository;
import com.customer.service.CustomerServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.List;
import java.util.Arrays;

@ExtendWith(MockitoExtension.class)
public class CustomerServiceImplTest {

    @Mock
    private CustomerRepository repository;

    @InjectMocks
    private CustomerServiceImpl service;

    private Customer customer;

    @BeforeEach
    void setup() {
        customer = Customer.builder()
                .customerId(1L)
                .customerName("John")
                .address("Bangalore")
                .email("john@test.com")
                .contactNumber("9876543210")
                .build();
    }

    @Test
    void testCreateCustomer() {

        when(repository.existsByEmail(customer.getEmail())).thenReturn(false);
        when(repository.save(any())).thenReturn(customer);

        Customer result = service.createCustomer(customer);

        assertNotNull(result);
        assertEquals("John", result.getCustomerName());

        verify(repository, times(1)).save(customer);
    }

    @Test
    void testGetCustomerById() {

        when(repository.findById(1L)).thenReturn(Optional.of(customer));

        Customer result = service.getCustomerById(1L);

        assertEquals(1L, result.getCustomerId());
    }

    @Test
    void testGetAllCustomers() {

        when(repository.findAll()).thenReturn(Arrays.asList(customer));

        List<Customer> result = service.getAllCustomers();

        assertEquals(1, result.size());
    }

    @Test
    void testUpdateCustomer() {

        when(repository.findById(1L)).thenReturn(Optional.of(customer));
        when(repository.save(any())).thenReturn(customer);

        Customer updated = service.updateCustomer(1L, customer);

        assertEquals("John", updated.getCustomerName());
    }

    @Test
    void testDeleteCustomer() {

        when(repository.findById(1L)).thenReturn(Optional.of(customer));

        service.deleteCustomer(1L);

        verify(repository, times(1)).delete(customer);
    }
}
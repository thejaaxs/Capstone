
package com.customer.controller;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.customer.controller.CustomerController;
import com.customer.entity.Customer;
import com.customer.service.CustomerService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Arrays;

@ExtendWith(MockitoExtension.class)
public class CustomerControllerTest {

    @Mock
    private CustomerService service;

    @InjectMocks
    private CustomerController controller;

    @Test
    void testCreateCustomer() {

        Customer customer = new Customer();
        customer.setCustomerId(1L);

        when(service.createCustomer(any())).thenReturn(customer);

        Customer result = controller.create(customer);

        assertEquals(1L, result.getCustomerId());
    }

    @Test
    void testGetById() {

        Customer customer = new Customer();
        customer.setCustomerId(1L);

        when(service.getCustomerById(1L)).thenReturn(customer);

        Customer result = controller.getById(1L);

        assertEquals(1L, result.getCustomerId());
    }

    @Test
    void testGetAllCustomers() {

        Customer customer = new Customer();

        when(service.getAllCustomers()).thenReturn(Arrays.asList(customer));

        List<Customer> result = controller.getAll();

        assertEquals(1, result.size());
    }
}

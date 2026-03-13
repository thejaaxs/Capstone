package com.example.demo.controller;

import com.example.demo.entity.Vehicle;
import com.example.demo.service.VehicleService;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VehicleController.class)
@AutoConfigureMockMvc(addFilters = false)
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VehicleService service;

    @Test
    void getAll_ShouldReturnVehicles() throws Exception {

        Vehicle v = new Vehicle();
        v.setId(1L);
        v.setName("Bike");

        Mockito.when(service.getAllVehicles()).thenReturn(List.of(v));

        mockMvc.perform(get("/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Bike")));
    }

    @Test
    void add_ShouldReturnVehicle() throws Exception {

        Vehicle v = new Vehicle();
        v.setId(1L);
        v.setName("Bike");

        Mockito.when(service.addVehicle(Mockito.any())).thenReturn(v);

        mockMvc.perform(post("/vehicles")
                .contentType("application/json")
                .content("""
                        {
                          "name":"Bike",
                          "brand":"Honda",
                          "price":50000,
                          "dealerId":1
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Bike")));
    }

    @Test
    void getById_ShouldReturnVehicle() throws Exception {

        Vehicle v = new Vehicle();
        v.setId(1L);
        v.setName("Bike");

        Mockito.when(service.getVehicleById(1L)).thenReturn(v);

        mockMvc.perform(get("/vehicles/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Bike")));
    }

    @Test
    void delete_ShouldReturnMessage() throws Exception {

        mockMvc.perform(delete("/vehicles/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Deleted Successfully"));
    }
}

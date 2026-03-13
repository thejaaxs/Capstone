package com.example.demo.service;

import com.example.demo.entity.Vehicle;
import com.example.demo.repository.VehicleRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository repository;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private VehicleService service;

    @Test
    void addVehicle_ShouldSaveVehicle() {

        Vehicle v = new Vehicle();
        v.setName("Bike");

        when(repository.save(v)).thenReturn(v);

        Vehicle result = service.addVehicle(v);

        assertEquals("Bike", result.getName());
    }

    @Test
    void getAllVehicles_ShouldReturnVehicles() {

        Vehicle v = new Vehicle();
        v.setId(1L);

        when(repository.findAll()).thenReturn(List.of(v));
        when(fileStorageService.getFileUrl(null)).thenReturn(null);

        List<Vehicle> result = service.getAllVehicles();

        assertEquals(1, result.size());
    }

    @Test
    void getVehicleById_ShouldReturnVehicle() {

        Vehicle v = new Vehicle();
        v.setId(1L);

        when(repository.findById(1L)).thenReturn(Optional.of(v));
        when(fileStorageService.getFileUrl(null)).thenReturn(null);

        Vehicle result = service.getVehicleById(1L);

        assertEquals(1L, result.getId());
    }

    @Test
    void updateVehicle_ShouldUpdateFields() {

        Vehicle existing = new Vehicle();
        existing.setId(1L);

        Vehicle update = new Vehicle();
        update.setName("UpdatedBike");

        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenReturn(existing);

        Vehicle result = service.updateVehicle(1L, update);

        assertEquals("UpdatedBike", result.getName());
    }

    @Test
    void deleteVehicle_ShouldDelete() {

        Vehicle v = new Vehicle();
        v.setId(1L);

        when(repository.findById(1L)).thenReturn(Optional.of(v));

        service.deleteVehicle(1L);

        verify(repository).deleteById(1L);
    }

    @Test
    void uploadImage_ShouldStoreFile() {

        Vehicle v = new Vehicle();
        v.setId(1L);

        MockMultipartFile file =
                new MockMultipartFile("file", "img.png",
                        "image/png", "test".getBytes());

        when(repository.findById(1L)).thenReturn(Optional.of(v));
        when(fileStorageService.saveFile(file)).thenReturn("img.png");
        when(repository.save(v)).thenReturn(v);

        Vehicle result = service.uploadImage(1L, file);

        assertEquals("img.png", result.getImageUrl());
    }
}
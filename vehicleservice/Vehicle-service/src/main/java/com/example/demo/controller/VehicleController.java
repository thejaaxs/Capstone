package com.example.demo.controller;

import com.example.demo.entity.Vehicle;
import com.example.demo.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {

  private final VehicleService service;

  public VehicleController(VehicleService service) {
    this.service = service;
  }

  @PostMapping
  public Vehicle add(@Valid @RequestBody Vehicle vehicle) {
    return service.addVehicle(vehicle);
  }

  @GetMapping
  public List<Vehicle> getAll() {
    return service.getAllVehicles();
  }

  @GetMapping("/{id}")
  public Vehicle getById(@PathVariable Long id) {
    return service.getVehicleById(id);
  }

  @GetMapping("/dealer/{dealerId}")
  public List<Vehicle> getDealerVehicles(@PathVariable Long dealerId) {
    return service.getByDealer(dealerId);
  }

  @PutMapping("/{id}")
  public Vehicle update(@PathVariable Long id, @Valid @RequestBody Vehicle vehicle) {
    return service.updateVehicle(id, vehicle);
  }

  @DeleteMapping("/{id}")
  public String delete(@PathVariable Long id) {
    service.deleteVehicle(id);
    return "Deleted Successfully";
  }

  @PostMapping("/{id}/upload-image")
  public Vehicle uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
    return service.uploadImage(id, file);
  }

  @DeleteMapping("/{id}/delete-image")
  public Vehicle deleteImage(@PathVariable Long id) {
    return service.deleteImage(id);
  }
}

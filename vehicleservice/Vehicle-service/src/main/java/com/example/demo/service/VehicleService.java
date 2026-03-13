package com.example.demo.service;

import com.example.demo.entity.Vehicle;
import com.example.demo.repository.VehicleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Slf4j
public class VehicleService {

  private final VehicleRepository repository;
  private final FileStorageService fileStorageService;

  public VehicleService(VehicleRepository repository, FileStorageService fileStorageService) {
    this.repository = repository;
    this.fileStorageService = fileStorageService;
  }

  public Vehicle addVehicle(Vehicle vehicle) {
    Vehicle saved = repository.save(vehicle);
    log.info("Vehicle created id={} dealerId={} status={}", saved.getId(), saved.getDealerId(), saved.getStatus());
    return hydrateImageUrl(saved);
  }

  public List<Vehicle> getAllVehicles() {
    return hydrateImageUrls(repository.findAll());
  }

  public Vehicle getVehicleById(Long id) {
    return hydrateImageUrl(repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found")));
  }

  public List<Vehicle> getByDealer(Long dealerId) {
    return hydrateImageUrls(repository.findByDealerId(dealerId));
  }

  public Vehicle updateVehicle(Long id, Vehicle vehicle) {
    Vehicle existing = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

    existing.setName(vehicle.getName());
    existing.setBrand(vehicle.getBrand());
    existing.setPrice(vehicle.getPrice());
    existing.setStatus(vehicle.getStatus());
    existing.setMileage(vehicle.getMileage());
    existing.setRideType(vehicle.getRideType());
    existing.setSuitableDailyKm(vehicle.getSuitableDailyKm());
    existing.setDealerId(vehicle.getDealerId());

    Vehicle saved = repository.save(existing);
    log.info("Vehicle updated id={} dealerId={} status={}", saved.getId(), saved.getDealerId(), saved.getStatus());
    return hydrateImageUrl(saved);
  }

  public Vehicle uploadImage(Long id, MultipartFile file) {
    Vehicle vehicle = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

    if (vehicle.getImageUrl() != null) {
      fileStorageService.deleteFile(vehicle.getImageUrl());
    }

    String fileName = fileStorageService.saveFile(file);
    vehicle.setImageUrl(fileName);

    Vehicle saved = repository.save(vehicle);
    log.info("Vehicle image uploaded id={} file={}", id, fileName);
    return hydrateImageUrl(saved);
  }

  public void deleteVehicle(Long id) {
    Vehicle vehicle = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

    if (vehicle.getImageUrl() != null) {
      fileStorageService.deleteFile(vehicle.getImageUrl());
    }

    repository.deleteById(id);
    log.info("Vehicle deleted id={}", id);
  }

  public Vehicle deleteImage(Long id) {
    Vehicle vehicle = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

    if (vehicle.getImageUrl() != null) {
      fileStorageService.deleteFile(vehicle.getImageUrl());
    }

    vehicle.setImageUrl(null);
    Vehicle saved = repository.save(vehicle);
    log.info("Vehicle image removed id={}", id);
    return hydrateImageUrl(saved);
  }

  private List<Vehicle> hydrateImageUrls(List<Vehicle> vehicles) {
    vehicles.forEach(this::hydrateImageUrl);
    return vehicles;
  }

  private Vehicle hydrateImageUrl(Vehicle vehicle) {
    vehicle.setImageUrl(fileStorageService.getFileUrl(vehicle.getImageUrl()));
    return vehicle;
  }
}

package com.example.demo.Client;

import com.example.demo.dto.VehicleDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "VEHICLE-SERVICE")
public interface VehicleFeignClient {

    @GetMapping("/vehicles")
    List<VehicleDto> getAllVehicles();
}
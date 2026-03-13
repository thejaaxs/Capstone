package com.example.demo.Controller;

import com.example.demo.Service.RecommendationService;
import com.example.demo.dto.RecommendationRequest;
import com.example.demo.dto.VehicleDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/recommend")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/vehicles")
    public List<VehicleDto> getAllVehicles() {
        return recommendationService.getAllVehiclesFromVehicleService();
    }

    @PostMapping
    public List<VehicleDto> recommend(@RequestBody RecommendationRequest request) {
        if (request == null || request.getSession() == null) {
            throw new IllegalArgumentException("Recommendation session details are required.");
        }

        return recommendationService.recommendFromUser(
                request.getSession().getBudget(),
                request.getSession().getDailyKm(),
                request.getSession().getRideType(),
                request.getSession().getMileage()
        );
    }
}

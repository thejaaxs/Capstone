package com.example.demo.Controller;

import com.example.demo.Service.RecommendationService;
import com.example.demo.dto.ChatResponse;
import com.example.demo.dto.ChatSession;
import com.example.demo.dto.RecommendationRequest;
import com.example.demo.dto.VehicleDto;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dealer-chat")
public class DealerChatController {

    private final RecommendationService service;

    public DealerChatController(RecommendationService service) {
        this.service = service;
    }

    @PostMapping("/message")
    public ChatResponse message(@RequestBody RecommendationRequest request) {

        ChatSession session = request == null ? null : request.getSession();
        String message = request == null || request.getMessage() == null ? "" : request.getMessage().trim();

        if (session == null) {
            session = new ChatSession();
            session.setStep(1);

            ChatResponse response = new ChatResponse();
            response.setMessage("What is your budget range for the bike (Rs)?");
            response.setSession(session);
            response.setRecommendations(null);
            return response;
        }

        String reply;
        List<VehicleDto> vehicles = null;

        switch (session.getStep()) {
            case 1:
                try {
                    session.setBudget(Double.parseDouble(message));
                    session.setStep(2);
                    reply = "On average, how many kilometers do you ride per day?";
                } catch (NumberFormatException e) {
                    reply = "What is your budget range for the bike (Rs)?";
                }
                break;

            case 2:
                try {
                    session.setDailyKm(Double.parseDouble(message));
                    session.setStep(3);
                    reply = "Where will you mostly ride the bike? (CITY / HIGHWAY)";
                } catch (NumberFormatException e) {
                    reply = "Please enter daily km as a number.";
                }
                break;

            case 3:
                String ride = message.toUpperCase();

                if (!ride.equals("CITY") && !ride.equals("HIGHWAY")) {
                    reply = "Please choose either CITY or HIGHWAY.";
                    break;
                }

                session.setRideType(ride);
                session.setStep(4);
                reply = "What minimum mileage (km/l) do you expect from the bike?";
                break;

            case 4:
                try {
                    session.setMileage(Integer.parseInt(message));
                    session.setStep(5);

                    vehicles = service.recommendFromUser(
                            session.getBudget(),
                            session.getDailyKm(),
                            session.getRideType(),
                            session.getMileage()
                    );

                    reply = (vehicles == null || vehicles.isEmpty())
                            ? "No bikes found matching your preferences."
                            : "Here are the best bikes for you:";
                } catch (NumberFormatException e) {
                    reply = "Please enter mileage as a number.";
                }
                break;

            default:
                reply = "Conversation completed. Refresh to start again.";
        }

        ChatResponse response = new ChatResponse();
        response.setMessage(reply);
        response.setSession(session);
        response.setRecommendations(vehicles);
        return response;
    }
}

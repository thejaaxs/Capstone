package com.dealer.controller;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.dealer.controller.DealerController;
import com.dealer.dto.*;
import com.dealer.service.DealerService;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Arrays;

@ExtendWith(MockitoExtension.class)
public class DealerControllerTest {

    @Mock
    private DealerService service;

    @InjectMocks
    private DealerController controller;

    @Test
    void testAddDealer() {

        DealerResponseDTO dto = DealerResponseDTO.builder()
                .dealerId(1L)
                .dealerName("Yamaha")
                .build();

        when(service.addDealer(any())).thenReturn(dto);

        var response = controller.addDealer(new DealerRequestDTO());

        assertEquals(1L, response.getBody().getDealerId());
    }

    @Test
    void testGetAllDealers() {

        DealerResponseDTO dto = DealerResponseDTO.builder()
                .dealerId(1L)
                .dealerName("Yamaha")
                .build();

        when(service.getAllDealers()).thenReturn(Arrays.asList(dto));

        var response = controller.getAllDealers();

        assertEquals(1, response.getBody().size());
    }
}

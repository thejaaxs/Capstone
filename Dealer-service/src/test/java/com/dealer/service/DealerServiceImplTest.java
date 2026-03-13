package com.dealer.service;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import com.dealer.dto.*;
import com.dealer.entity.Dealer;
import com.dealer.repository.DealerRepository;
import com.dealer.service.DealerServiceImpl;

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
public class DealerServiceImplTest {

    @Mock
    private DealerRepository repository;

    @InjectMocks
    private DealerServiceImpl service;

    private Dealer dealer;

    @BeforeEach
    void setup() {

        dealer = Dealer.builder()
                .dealerId(1L)
                .dealerName("Yamaha Dealer")
                .address("Bangalore")
                .contactNumber("9999999999")
                .email("dealer@test.com")
                .build();
    }

    @Test
    void testAddDealer() {

        DealerRequestDTO dto = DealerRequestDTO.builder()
                .dealerName("Yamaha Dealer")
                .address("Bangalore")
                .contactNumber("9999999999")
                .email("dealer@test.com")
                .build();

        when(repository.existsByDealerName(dto.getDealerName())).thenReturn(false);
        when(repository.save(any())).thenReturn(dealer);

        DealerResponseDTO result = service.addDealer(dto);

        assertEquals("Yamaha Dealer", result.getDealerName());
    }

    @Test
    void testGetDealerById() {

        when(repository.findById(1L)).thenReturn(Optional.of(dealer));

        DealerResponseDTO result = service.getDealerById(1L);

        assertEquals(1L, result.getDealerId());
    }

    @Test
    void testGetAllDealers() {

        when(repository.findAll()).thenReturn(Arrays.asList(dealer));

        List<DealerResponseDTO> result = service.getAllDealers();

        assertEquals(1, result.size());
    }

    @Test
    void testUpdateDealer() {

        DealerRequestDTO dto = DealerRequestDTO.builder()
                .dealerName("Updated Dealer")
                .address("Chennai")
                .contactNumber("8888888888")
                .email("updated@test.com")
                .build();

        when(repository.findById(1L)).thenReturn(Optional.of(dealer));
        when(repository.save(any())).thenReturn(dealer);

        DealerResponseDTO result = service.updateDealer(1L, dto);

        assertNotNull(result);
    }

    @Test
    void testDeleteDealer() {

        when(repository.findById(1L)).thenReturn(Optional.of(dealer));

        service.deleteDealer(1L);

        verify(repository, times(1)).delete(dealer);
    }
}

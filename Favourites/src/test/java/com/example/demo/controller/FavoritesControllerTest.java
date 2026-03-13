package com.example.demo.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.demo.entity.Favorites;
import com.example.demo.service.FavoritesService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FavoritesControllerTest {

    @Mock
    private FavoritesService service;

    @InjectMocks
    private FavoritesController controller;

    @Test
    void addShouldDelegateToService() {
        Favorites favorite = favorite(1L, "Yamaha", "R15");
        when(service.add(favorite)).thenReturn(favorite);

        Favorites result = controller.add(favorite);

        assertEquals(1L, result.getId());
        verify(service).add(favorite);
    }

    @Test
    void getByIdShouldReturnFavorite() {
        Favorites favorite = favorite(2L, "Honda", "CB350");
        when(service.getById(2L)).thenReturn(favorite);

        Favorites result = controller.getById(2L);

        assertEquals("Honda", result.getDealerName());
        verify(service).getById(2L);
    }

    @Test
    void deleteByIdShouldReturnMessage() {
        String result = controller.deleteById(3L);

        assertEquals("Deleted Successfully", result);
        verify(service).deleteById(3L);
    }

    @Test
    void updateByNameShouldReturnUpdatedFavorite() {
        Favorites favorite = favorite(4L, "Suzuki", "V-Strom");
        when(service.updateByName("Suzuki", favorite)).thenReturn(favorite);

        Favorites result = controller.update("Suzuki", favorite);

        assertEquals("V-Strom", result.getProductName());
        verify(service).updateByName("Suzuki", favorite);
    }

    @Test
    void listShouldReturnFavorites() {
        when(service.listAll()).thenReturn(List.of(
                favorite(1L, "Yamaha", "R15"),
                favorite(2L, "Honda", "CB350")));

        List<Favorites> result = controller.list();

        assertEquals(2, result.size());
        verify(service).listAll();
    }

    @Test
    void listByNameShouldDelegateToService() {
        when(service.listByName("Royal Enfield")).thenReturn(List.of(
                favorite(5L, "Royal Enfield", "Hunter 350")));

        List<Favorites> result = controller.listByName("Royal Enfield");

        assertEquals(1, result.size());
        assertEquals("Royal Enfield", result.get(0).getDealerName());
        verify(service).listByName("Royal Enfield");
    }

    private Favorites favorite(Long id, String dealerName, String productName) {
        Favorites favorite = new Favorites();
        favorite.setId(id);
        favorite.setCustomerId(10L);
        favorite.setDealerId(20L);
        favorite.setDealerName(dealerName);
        favorite.setAddress("Bengaluru");
        favorite.setProductName(productName);
        favorite.setReason("Preferred");
        return favorite;
    }
}

package com.example.demo.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.demo.client.CustomerClient;
import com.example.demo.entity.Favorites;
import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.FavoritesRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FavoritesServiceImplTest {

    @Mock
    private FavoritesRepository repo;

    @Mock
    private CustomerClient customerClient;

    @InjectMocks
    private FavoritesServiceImpl service;

    @Test
    void addShouldNormalizeAndPersistFavorite() {
        Favorites favorite = favorite(null, "  Yamaha  ", "  R15  ");
        when(customerClient.getCustomer(10L)).thenReturn(new CustomerClient.CustomerSummary());
        when(repo.findByCustomerIdAndDealerIdAndProductNameIgnoreCase(10L, 20L, "R15"))
                .thenReturn(Optional.empty());
        when(repo.save(any(Favorites.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Favorites result = service.add(favorite);

        assertEquals("Yamaha", result.getDealerName());
        assertEquals("R15", result.getProductName());
        verify(customerClient).getCustomer(10L);
        verify(repo).save(favorite);
    }

    @Test
    void addShouldRejectDuplicateFavorite() {
        Favorites favorite = favorite(null, "Honda", "CB350");
        when(customerClient.getCustomer(10L)).thenReturn(new CustomerClient.CustomerSummary());
        when(repo.findByCustomerIdAndDealerIdAndProductNameIgnoreCase(10L, 20L, "CB350"))
                .thenReturn(Optional.of(favorite(99L, "Honda", "CB350")));

        assertThrows(DuplicateResourceException.class, () -> service.add(favorite));

        verify(repo, never()).save(any(Favorites.class));
    }

    @Test
    void getByIdShouldThrowWhenFavoriteMissing() {
        when(repo.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getById(99L));
    }

    @Test
    void deleteByNameShouldDeleteAllMatchingFavorites() {
        List<Favorites> favorites = List.of(
                favorite(1L, "Royal Enfield", "Classic 350"),
                favorite(2L, "Royal Enfield", "Hunter 350"));
        when(repo.findByDealerNameIgnoreCase("Royal Enfield")).thenReturn(favorites);
        doNothing().when(repo).deleteAll(favorites);

        service.deleteByName(" Royal Enfield ");

        verify(repo).deleteAll(favorites);
    }

    @Test
    void updateByNameShouldRejectMultipleMatches() {
        when(repo.findByDealerNameIgnoreCase("KTM")).thenReturn(List.of(
                favorite(1L, "KTM", "Duke 250"),
                favorite(2L, "KTM", "RC 390")));

        assertThrows(DuplicateResourceException.class,
                () -> service.updateByName("KTM", favorite(null, "KTM", "390 Adventure")));
    }

    @Test
    void updateByIdShouldReplaceExistingFavorite() {
        Favorites existing = favorite(1L, "Yamaha", "R15");
        Favorites updated = favorite(null, "  Kawasaki ", "  Ninja 300 ");
        updated.setCustomerId(11L);
        updated.setDealerId(21L);

        when(repo.findById(1L)).thenReturn(Optional.of(existing));
        when(customerClient.getCustomer(11L)).thenReturn(new CustomerClient.CustomerSummary());
        when(repo.findByCustomerIdAndDealerIdAndProductNameIgnoreCase(11L, 21L, "Ninja 300"))
                .thenReturn(Optional.empty());
        when(repo.save(existing)).thenReturn(existing);

        Favorites result = service.updateById(1L, updated);

        assertEquals(11L, result.getCustomerId());
        assertEquals("Kawasaki", result.getDealerName());
        assertEquals("Ninja 300", result.getProductName());
        verify(repo).save(existing);
    }

    @Test
    void listByNameShouldThrowWhenDealerMissing() {
        when(repo.findByDealerNameIgnoreCase("Unknown")).thenReturn(List.of());

        assertThrows(ResourceNotFoundException.class, () -> service.listByName("Unknown"));
    }

    private Favorites favorite(Long id, String dealerName, String productName) {
        Favorites favorite = new Favorites();
        favorite.setId(id);
        favorite.setCustomerId(10L);
        favorite.setDealerId(20L);
        favorite.setDealerName(dealerName);
        favorite.setAddress("Bengaluru");
        favorite.setProductName(productName);
        favorite.setReason("Good stock");
        return favorite;
    }
}

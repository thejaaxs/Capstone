package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.client.CustomerClient;
import com.example.demo.entity.Favorites;
import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.FavoritesRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoritesServiceImpl implements FavoritesService {

    private final FavoritesRepository repo;
    private final CustomerClient customerClient;

    @Override
    public Favorites add(Favorites favorite) {
        validateFavorite(favorite);
        customerClient.getCustomer(favorite.getCustomerId());
        normalizeFavorite(favorite);
        ensureUniqueFavorite(favorite, null);
        return repo.save(favorite);
    }

    @Override
    @Transactional(readOnly = true)
    public Favorites getById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Favorite '" + id + "' not found"));
    }

    @Override
    public void deleteById(Long id) {
        Favorites existing = getById(id);
        repo.delete(existing);
    }

    @Override
    public void deleteByName(String name) {
        List<Favorites> favorites = findByDealerNameOrThrow(name);
        repo.deleteAll(favorites);
    }

    @Override
    public void deleteByProductName(String product) {
        String productName = normalizeProductName(product);
        List<Favorites> favorites = repo.findByProductNameIgnoreCase(productName);
        if (favorites.isEmpty()) {
            throw new ResourceNotFoundException(
                    "No dealers found for product '" + productName + "'");
        }
        repo.deleteAll(favorites);
    }

    @Override
    public Favorites updateById(Long id, Favorites updated) {
        validateFavorite(updated);
        Favorites existing = getById(id);
        customerClient.getCustomer(updated.getCustomerId());
        normalizeFavorite(updated);
        ensureUniqueFavorite(updated, id);

        existing.setCustomerId(updated.getCustomerId());
        existing.setDealerId(updated.getDealerId());
        existing.setDealerName(updated.getDealerName());
        existing.setAddress(updated.getAddress());
        existing.setProductName(updated.getProductName());
        existing.setReason(updated.getReason());

        return repo.save(existing);
    }

    @Override
    public Favorites updateByName(String name, Favorites updated) {
        List<Favorites> favorites = findByDealerNameOrThrow(name);
        if (favorites.size() > 1) {
            throw new DuplicateResourceException(
                    "Multiple favorites found for dealer '" + name.trim() + "'. Use the id-based update endpoint.");
        }
        return updateById(favorites.get(0).getId(), updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Favorites> listAll() {
        return repo.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Favorites> listByReason(String reason) {
        return repo.findByReasonContainingIgnoreCase(reason.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Favorites> listByName(String name) {
        return findByDealerNameOrThrow(name);
    }

    private void validateFavorite(Favorites favorite) {
        if (favorite == null) {
            throw new IllegalArgumentException("Favorite object cannot be null");
        }
    }

    private void normalizeFavorite(Favorites favorite) {
        favorite.setDealerName(normalizeDealerName(favorite.getDealerName()));
        favorite.setAddress(favorite.getAddress() == null ? "" : favorite.getAddress().trim());
        favorite.setProductName(normalizeProductName(favorite.getProductName()));
        favorite.setReason(favorite.getReason() == null ? "" : favorite.getReason().trim());
    }

    private void ensureUniqueFavorite(Favorites favorite, Long ignoreId) {
        repo.findByCustomerIdAndDealerIdAndProductNameIgnoreCase(
                favorite.getCustomerId(),
                favorite.getDealerId(),
                favorite.getProductName()
        ).ifPresent(existing -> {
            if (ignoreId == null || !existing.getId().equals(ignoreId)) {
                throw new DuplicateResourceException(
                        "Favorite already exists for this dealer and product");
            }
        });
    }

    private List<Favorites> findByDealerNameOrThrow(String dealerName) {
        String normalizedDealerName = normalizeDealerName(dealerName);
        List<Favorites> favorites = repo.findByDealerNameIgnoreCase(normalizedDealerName);
        if (favorites.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Dealer '" + normalizedDealerName + "' not found in favorites");
        }
        return favorites;
    }

    private String normalizeDealerName(String dealerName) {
        if (dealerName == null || dealerName.trim().isEmpty()) {
            throw new IllegalArgumentException("Dealer name is required");
        }
        return dealerName.trim();
    }

    private String normalizeProductName(String productName) {
        return productName == null ? "" : productName.trim();
    }
}

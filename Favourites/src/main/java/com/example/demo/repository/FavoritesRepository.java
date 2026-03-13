package com.example.demo.repository;

import com.example.demo.entity.Favorites;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoritesRepository extends JpaRepository<Favorites, Long> {

    List<Favorites> findByDealerNameIgnoreCase(String dealerName);

    Optional<Favorites> findByCustomerIdAndDealerIdAndProductNameIgnoreCase(Long customerId, Long dealerId, String productName);

    List<Favorites> findByProductNameIgnoreCase(String productName);

    List<Favorites> findByReasonContainingIgnoreCase(String reason);

}

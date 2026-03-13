package com.dealer.repository;

import com.dealer.entity.Dealer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DealerRepository extends JpaRepository<Dealer, Long> {

    Optional<Dealer> findByDealerName(String dealerName);
    Optional<Dealer> findByEmail(String email);

    boolean existsByDealerName(String dealerName);
    boolean existsByEmail(String email);
}

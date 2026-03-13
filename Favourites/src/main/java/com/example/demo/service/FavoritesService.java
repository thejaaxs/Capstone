package com.example.demo.service;

import com.example.demo.entity.Favorites;
import java.util.List;

public interface FavoritesService {

    Favorites add(Favorites favorite);

    Favorites getById(Long id);

    void deleteById(Long id);

    void deleteByName(String name);

    void deleteByProductName(String product);

    Favorites updateById(Long id, Favorites updated);

    Favorites updateByName(String name, Favorites updated);

    List<Favorites> listAll();

    List<Favorites> listByReason(String reason);
    
    List<Favorites> listByName(String name);
}

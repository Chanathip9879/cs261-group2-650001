
package com.example.demo.service;

import com.example.demo.entity.Restaurant;
import com.example.demo.repository.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(
            RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    public Optional<Restaurant> getRestaurantById(Long id) {
        return restaurantRepository.findById(id);
    }
}

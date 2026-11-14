
package com.example.demo.repository;

import com.example.demo.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RestaurantRepository
        extends JpaRepository<Restaurant, Long> {
}

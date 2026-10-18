package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import com.example.demo.model.Product;

import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000") // ใส่โค้ดเพื่อให้ Frontend ที่ deployed ที่ localhost:3000 สามารถเรียก
                                                // API นี้ได้
public class ProductController {
    private final List<Product> products = new ArrayList<>();
    private final AtomicLong idCounter = new AtomicLong();

    @GetMapping
    public List<Product> getProducts() {
        return products;
    }

    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        product.setId(idCounter.incrementAndGet());
        products.add(product);
        return product;
    }
}
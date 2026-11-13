package com.example.demo.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name_th", nullable = false, length = 100)
    private String nameTh;

    @Column(length = 50)
    private String icon;

    @ManyToMany(mappedBy = "categories")
    private Set<Restaurant> restaurants = new HashSet<>();

    public Category() {
    }

    public Category(String code, String nameTh, String icon) {
        this.code = code;
        this.nameTh = nameTh;
        this.icon = icon;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getNameTh() {
        return nameTh;
    }

    public String getIcon() {
        return icon;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setNameTh(String nameTh) {
        this.nameTh = nameTh;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
}

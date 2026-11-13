package com.example.demo.model;

public class CheckStatus {

    private Long id;
    private String name;
    private boolean active = true;
    private boolean temporarilyClosed = false;

    public CheckStatus() {
    }

    public CheckStatus(Long id, String name,
                      boolean active, boolean temporarilyClosed) {
        this.id = id;
        this.name = name;
        this.active = active;
        this.temporarilyClosed = temporarilyClosed;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isTemporarilyClosed() {
        return temporarilyClosed;
    }

    public void setTemporarilyClosed(boolean temporarilyClosed) {
        this.temporarilyClosed = temporarilyClosed;
    }

    // ตรวจสอบสถานะร้านอาหาร
    public String checkStatus() {
        if (temporarilyClosed) {
            return "TemporarilyClosed";
        }

        if (!active) {
            return "Closed";
        }

        return "Open";
    }

    // ตรวจสอบว่าร้านพร้อมให้บริการหรือไม่
    public boolean isAvailable() {
        return "Open".equals(checkStatus());
    }
}

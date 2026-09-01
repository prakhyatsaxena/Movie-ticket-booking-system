package com.example.moviesystem.model;

public class Booking {

    private Long id;
    private String movie;
    private String showtime;
    private String seats;
    private double totalAmount;

    public Booking() {
    }

    public Booking(Long id, String movie, String showtime,
                   String seats, double totalAmount) {
        this.id = id;
        this.movie = movie;
        this.showtime = showtime;
        this.seats = seats;
        this.totalAmount = totalAmount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMovie() {
        return movie;
    }

    public void setMovie(String movie) {
        this.movie = movie;
    }

    public String getShowtime() {
        return showtime;
    }

    public void setShowtime(String showtime) {
        this.showtime = showtime;
    }

    public String getSeats() {
        return seats;
    }

    public void setSeats(String seats) {
        this.seats = seats;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }
}
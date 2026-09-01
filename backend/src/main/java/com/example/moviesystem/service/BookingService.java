package com.example.moviesystem.service;

import com.example.moviesystem.model.Booking;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    private final List<Booking> bookings = new ArrayList<>();

    private Long nextId = 1L;

    public Booking createBooking(Booking booking) {

        // Check every seat in the new booking
        String[] requestedSeats = booking.getSeats().split(",");

        for (String requestedSeat : requestedSeats) {

            String seat = requestedSeat.trim();

            for (Booking existingBooking : bookings) {

                // Only compare bookings for the same movie and showtime
                if (existingBooking.getMovie().equals(booking.getMovie())
                        && existingBooking.getShowtime().equals(booking.getShowtime())) {

                    String[] bookedSeats = existingBooking.getSeats().split(",");

                    for (String bookedSeat : bookedSeats) {

                        if (bookedSeat.trim().equalsIgnoreCase(seat)) {

                            throw new IllegalArgumentException(
                                    "Seat " + seat + " is already booked.");
                        }
                    }
                }
            }
        }

        // Everything is available, so save the booking
        booking.setId(nextId++);

        bookings.add(booking);

        return booking;
    }

    public List<Booking> getAllBookings() {
        return bookings;
    }
}
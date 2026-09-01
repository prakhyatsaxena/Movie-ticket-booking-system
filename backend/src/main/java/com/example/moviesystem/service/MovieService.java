package com.example.moviesystem.service;

import com.example.moviesystem.model.Movie;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MovieService {

    private final List<Movie> movies = new ArrayList<>();

    public MovieService() {

        movies.add(new Movie(
                1L,
                "The Dark Knight",
                "Action",
                "2h 32m",
                9.0,
                "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                "Batman faces one of his greatest challenges when a criminal mastermind known as the Joker plunges Gotham City into chaos."));

        movies.add(new Movie(
                2L,
                "Interstellar",
                "Sci-Fi",
                "2h 49m",
                8.7,
                "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
                "A team of explorers travels through a mysterious wormhole in space in search of a new home for humanity."));

        movies.add(new Movie(
                3L,
                "Dune: Part Two",
                "Adventure",
                "2h 46m",
                8.6,
                "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
                "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family."));

        movies.add(new Movie(
                4L,
                "Oppenheimer",
                "Drama",
                "3h 00m",
                8.6,
                "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
                "The story of J. Robert Oppenheimer and the creation of the world's first atomic bomb."));

        movies.add(new Movie(
                5L,
                "Deadpool & Wolverine",
                "Comedy",
                "2h 08m",
                7.7,
                "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
                "Deadpool's chaotic world collides with Wolverine in an unexpected adventure filled with action, humour and mayhem."));

        movies.add(new Movie(
                6L,
                "Spider-Man: No Way Home",
                "Superhero",
                "2h 28m",
                8.2,
                "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
                "Spider-Man's identity is revealed, forcing Peter Parker to seek help from Doctor Strange and confront dangerous consequences."));

        movies.add(new Movie(
                7L,
                "Avengers: Infinity War",
                "Marvel",
                "2h 29m",
                8.4,
                "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
                "The Avengers and their allies face their greatest threat as Thanos attempts to collect the Infinity Stones."));

        movies.add(new Movie(
                8L,
                "Avatar: The Way of Water",
                "Fantasy",
                "3h 12m",
                7.8,
                "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
                "Jake Sully and Neytiri build a new life with their family while seeking refuge among the ocean clans of Pandora."));
    }

    public List<Movie> getAllMovies() {
        return movies;
    }

    public Optional<Movie> getMovieById(Long id) {
        return movies.stream()
                .filter(movie -> movie.id().equals(id))
                .findFirst();
    }
}

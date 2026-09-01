
package com.example.moviesystem.model;

/**
 * Movie Record representing immutable movie entity (Java 21 feature).
 */
public record Movie(
                Long id,
                String title,
                String genre,
                String duration,
                Double rating,
                String posterUrl,
                String description) {
}

// ==========================================================================
// CineVerse - Movie Ticket Booking System
// Frontend + Spring Boot REST API + Seat Selection + My Bookings
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // 1. DOM ELEMENTS
    // ============================================================

    const bookButtons = document.querySelectorAll(".btn-book");

    const modalOverlay = document.getElementById("bookingModal");
    const modalMovieTitle = document.getElementById("modalMovieTitle");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const myBookingsBtn = document.getElementById("myBookingsBtn");

    const showtimeContainer =
        document.getElementById("showtimeContainer");

    const seatGrid =
        document.getElementById("seatGrid");

    const selectedSeatsList =
        document.getElementById("selectedSeatsList");

    const totalPrice =
        document.getElementById("totalPrice");

    const confirmBookingBtn =
        document.getElementById("confirmBookingBtn");

    const bookingWarning =
        document.getElementById("bookingWarning");

    const bookingFormView =
        document.getElementById("bookingFormView");

    const bookingSuccessView =
        document.getElementById("bookingSuccessView");

    const ticketMovieName =
        document.getElementById("ticketMovieName");

    const ticketShowtime =
        document.getElementById("ticketShowtime");

    const ticketSeats =
        document.getElementById("ticketSeats");

    const ticketTotalAmount =
        document.getElementById("ticketTotalAmount");

    const finishBookingBtn =
        document.getElementById("finishBookingBtn");


    // ============================================================
    // 2. CONFIGURATION
    // ============================================================

    const API_BASE_URL = "http://localhost:8080/api";

    const SEAT_PRICE = 200;

    let selectedSeats = [];
    let selectedMovie = "";
    let selectedShowtime = "10:00 AM";
    let bookedSeats = [];


    // ============================================================
    // 3. LOAD MOVIES DYNAMICALLY FROM BACKEND
    // ============================================================

    loadMovies();

    async function loadMovies() {
        const grid =
            document.getElementById("moviesGrid") ||
            document.querySelector(".movies-grid");

        const trendingGrid =
            document.getElementById("trendingGrid");

        if (grid) {
            grid.innerHTML = `
                <div class="movie-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading movies from cinema database...</p>
                </div>
            `;
        }

        if (trendingGrid) {
            trendingGrid.innerHTML = `
                <div class="movie-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading trending movies...</p>
                </div>
            `;
        }

        try {
            const response =
                await fetch(`${API_BASE_URL}/movies`);

            if (!response.ok) {
                throw new Error(
                    `Backend returned HTTP status ${response.status}`
                );
            }

            const movies =
                await response.json();

            if (!Array.isArray(movies) || movies.length === 0) {
                const emptyMsg = `
                    <div class="movie-error">
                        <div class="movie-error-icon">🎬</div>
                        <h3>No Movies Available</h3>
                        <p>No movies are currently playing.</p>
                    </div>
                `;
                if (grid) grid.innerHTML = emptyMsg;
                if (trendingGrid) trendingGrid.innerHTML = emptyMsg;
                return;
            }

            // Populate Now Showing Movies Grid
            if (grid) {
                grid.innerHTML = "";
                movies.forEach(movie => {
                    const card = createMovieCardElement(movie);
                    grid.appendChild(card);
                });
            }

            // Populate Trending Movies Grid (Top 4 rated movies)
            if (trendingGrid) {
                trendingGrid.innerHTML = "";
                const trendingList = [...movies]
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, 4);

                trendingList.forEach((movie, index) => {
                    const card = createMovieCardElement(movie, index + 1);
                    trendingGrid.appendChild(card);
                });
            }

            console.log(
                "CineVerse backend connected. Movies loaded:",
                movies
            );

            // Re-apply any active search and genre filter to new cards
            applyMovieFilters();

        } catch (error) {
            console.error(
                "Movie API could not be reached:",
                error.message
            );

            const errorMsg = `
                <div class="movie-error">
                    <div class="movie-error-icon">⚠️</div>
                    <h3>Unable to load movies</h3>
                    <p>Please make sure the Spring Boot backend is running on port 8080.</p>
                </div>
            `;

            if (grid) grid.innerHTML = errorMsg;
            if (trendingGrid) trendingGrid.innerHTML = errorMsg;
        }
    }

    // ============================================================
    // 4. CREATE MOVIE CARD ELEMENT
    // ============================================================

    function createMovieCardElement(movie, rank = null) {
        const card = document.createElement("article");
        card.className = "movie-card";

        const title = movie.title || "Untitled";
        const genre = movie.genre || "Action";
        const duration = movie.duration || "N/A";
        const rating = Number(movie.rating || 0).toFixed(1);
        const posterUrl = movie.posterUrl || "images/cyber-nexus.jpg";

        card.innerHTML = `
            <div class="card-poster">
                <img src="${escapeHtml(posterUrl)}" alt="${escapeHtml(title)}">
                <span class="genre-badge">${escapeHtml(genre)}</span>
                ${rank ? `<span class="trending-rank-badge">#${rank} 🔥</span>` : ""}
                <div class="poster-overlay">
                    <span class="poster-rating">⭐ ${escapeHtml(rating)}</span>
                </div>
            </div>
            <div class="card-body">
                <h3 class="movie-title">${escapeHtml(title)}</h3>
                <div class="movie-meta">
                    <span>${escapeHtml(duration)}</span>
                    <span class="rating">⭐ ${escapeHtml(rating)}</span>
                </div>
                <button type="button" class="btn btn-book" data-movie="${escapeHtml(title)}">
                    Book Now
                </button>
            </div>
        `;

        // Card click opens Movie Details modal (unless Book Now was clicked)
        card.addEventListener("click", event => {
            if (event.target.closest(".btn-book")) return;
            openMovieDetails(title, movie);
        });

        // Book Now button opens Booking modal
        const bookBtn = card.querySelector(".btn-book");
        if (bookBtn) {
            bookBtn.addEventListener("click", event => {
                event.stopPropagation();
                selectedMovie = title;
                openBookingModal();
            });
        }

        return card;
    }


    // ============================================================
    // 5. OPEN BOOKING MODAL
    // ============================================================

    function openBookingModal() {

        if (!modalOverlay) return;

        modalOverlay.classList.remove("hidden");

        bookingFormView.classList.remove("hidden");
        bookingSuccessView.classList.add("hidden");

        modalMovieTitle.textContent =
            `Book Tickets - ${selectedMovie}`;

        selectedSeats = [];
        selectedShowtime = "10:00 AM";

        bookingWarning.classList.add("hidden");

        resetShowtimeButtons();

        generateSeats();

        updateBookingSummary();

    }


    // ============================================================
    // 6. CLOSE BOOKING MODAL
    // ============================================================

    function closeBookingModal() {

        if (!modalOverlay) return;

        modalOverlay.classList.add("hidden");

    }


    if (closeModalBtn) {

        closeModalBtn.addEventListener("click", () => {

            closeBookingModal();

        });

    }


    // Close modal by clicking outside
    if (modalOverlay) {

        modalOverlay.addEventListener("click", event => {

            if (event.target === modalOverlay) {

                closeBookingModal();

            }

        });

    }


    // ============================================================
    // 7. SHOWTIME SELECTION
    // ============================================================

    if (showtimeContainer) {

        const showtimeButtons =
            showtimeContainer.querySelectorAll(".showtime-btn");

        showtimeButtons.forEach(button => {

            button.addEventListener("click", () => {

                showtimeButtons.forEach(btn => {

                    btn.classList.remove("active");

                });

                button.classList.add("active");

                selectedShowtime =
                    button.getAttribute("data-time");

                selectedSeats = [];

                generateSeats();

                updateBookingSummary();

            });

        });

    }


    // ============================================================
    // 8. RESET SHOWTIME BUTTONS
    // ============================================================

    function resetShowtimeButtons() {

        if (!showtimeContainer) return;

        const buttons =
            showtimeContainer.querySelectorAll(".showtime-btn");

        buttons.forEach(button => {

            button.classList.remove("active");

        });

        const firstButton = buttons[0];

        if (firstButton) {

            firstButton.classList.add("active");

        }

    }


    // ============================================================
    // 9. GENERATE SEATS
    // ============================================================

    async function generateSeats() {

        if (!seatGrid) return;

        seatGrid.innerHTML = "";

        try {

            const response =
                await fetch(`${API_BASE_URL}/bookings`);

            if (!response.ok) {

                throw new Error(
                    "Could not fetch existing bookings"
                );

            }

            const bookings =
                await response.json();

            bookedSeats = [];

            bookings.forEach(booking => {

                if (
                    booking.movie === selectedMovie &&
                    booking.showtime === selectedShowtime
                ) {

                    let seats = booking.seats;

                    // Backend may return seats as a string
                    if (typeof seats === "string") {

                        seats = seats
                            .split(",")
                            .map(seat => seat.trim());

                    }

                    // Backend may return seats as an array
                    if (Array.isArray(seats)) {

                        bookedSeats.push(...seats);

                    }

                }

            });

            console.log(
                "Booked seats for",
                selectedMovie,
                selectedShowtime,
                bookedSeats
            );

        } catch (error) {

            console.warn(
                "Could not load booked seats:",
                error.message
            );

            bookedSeats = [];

        }


        // ========================================================
        // CREATE SEAT GRID
        // ========================================================

        const rows = ["A", "B", "C", "D", "E"];
        const seatsPerRow = 8;

        rows.forEach(row => {

            for (let number = 1; number <= seatsPerRow; number++) {

                const seat =
                    document.createElement("button");

                seat.type = "button";

                const seatName =
                    `${row}${number}`;

                seat.textContent =
                    seatName;

                seat.setAttribute(
                    "data-seat",
                    seatName
                );

                seat.setAttribute(
                    "aria-label",
                    `Seat ${seatName}`
                );


                // Already booked
                if (bookedSeats.includes(seatName)) {

                    seat.className =
                        "seat booked";

                    seat.disabled = true;

                    seat.setAttribute(
                        "aria-label",
                        `Seat ${seatName}, already booked`
                    );

                }

                // Available
                else {

                    seat.className =
                        "seat available";

                    seat.addEventListener(
                        "click",
                        () => {

                            toggleSeat(
                                seat,
                                seatName
                            );

                        }
                    );

                }

                seatGrid.appendChild(seat);

            }

        });

    }


    // ============================================================
    // 10. SELECT / DESELECT SEAT
    // ============================================================

    function toggleSeat(seat, seatName) {

        const index =
            selectedSeats.indexOf(seatName);


        // Select
        if (index === -1) {

            selectedSeats.push(seatName);

            seat.classList.remove(
                "available"
            );

            seat.classList.add(
                "selected"
            );

        }

        // Deselect
        else {

            selectedSeats.splice(
                index,
                1
            );

            seat.classList.remove(
                "selected"
            );

            seat.classList.add(
                "available"
            );

        }


        updateBookingSummary();

        bookingWarning.classList.add(
            "hidden"
        );

    }


    // ============================================================
    // 11. UPDATE BOOKING SUMMARY
    // ============================================================

    function updateBookingSummary() {

        if (!selectedSeatsList || !totalPrice) {
            return;
        }


        if (selectedSeats.length === 0) {

            selectedSeatsList.textContent =
                "None";

            totalPrice.textContent =
                "₹0";

            return;

        }


        selectedSeats.sort();


        selectedSeatsList.textContent =
            selectedSeats.join(", ");


        const amount =
            selectedSeats.length * SEAT_PRICE;


        totalPrice.textContent =
            `₹${amount}`;

    }


    // ============================================================
    // 12. CONFIRM BOOKING
    // ============================================================

    if (confirmBookingBtn) {

        confirmBookingBtn.addEventListener(
            "click",
            async () => {

                // No seats selected
                if (selectedSeats.length === 0) {

                    bookingWarning.classList.remove(
                        "hidden"
                    );

                    return;

                }


                bookingWarning.classList.add(
                    "hidden"
                );


                const amount =
                    selectedSeats.length * SEAT_PRICE;


                const bookingData = {

                    movie: selectedMovie,

                    showtime: selectedShowtime,

                    seats: selectedSeats.join(", "),

                    totalAmount: amount

                };


                try {

                    confirmBookingBtn.disabled = true;

                    confirmBookingBtn.textContent =
                        "Booking...";


                    const response =
                        await fetch(
                            `${API_BASE_URL}/bookings`,
                            {

                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(
                                        bookingData
                                    )

                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            "Booking request failed"
                        );

                    }


                    const savedBooking =
                        await response.json();


                    // ==================================================
                    // FILL SUCCESS TICKET
                    // ==================================================

                    ticketMovieName.textContent =
                        savedBooking.movie ||
                        selectedMovie;

                    ticketShowtime.textContent =
                        savedBooking.showtime ||
                        selectedShowtime;

                    ticketSeats.textContent =
                        formatSeats(
                            savedBooking.seats ||
                            selectedSeats.join(", ")
                        );

                    ticketTotalAmount.textContent =
                        `₹${savedBooking.totalAmount ?? amount}`;


                    // Save last booking locally
                    localStorage.setItem(
                        "lastBooking",
                        JSON.stringify(
                            savedBooking
                        )
                    );


                    // Show success screen
                    bookingFormView.classList.add(
                        "hidden"
                    );

                    bookingSuccessView.classList.remove(
                        "hidden"
                    );


                    console.log(
                        "Booking saved:",
                        savedBooking
                    );


                } catch (error) {

                    console.error(
                        "Booking error:",
                        error
                    );


                    alert(
                        "Unable to complete booking.\n\n" +
                        "Please make sure the Spring Boot backend is running."
                    );

                } finally {

                    confirmBookingBtn.disabled =
                        false;

                    confirmBookingBtn.textContent =
                        "Confirm Booking";

                }

            }
        );

    }


    // ============================================================
    // 13. DONE BUTTON
    // ============================================================

    if (finishBookingBtn) {

        finishBookingBtn.addEventListener(
            "click",
            () => {

                closeBookingModal();

            }
        );

    }


    // ============================================================
    // 14. FORMAT SEATS
    // ============================================================

    function formatSeats(seats) {

        if (Array.isArray(seats)) {

            return seats.join(", ");

        }

        return String(seats);

    }


    // ============================================================
    // 15. CREATE MY BOOKINGS WINDOW
    // ============================================================

    function createBookingsOverlay() {

        let overlay =
            document.getElementById(
                "myBookingsOverlay"
            );


        if (overlay) {

            return overlay;

        }


        overlay =
            document.createElement("div");

        overlay.id =
            "myBookingsOverlay";


        overlay.innerHTML = `

            <div class="my-bookings-panel">

                <button
                    class="my-bookings-close"
                    id="closeMyBookings"
                    aria-label="Close"
                >
                    ×
                </button>

                <div class="my-bookings-header">

                    <span class="my-bookings-kicker">
                        CINEVERSE
                    </span>

                    <h2>
                        My Bookings
                    </h2>

                    <p>
                        Your complete movie booking history
                    </p>

                </div>

                <div
                    id="myBookingsContent"
                    class="my-bookings-content"
                >
                    <div class="booking-loading">
                        Loading your bookings...
                    </div>
                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        // Add styles dynamically
        addMyBookingsStyles();


        const closeButton =
            document.getElementById(
                "closeMyBookings"
            );


        closeButton.addEventListener(
            "click",
            closeMyBookings
        );


        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    closeMyBookings();

                }

            }
        );


        return overlay;

    }


    // ============================================================
    // 16. OPEN MY BOOKINGS
    // ============================================================

    async function openMyBookings() {

        const overlay =
            createBookingsOverlay();


        overlay.classList.add(
            "visible"
        );


        const content =
            document.getElementById(
                "myBookingsContent"
            );


        content.innerHTML = `

            <div class="booking-loading">

                <div class="loading-spinner"></div>

                <p>
                    Loading your bookings...
                </p>

            </div>

        `;


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/bookings`
                );


            if (!response.ok) {

                throw new Error(
                    "Could not load bookings"
                );

            }


            const bookings =
                await response.json();


            displayBookings(
                bookings,
                content
            );


        } catch (error) {

            console.error(
                "My Bookings error:",
                error
            );


            // Try last local booking as fallback
            const localBooking =
                localStorage.getItem(
                    "lastBooking"
                );


            if (localBooking) {

                try {

                    const booking =
                        JSON.parse(
                            localBooking
                        );


                    displayBookings(
                        [booking],
                        content,
                        true
                    );


                } catch {

                    showNoBookings(
                        content
                    );

                }

            } else {

                content.innerHTML = `

                    <div class="booking-error">

                        <div class="booking-error-icon">
                            ⚠️
                        </div>

                        <h3>
                            Unable to load bookings
                        </h3>

                        <p>
                            Please make sure the Spring Boot
                            backend is running.
                        </p>

                    </div>

                `;

            }

        }

    }


    // ============================================================
    // 17. DISPLAY BOOKINGS
    // ============================================================

    function displayBookings(
        bookings,
        container,
        isFallback = false
    ) {

        if (
            !Array.isArray(bookings) ||
            bookings.length === 0
        ) {

            showNoBookings(
                container
            );

            return;

        }


        // Newest first
        const sortedBookings =
            [...bookings].reverse();


        container.innerHTML = `

            <div class="booking-count">

                <span>
                    ${sortedBookings.length}
                    ${sortedBookings.length === 1
                ? "Booking"
                : "Bookings"}
                </span>

                ${isFallback
                ? `<small>Showing locally saved booking</small>`
                : ""
            }

            </div>

            <div class="booking-list">

                ${sortedBookings
                .map(
                    (booking, index) =>
                        createBookingCard(
                            booking,
                            index
                        )
                )
                .join("")}

            </div>

        `;

    }


    // ============================================================
    // 18. CREATE BOOKING CARD
    // ============================================================

    function createBookingCard(
        booking,
        index
    ) {

        const movie =
            booking.movie ||
            "Unknown Movie";


        const showtime =
            booking.showtime ||
            "Not specified";


        const seats =
            formatSeats(
                booking.seats ||
                "Not specified"
            );


        const amount =
            booking.totalAmount ??
            0;


        const bookingId =
            booking.id ??
            `CV-${String(index + 1).padStart(4, "0")}`;


        return `

            <article class="booking-card">

                <div class="booking-card-top">

                    <div>

                        <span class="booking-status">
                            ✓ CONFIRMED
                        </span>

                        <h3>
                            ${escapeHtml(movie)}
                        </h3>

                    </div>

                    <div class="booking-id">

                        BOOKING #${escapeHtml(
            String(bookingId)
        )}

                    </div>

                </div>


                <div class="booking-divider"></div>


                <div class="booking-info-grid">

                    <div class="booking-info-item">

                        <span class="booking-info-label">
                            SHOWTIME
                        </span>

                        <strong>
                            🕐 ${escapeHtml(
            String(showtime)
        )}
                        </strong>

                    </div>


                    <div class="booking-info-item">

                        <span class="booking-info-label">
                            SEATS
                        </span>

                        <strong>
                            💺 ${escapeHtml(
            String(seats)
        )}
                        </strong>

                    </div>


                    <div class="booking-info-item">

                        <span class="booking-info-label">
                            TOTAL
                        </span>

                        <strong class="booking-amount">
                            ₹${escapeHtml(
            String(amount)
        )}
                        </strong>

                    </div>

                </div>


                <div class="booking-card-footer">

                    <span>
                        🎟️ Movie Ticket
                    </span>

                    <span>
                        CineVerse
                    </span>

                </div>

            </article>

        `;

    }


    // ============================================================
    // 19. NO BOOKINGS MESSAGE
    // ============================================================

    function showNoBookings(container) {

        container.innerHTML = `

            <div class="no-bookings">

                <div class="no-bookings-icon">
                    🎬
                </div>

                <h3>
                    No Bookings Yet
                </h3>

                <p>
                    Your booked movie tickets will
                    appear here.
                </p>

            </div>

        `;

    }


    // ============================================================
    // 20. CLOSE MY BOOKINGS
    // ============================================================

    function closeMyBookings() {

        const overlay =
            document.getElementById(
                "myBookingsOverlay"
            );


        if (overlay) {

            overlay.classList.remove(
                "visible"
            );

        }

    }


    // ============================================================
    // 21. ESCAPE HTML
    // ============================================================

    function escapeHtml(value) {

        return String(value)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }


    // ============================================================
    // 22. MY BOOKINGS STYLES
    // ============================================================

    function addMyBookingsStyles() {

        if (
            document.getElementById(
                "myBookingsStyles"
            )
        ) {

            return;

        }


        const style =
            document.createElement("style");


        style.id =
            "myBookingsStyles";


        style.textContent = `

            #myBookingsOverlay {

                position: fixed;

                inset: 0;

                z-index: 99999;

                display: flex;

                align-items: center;

                justify-content: center;

                padding: 30px;

                background:
                    rgba(3, 7, 18, 0.88);

                backdrop-filter:
                    blur(10px);

                opacity: 0;

                visibility: hidden;

                transition:
                    opacity 0.25s ease,
                    visibility 0.25s ease;

            }


            #myBookingsOverlay.visible {

                opacity: 1;

                visibility: visible;

            }


            .my-bookings-panel {

                position: relative;

                width: min(
                    900px,
                    100%
                );

                max-height: 90vh;

                overflow-y: auto;

                padding: 36px;

                border: 1px solid
                    rgba(255,255,255,0.12);

                border-radius: 24px;

                background:
                    linear-gradient(
                        145deg,
                        #111b2e,
                        #080d19
                    );

                box-shadow:
                    0 30px 80px
                    rgba(0,0,0,0.55);

            }


            .my-bookings-close {

                position: absolute;

                top: 18px;

                right: 22px;

                width: 42px;

                height: 42px;

                border: 1px solid
                    rgba(255,255,255,0.12);

                border-radius: 50%;

                background:
                    rgba(255,255,255,0.06);

                color: white;

                font-size: 28px;

                cursor: pointer;

                transition:
                    0.2s ease;

            }


            .my-bookings-close:hover {

                background: #f20b46;

                transform: rotate(90deg);

            }


            .my-bookings-kicker {

                color: #ff174f;

                font-size: 12px;

                font-weight: 800;

                letter-spacing: 2px;

            }


            .my-bookings-header h2 {

                margin: 7px 0;

                color: white;

                font-size: 32px;

            }


            .my-bookings-header p {

                margin: 0 0 28px;

                color: #8fa1bd;

            }


            .booking-count {

                display: flex;

                justify-content: space-between;

                align-items: center;

                margin-bottom: 16px;

                color: #a9b7cc;

                font-size: 14px;

            }


            .booking-count span {

                font-weight: 700;

            }


            .booking-count small {

                color: #71819b;

            }


            .booking-list {

                display: grid;

                gap: 16px;

            }


            .booking-card {

                padding: 22px;

                border: 1px solid
                    rgba(255,255,255,0.09);

                border-radius: 18px;

                background:
                    linear-gradient(
                        135deg,
                        #17243a,
                        #101a2c
                    );

                transition:
                    transform 0.2s ease,
                    border-color 0.2s ease;

            }


            .booking-card:hover {

                transform:
                    translateY(-2px);

                border-color:
                    rgba(255,23,79,0.45);

            }


            .booking-card-top {

                display: flex;

                align-items: flex-start;

                justify-content: space-between;

                gap: 20px;

            }


            .booking-status {

                display: inline-block;

                margin-bottom: 7px;

                color: #5ee7a0;

                font-size: 11px;

                font-weight: 800;

                letter-spacing: 1px;

            }


            .booking-card h3 {

                margin: 0;

                color: white;

                font-size: 22px;

            }


            .booking-id {

                color: #73839c;

                font-size: 11px;

                font-weight: 700;

                white-space: nowrap;

            }


            .booking-divider {

                height: 1px;

                margin: 18px 0;

                background:
                    rgba(255,255,255,0.08);

            }


            .booking-info-grid {

                display: grid;

                grid-template-columns:
                    repeat(3, 1fr);

                gap: 15px;

            }


            .booking-info-item {

                display: flex;

                flex-direction: column;

                gap: 6px;

            }


            .booking-info-label {

                color: #71819b;

                font-size: 10px;

                font-weight: 800;

                letter-spacing: 1px;

            }


            .booking-info-item strong {

                color: #e7edf7;

                font-size: 14px;

            }


            .booking-info-item
            .booking-amount {

                color: #ffc400;

                font-size: 18px;

            }


            .booking-card-footer {

                display: flex;

                justify-content: space-between;

                margin-top: 20px;

                padding-top: 14px;

                border-top: 1px dashed
                    rgba(255,255,255,0.1);

                color: #697993;

                font-size: 11px;

            }


            .booking-loading {

                min-height: 200px;

                display: flex;

                flex-direction: column;

                align-items: center;

                justify-content: center;

                color: #8fa1bd;

            }


            .loading-spinner {

                width: 34px;

                height: 34px;

                margin-bottom: 14px;

                border: 3px solid
                    rgba(255,255,255,0.1);

                border-top-color:
                    #f20b46;

                border-radius: 50%;

                animation:
                    cineSpin 0.8s linear infinite;

            }


            @keyframes cineSpin {

                to {
                    transform: rotate(360deg);
                }

            }


            .no-bookings {

                padding: 70px 20px;

                text-align: center;

            }


            .no-bookings-icon {

                font-size: 55px;

                margin-bottom: 12px;

            }


            .no-bookings h3 {

                margin: 0 0 8px;

                color: white;

                font-size: 24px;

            }


            .no-bookings p {

                margin: 0;

                color: #8190a8;

            }


            .booking-error {

                padding: 60px 20px;

                text-align: center;

            }


            .booking-error-icon {

                font-size: 45px;

                margin-bottom: 12px;

            }


            .booking-error h3 {

                color: white;

                margin-bottom: 8px;

            }


            .booking-error p {

                color: #8190a8;

            }


            @media (max-width: 650px) {

                #myBookingsOverlay {

                    padding: 12px;

                }


                .my-bookings-panel {

                    padding: 24px 18px;

                    max-height: 94vh;

                }


                .my-bookings-header h2 {

                    font-size: 26px;

                }


                .booking-card-top {

                    flex-direction: column;

                    gap: 8px;

                }


                .booking-info-grid {

                    grid-template-columns: 1fr;

                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    // ============================================================
    // 23. MY BOOKINGS BUTTON
    // ============================================================

    if (myBookingsBtn) {

        myBookingsBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                openMyBookings();

            }
        );

    }


    // ============================================================
    // 23B. NAVBAR ACTIVE STATE & SMOOTH SCROLLING
    // ============================================================

    const navLinks =
        document.querySelectorAll(
            ".nav-links .nav-link:not(#myBookingsBtn)"
        );

    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            const href = this.getAttribute("href");
            if (href && href.startsWith("#") && href.length > 1) {
                event.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            } else if (href === "#") {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }

            navLinks.forEach(l => l.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Handle "View All Movies →" / "← Now Showing" return links
    document.querySelectorAll(".view-all-btn").forEach(btn => {
        btn.addEventListener("click", function (event) {
            const href = this.getAttribute("href");
            if (href && href === "#movies") {
                event.preventDefault();
                const moviesSection = document.getElementById("movies");
                if (moviesSection) {
                    moviesSection.scrollIntoView({ behavior: "smooth" });
                }
                navLinks.forEach(l => {
                    if (l.getAttribute("href") === "#movies") {
                        l.classList.add("active");
                    } else {
                        l.classList.remove("active");
                    }
                });
            }
        });
    });


    // ============================================================
    // 24. CENTRALIZED MOVIE FILTER & SEARCH SYSTEM
    // ============================================================

    const movieSearch =
        document.getElementById("movieSearch");

    const filterButtons =
        document.querySelectorAll(".movie-filter-btn");

    const moviesGrid =
        document.querySelector("#movies .movies-grid") ||
        document.querySelector(".movies-grid");

    let currentGenreFilter = "all";

    function applyMovieFilters() {
        const movieCards =
            document.querySelectorAll(
                "#movies .movies-grid .movie-card"
            );

        const searchText =
            movieSearch
                ? movieSearch.value.trim().toLowerCase()
                : "";

        let visibleMovies = 0;

        movieCards.forEach(card => {
            const titleElement =
                card.querySelector(".movie-title");

            const genreElement =
                card.querySelector(".genre-badge");

            const title =
                titleElement
                    ? titleElement.textContent.trim().toLowerCase()
                    : "";

            const genre =
                genreElement
                    ? genreElement.textContent.trim().toLowerCase()
                    : "";

            // Matches selected genre or 'all'
            const matchesGenre =
                currentGenreFilter === "all" ||
                genre.includes(currentGenreFilter);

            // Matches search query (in title or genre) or empty search
            const matchesSearch =
                !searchText ||
                title.includes(searchText) ||
                genre.includes(searchText);

            if (matchesGenre && matchesSearch) {
                card.classList.remove("filter-hidden");
                card.style.display = "";
                visibleMovies++;
            } else {
                card.classList.add("filter-hidden");
            }
        });

        // Manage "No Movies Found" state
        updateNoResultsState(visibleMovies, searchText);
    }

    function updateNoResultsState(visibleMovies, searchText) {
        let noResults =
            document.getElementById(
                "movieSearchNoResults"
            );

        if (visibleMovies === 0) {
            if (!noResults && moviesGrid) {
                noResults =
                    document.createElement("div");

                noResults.id =
                    "movieSearchNoResults";

                noResults.innerHTML = `
                    <div class="search-empty-icon">
                        🎬
                    </div>
                    <h3>
                        No Movies Found
                    </h3>
                    <p id="searchQueryMessage">
                        No movies match your selected criteria.
                    </p>
                `;

                moviesGrid.parentElement.appendChild(
                    noResults
                );

                addSearchEmptyStyles();
            }

            const messageElement =
                document.getElementById(
                    "searchQueryMessage"
                );

            if (messageElement) {
                if (searchText) {
                    messageElement.innerHTML =
                        `We couldn't find a movie matching "<span id="searchQueryText">${escapeHtml(searchText)}</span>".`;
                } else {
                    messageElement.textContent =
                        `No movies found for the selected category.`;
                }
            }
        } else {
            if (noResults) {
                noResults.remove();
            }
        }
    }

    // Genre filter button listeners
    filterButtons.forEach(button => {
        button.addEventListener("click", function () {
            currentGenreFilter =
                (this.dataset.filter || "all").toLowerCase();

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            this.classList.add("active");

            applyMovieFilters();
        });
    });

    // Search input listener
    if (movieSearch) {
        movieSearch.addEventListener(
            "input",
            function () {
                applyMovieFilters();
            }
        );

        movieSearch.addEventListener(
            "keydown",
            function (event) {
                if (event.key === "Escape") {
                    this.value = "";
                    applyMovieFilters();
                    this.blur();
                }
            }
        );
    }

    /* ============================================================
       SEARCH EMPTY STATE STYLES
       ============================================================ */

    function addSearchEmptyStyles() {

        if (
            document.getElementById(
                "searchEmptyStyles"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "searchEmptyStyles";

        style.textContent = `
        #movieSearchNoResults {
            width: 100%;
            padding: 70px 20px;
            text-align: center;
            color: #94a3b8;
            grid-column: 1 / -1;
        }

        .search-empty-icon {
            font-size: 55px;
            margin-bottom: 15px;
            opacity: 0.85;
        }

        #movieSearchNoResults h3 {
            margin: 0 0 8px;
            color: #f8fafc;
            font-size: 24px;
        }

        #movieSearchNoResults p {
            margin: 0;
            color: #71819b;
            font-size: 14px;
        }

        #searchQueryText {
            color: #ff315f;
            font-weight: 700;
        }
    `;

        document.head.appendChild(style);
    }


    // ============================================================
    // 26. INITIAL MESSAGE
    // ============================================================

    console.log(
        "CineVerse initialized successfully."
    );

});
/* ============================================================
   MOVIE DETAILS MODAL
   ============================================================ */

const movieDetailsModal = document.getElementById("movieDetailsModal");
const closeMovieDetails = document.getElementById("closeMovieDetails");

const detailsPoster = document.getElementById("detailsPoster");
const detailsTitle = document.getElementById("detailsTitle");
const detailsGenre = document.getElementById("detailsGenre");
const detailsRating = document.getElementById("detailsRating");
const detailsDuration = document.getElementById("detailsDuration");
const detailsDescription = document.getElementById("detailsDescription");

const detailsBookBtn = document.getElementById("detailsBookBtn");
const detailsTrailerBtn = document.getElementById("detailsTrailerBtn");

let currentDetailsMovie = "";


/* Movie information */

const movieDetails = {

    "The Dark Knight": {
        poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        genre: "ACTION",
        rating: "⭐ 9.0",
        duration: "2h 32m",
        description:
            "Batman faces one of his greatest challenges when a criminal mastermind known as the Joker plunges Gotham City into chaos."
    },

    "Interstellar": {
        poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        genre: "SCI-FI",
        rating: "⭐ 8.7",
        duration: "2h 49m",
        description:
            "A team of explorers travels through a mysterious wormhole in space in search of a new home for humanity."
    },

    "Dune: Part Two": {
        poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        genre: "ADVENTURE",
        rating: "⭐ 8.6",
        duration: "2h 46m",
        description:
            "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family."
    },

    "Oppenheimer": {
        poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        genre: "DRAMA",
        rating: "⭐ 8.6",
        duration: "3h 00m",
        description:
            "The story of J. Robert Oppenheimer and the creation of the world's first atomic bomb."
    },

    "Deadpool & Wolverine": {
        poster: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
        genre: "COMEDY",
        rating: "⭐ 7.7",
        duration: "2h 08m",
        description:
            "Deadpool's chaotic world collides with Wolverine in an unexpected adventure filled with action, humour and mayhem."
    },

    "Spider-Man: No Way Home": {
        poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
        genre: "SUPERHERO",
        rating: "⭐ 8.2",
        duration: "2h 28m",
        description:
            "Spider-Man's identity is revealed, forcing Peter Parker to seek help from Doctor Strange and confront dangerous consequences."
    },

    "Avengers: Infinity War": {
        poster: "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        genre: "MARVEL",
        rating: "⭐ 8.4",
        duration: "2h 29m",
        description:
            "The Avengers and their allies face their greatest threat as Thanos attempts to collect the Infinity Stones."
    },

    "Avatar: The Way of Water": {
        poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        genre: "FANTASY",
        rating: "⭐ 7.8",
        duration: "3h 12m",
        description:
            "Jake Sully and Neytiri build a new life with their family while seeking refuge among the ocean clans of Pandora."
    }

};


/* Open movie details function */

function openMovieDetails(movieName, fallbackData) {
    const movie =
        movieDetails[movieName] ||
        (fallbackData
            ? {
                  poster: fallbackData.posterUrl,
                  genre: (fallbackData.genre || "ACTION").toUpperCase(),
                  rating: `⭐ ${Number(fallbackData.rating || 0).toFixed(1)}`,
                  duration: fallbackData.duration || "2h 30m",
                  description:
                      fallbackData.description ||
                      "Experience this movie on the big screen with CineVerse."
              }
            : null);

    if (!movie) return;

    currentDetailsMovie = movieName;

    if (detailsPoster) {
        detailsPoster.src = movie.poster;
        detailsPoster.alt = movieName + " Poster";
    }

    if (detailsTitle) detailsTitle.textContent = movieName;
    if (detailsGenre) detailsGenre.textContent = movie.genre;
    if (detailsRating) detailsRating.textContent = movie.rating;
    if (detailsDuration) detailsDuration.textContent = movie.duration;
    if (detailsDescription) detailsDescription.textContent = movie.description;

    if (movieDetailsModal) {
        movieDetailsModal.classList.remove("hidden");
    }
}


/* Close modal */

if (closeMovieDetails) {
    closeMovieDetails.addEventListener("click", () => {
        if (movieDetailsModal) {
            movieDetailsModal.classList.add("hidden");
        }
    });
}


/* Close by clicking outside */

if (movieDetailsModal) {
    movieDetailsModal.addEventListener("click", event => {
        if (event.target === movieDetailsModal) {
            movieDetailsModal.classList.add("hidden");
        }
    });
}


/* Escape key */

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && movieDetailsModal) {
        movieDetailsModal.classList.add("hidden");
    }
});


/* Book Tickets from details */

if (detailsBookBtn) {
    detailsBookBtn.addEventListener("click", () => {
        if (movieDetailsModal) {
            movieDetailsModal.classList.add("hidden");
        }

        const originalBookButton =
            document.querySelector(
                `.btn-book[data-movie="${CSS.escape(currentDetailsMovie)}"]`
            );

        if (originalBookButton) {
            originalBookButton.click();
        } else if (currentDetailsMovie) {
            selectedMovie = currentDetailsMovie;
            openBookingModal();
        }
    });
}


/* ============================================================
   TRAILER SYSTEM — ROBUST VERSION
   ============================================================ */

const trailerVideos = {
    "The Dark Knight":
        "https://www.youtube.com/embed/EXeTwQWrcwY?autoplay=1&rel=0",

    "Interstellar":
        "https://www.youtube.com/embed/zSWdZVtXT7E?autoplay=1&rel=0",

    "Dune: Part Two":
        "https://www.youtube.com/embed/Way9Dexny3w?autoplay=1&rel=0",

    "Oppenheimer":
        "https://www.youtube.com/embed/uYPbbksJxIg?autoplay=1&rel=0",

    "Deadpool & Wolverine":
        "https://www.youtube.com/embed/73_1biulkYk?autoplay=1&rel=0",

    "Spider-Man: No Way Home":
        "https://www.youtube.com/embed/JfVOs4VSpmA?autoplay=1&rel=0",

    "Avengers: Infinity War":
        "https://www.youtube.com/embed/6ZfuNTqbHE8?autoplay=1&rel=0",

    "Avatar: The Way of Water":
        "https://www.youtube.com/embed/d9MyW72ELq0?autoplay=1&rel=0"
};


/* ============================================================
   CREATE TRAILER MODAL
   ============================================================ */

function createTrailerModal() {

    let modal =
        document.getElementById("cineTrailerModal");

    if (modal) {
        return modal;
    }

    modal = document.createElement("div");

    modal.id = "cineTrailerModal";

    modal.innerHTML = `
        <div class="cine-trailer-panel">

            <button
                type="button"
                class="cine-trailer-close"
                id="cineTrailerClose"
                aria-label="Close trailer"
            >
                ×
            </button>

            <div class="cine-trailer-header">

                <span class="cine-trailer-kicker">
                    CINEVERSE
                </span>

                <h2 id="cineTrailerTitle">
                    Movie Trailer
                </h2>

            </div>

            <div
                class="cine-trailer-body"
                id="cineTrailerBody"
            >

                <div class="cine-trailer-preview">

                    <button
                        type="button"
                        class="cine-trailer-play"
                        id="cineTrailerPlay"
                        aria-label="Play trailer"
                    >
                        ▶
                    </button>

                    <h3>
                        Trailer Preview
                    </h3>

                    <p>
                        Click the play button to watch the trailer.
                    </p>

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);


    /* ========================================================
       TRAILER CSS
       ======================================================== */

    const style =
        document.createElement("style");

    style.id =
        "cineTrailerStyles";

    style.textContent = `

        #cineTrailerModal {
            position: fixed;
            inset: 0;
            z-index: 999999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(0, 0, 0, 0.88);
            backdrop-filter: blur(8px);
        }

        #cineTrailerModal.cine-trailer-visible {
            display: flex;
        }

        .cine-trailer-panel {
            position: relative;
            width: min(1000px, 96vw);
            max-height: 94vh;
            overflow: hidden;
            border-radius: 22px;
            border: 1px solid rgba(255,255,255,0.12);
            background: #080d19;
            box-shadow:
                0 30px 100px rgba(0,0,0,0.7);
        }

        .cine-trailer-header {
            padding: 22px 28px 18px;
            background:
                linear-gradient(
                    135deg,
                    #111d32,
                    #0a101d
                );
        }

        .cine-trailer-kicker {
            color: #f20b46;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
        }

        .cine-trailer-header h2 {
            margin: 6px 45px 0 0;
            color: white;
            font-size: 25px;
        }

        .cine-trailer-close {
            position: absolute;
            top: 15px;
            right: 18px;
            z-index: 20;

            width: 42px;
            height: 42px;

            border: 1px solid
                rgba(255,255,255,0.15);

            border-radius: 50%;

            background:
                rgba(255,255,255,0.08);

            color: white;

            font-size: 29px;
            line-height: 1;

            cursor: pointer;

            transition:
                transform 0.2s ease,
                background 0.2s ease;
        }

        .cine-trailer-close:hover {
            background: #f20b46;
            transform: rotate(90deg);
        }

        .cine-trailer-body {
            width: 100%;
            min-height: 560px;

            background:
                radial-gradient(
                    circle at center,
                    #17243a 0%,
                    #080d17 70%
                );
        }

        .cine-trailer-preview {
            min-height: 560px;
            width: 100%;

            display: flex;
            flex-direction: column;

            align-items: center;
            justify-content: center;

            text-align: center;
        }

        .cine-trailer-play {
            position: relative;
            z-index: 10;

            width: 110px;
            height: 110px;

            border: none;
            border-radius: 50%;

            background: #f20b46;
            color: white;

            font-size: 43px;
            padding-left: 8px;

            cursor: pointer;

            box-shadow:
                0 0 0 0
                rgba(242,11,70,0.55),

                0 0 50px
                rgba(242,11,70,0.6);

            transition:
                transform 0.2s ease,
                box-shadow 0.2s ease;
        }

        .cine-trailer-play:hover {
            transform: scale(1.08);

            box-shadow:
                0 0 0 14px
                rgba(242,11,70,0.12),

                0 0 70px
                rgba(242,11,70,0.75);
        }

        .cine-trailer-preview h3 {
            margin:
                25px 0 8px;

            color: white;
            font-size: 27px;
        }

        .cine-trailer-preview p {
            margin: 0;
            color: #8190a8;
            font-size: 15px;
        }

        .cine-trailer-video {
            width: 100%;
            height: 560px;
            background: black;
        }

        .cine-trailer-video iframe {
            display: block;

            width: 100%;
            height: 100%;

            border: 0;
        }

        @media (max-width: 700px) {

            #cineTrailerModal {
                padding: 10px;
            }

            .cine-trailer-panel {
                width: 100%;
                border-radius: 15px;
            }

            .cine-trailer-body {
                min-height: 350px;
            }

            .cine-trailer-preview {
                min-height: 350px;
            }

            .cine-trailer-video {
                height: 350px;
            }

            .cine-trailer-play {
                width: 82px;
                height: 82px;
                font-size: 32px;
            }
        }
    `;

    document.head.appendChild(style);

    return modal;
}


/* ============================================================
   CLOSE TRAILER
   ============================================================ */

function closeCineTrailer() {

    const modal =
        document.getElementById(
            "cineTrailerModal"
        );

    if (!modal) return;

    const body =
        document.getElementById(
            "cineTrailerBody"
        );

    if (body) {

        body.innerHTML = `

            <div class="cine-trailer-preview">

                <button
                    type="button"
                    class="cine-trailer-play"
                    id="cineTrailerPlay"
                    aria-label="Play trailer"
                >
                    ▶
                </button>

                <h3>
                    Trailer Preview
                </h3>

                <p>
                    Click the play button to watch the trailer.
                </p>

            </div>
        `;

        attachTrailerPlayButton();
    }

    modal.classList.remove(
        "cine-trailer-visible"
    );
}


/* ============================================================
   PLAY TRAILER
   ============================================================ */

function playCineTrailer(movieName) {

    const body =
        document.getElementById(
            "cineTrailerBody"
        );

    if (!body) return;

    const videoURL =
        trailerVideos[movieName];

    if (!videoURL) {

        body.innerHTML = `

            <div class="cine-trailer-preview">

                <div style="
                    font-size:55px;
                    margin-bottom:20px;
                ">
                    🎬
                </div>

                <h3>
                    Trailer Unavailable
                </h3>

                <p>
                    The trailer for this movie is
                    currently unavailable.
                </p>

            </div>
        `;

        return;
    }

    body.innerHTML = `

        <div class="cine-trailer-video">

            <iframe
                src="${videoURL}"
                title="${movieName} Official Trailer"

                allow="
                    accelerometer;
                    autoplay;
                    clipboard-write;
                    encrypted-media;
                    gyroscope;
                    picture-in-picture;
                    web-share
                "

                allowfullscreen>
            </iframe>

        </div>
    `;
}


/* ============================================================
   PLAY BUTTON HANDLER
   ============================================================ */

function attachTrailerPlayButton() {

    const playButton =
        document.getElementById(
            "cineTrailerPlay"
        );

    if (!playButton) return;

    playButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            const titleElement =
                document.getElementById(
                    "cineTrailerTitle"
                );

            const movieName =
                titleElement
                    ? titleElement.textContent.trim()
                    : "The Dark Knight";

            playCineTrailer(
                movieName
            );
        }
    );
}


/* ============================================================
   OPEN TRAILER
   ============================================================ */

function openCineTrailer(movieName) {

    const modal =
        createTrailerModal();

    const title =
        movieName ||
        "The Dark Knight";

    const titleElement =
        document.getElementById(
            "cineTrailerTitle"
        );

    if (titleElement) {

        titleElement.textContent =
            title;
    }

    const body =
        document.getElementById(
            "cineTrailerBody"
        );

    if (body) {

        body.innerHTML = `

            <div class="cine-trailer-preview">

                <button
                    type="button"
                    class="cine-trailer-play"
                    id="cineTrailerPlay"
                    aria-label="Play trailer"
                >
                    ▶
                </button>

                <h3>
                    Trailer Preview
                </h3>

                <p>
                    Click the play button to watch the trailer.
                </p>

            </div>
        `;

        attachTrailerPlayButton();
    }

    modal.classList.add(
        "cine-trailer-visible"
    );
}


/* ============================================================
   HERO TRAILER BUTTON
   ============================================================ */

const trailerButton =
    document.querySelector(
        ".hero-trailer-btn"
    );

if (trailerButton) {

    trailerButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            openCineTrailer(
                "The Dark Knight"
            );
        }
    );
}


/* ============================================================
   TRAILER FROM MOVIE DETAILS
   ============================================================ */

if (detailsTrailerBtn) {

    detailsTrailerBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            if (movieDetailsModal) {

                movieDetailsModal.classList.add(
                    "hidden"
                );
            }

            openCineTrailer(
                currentDetailsMovie ||
                "The Dark Knight"
            );
        }
    );
}


/* ============================================================
   CLOSE BUTTON
   ============================================================ */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target &&
            event.target.id ===
            "cineTrailerClose"
        ) {

            closeCineTrailer();
        }
    }
);


/* ============================================================
   CLICK OUTSIDE TRAILER
   ============================================================ */

document.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "cineTrailerModal"
            );

        if (
            modal &&
            event.target === modal
        ) {

            closeCineTrailer();
        }
    }
);


/* ============================================================
   ESCAPE KEY
   ============================================================ */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeCineTrailer();
        }
    }
);
const API_KEY = "52e8c260be43feecca1a8cef0a780148";

const recommendationEngine = new RecommendationEngine(API_KEY);
const watchlistManager = new WatchlistManager();

// Elements
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const watchedListContainer = document.getElementById("watchedList");
const generateBtn = document.getElementById("generateBtn");
const moodSelect = document.getElementById("mood");
const timeSelect = document.getElementById("time");
const yearInput = document.getElementById("year");
const resultsMessage = document.getElementById("resultsMessage");
const loadMoreBtn = document.getElementById("loadMoreBtn");

// Modal elements
const modal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

// Load more state
let currentMovies = [];
let visibleCount = 8;
const moviesPerLoad = 8;

// SEARCH
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const query = searchInput.value.trim();
  if (!query) return;

  resultsMessage.textContent = `Showing search results for "${query}".`;
  resultsContainer.innerHTML = "<p>Loading movies...</p>";
  loadMoreBtn.classList.add("hidden");

  try {
    const movies = await recommendationEngine.fetchMovies(query);

    currentMovies = recommendationEngine.removeWatched(
      movies,
      watchlistManager.watchedMovies
    );

    visibleCount = moviesPerLoad;
    displayCurrentMovies();
  } catch (error) {
    console.error("Error fetching movies:", error);
    resultsContainer.innerHTML =
      '<p class="empty-state">Failed to load movies.</p>';
  }
});

// QUIZ
generateBtn.addEventListener("click", async () => {
  const mood = moodSelect.value;
  const timePreference = timeSelect.value;
  const year = parseInt(yearInput.value, 10);

  const timeText =
    timePreference === "any" ? "no time limit" : `${timePreference} viewing time`;

  const yearText = year ? ` from ${year} to present` : "";

  resultsMessage.textContent = `Showing recommendations for a ${mood} mood with ${timeText}${yearText}.`;
  resultsContainer.innerHTML = "<p>Generating recommendations...</p>";
  loadMoreBtn.classList.add("hidden");

  try {
    const movies = await recommendationEngine.fetchMovies(mood);

    const timeFiltered = filterByTime(movies, timePreference);
    const yearFiltered = filterByYear(timeFiltered, year);

    currentMovies = recommendationEngine.removeWatched(
      yearFiltered,
      watchlistManager.watchedMovies
    );

    visibleCount = moviesPerLoad;
    displayCurrentMovies();
  } catch (error) {
    console.error("Error generating recommendations:", error);
    resultsContainer.innerHTML =
      '<p class="empty-state">Failed to generate recommendations.</p>';
  }
});

// LOAD MORE
loadMoreBtn.addEventListener("click", () => {
  visibleCount += moviesPerLoad;
  displayCurrentMovies();
});

// FILTER BY TIME
function filterByTime(movies, timePreference) {
  if (timePreference === "any") {
    return movies;
  }

  return movies.filter((movie) => {
    const year = parseInt(movie.getYear(), 10);

    if (timePreference === "short") {
      return movie.rating < 7.5 || year < 2015 || Number.isNaN(year);
    }

    if (timePreference === "medium") {
      return movie.rating >= 5;
    }

    if (timePreference === "long") {
      return movie.rating >= 7;
    }

    return true;
  });
}

// FILTER BY YEAR
function filterByYear(movies, year) {
  if (!year || Number.isNaN(year)) {
    return movies;
  }

  return movies.filter((movie) => {
    const movieYear = parseInt(movie.getYear(), 10);
    return !Number.isNaN(movieYear) && movieYear >= year;
  });
}

// DISPLAY CURRENT MOVIES WITH LOAD MORE
function displayCurrentMovies() {
  const moviesToShow = currentMovies.slice(0, visibleCount);
  displayResults(moviesToShow);

  if (visibleCount < currentMovies.length) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }
}

// DISPLAY RESULTS
function displayResults(movies) {
  resultsContainer.innerHTML = "";

  if (movies.length === 0) {
    resultsContainer.innerHTML =
      '<p class="empty-state">No movies found. Try a different mood, year, or time option.</p>';
    loadMoreBtn.classList.add("hidden");
    return;
  }

  movies.forEach((movie) => {
    const card = createMovieCard(movie, true);
    resultsContainer.appendChild(card);
  });

  if (typeof gsap !== "undefined") {
    gsap.from(".movie-card", {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.1
    });
  }
}

// WATCHED LIST
function displayWatchedList() {
  watchedListContainer.innerHTML = "";

  if (watchlistManager.watchedMovies.length === 0) {
    watchedListContainer.innerHTML =
      '<p class="empty-state">No watched movies yet.</p>';
    return;
  }

  watchlistManager.watchedMovies.forEach((movieData) => {
    const movie = new Movie(movieData);
    const card = createMovieCard(movie, false);
    watchedListContainer.appendChild(card);
  });
}

// CREATE MOVIE CARD
function createMovieCard(movie, showAddButton) {
  const card = document.createElement("div");
  card.classList.add("movie-card");

  card.innerHTML = `
    <img src="${movie.getPosterUrl()}" alt="${movie.title} poster" />
    <h3>${movie.title}</h3>
    <p><strong>Year:</strong> ${movie.getYear()}</p>
    <p><strong>Rating:</strong> ${
      movie.rating ? movie.rating.toFixed(1) : "N/A"
    }</p>
    <p>${movie.getShortOverview()}</p>
    <div class="card-buttons"></div>
  `;

  card.addEventListener("click", () => {
    openModal(movie);
  });

  const buttonContainer = card.querySelector(".card-buttons");

  if (showAddButton) {
    const addButton = document.createElement("button");
    const isWatched = watchlistManager.hasMovie(movie.id);

    addButton.textContent = isWatched ? "Already Watched" : "Mark Watched";

    if (isWatched) {
      addButton.disabled = true;
      addButton.style.opacity = "0.7";
    }

    addButton.addEventListener("click", (e) => {
      e.stopPropagation();

      watchlistManager.addMovie(movie);
      displayWatchedList();

      currentMovies = currentMovies.filter((savedMovie) => savedMovie.id !== movie.id);
      displayCurrentMovies();

      addButton.textContent = "Already Watched";
      addButton.disabled = true;
      addButton.style.opacity = "0.7";
    });

    buttonContainer.appendChild(addButton);
  } else {
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", (e) => {
      e.stopPropagation();

      watchlistManager.removeMovie(movie.id);
      displayWatchedList();
    });

    buttonContainer.appendChild(removeButton);
  }

  return card;
}

// MODAL
async function openModal(movie) {
  modalBody.innerHTML = `
    <h2>${movie.title}</h2>
    <img src="${movie.getPosterUrl()}" style="width:100%; border-radius:8px;" />
    <p><strong>Year:</strong> ${movie.getYear()}</p>
    <p><strong>Rating:</strong> ${
      movie.rating ? movie.rating.toFixed(1) : "N/A"
    }</p>
    <p>${movie.overview || "No description available."}</p>
    <p>Loading trailer...</p>
  `;

  modal.classList.remove("hidden");

  if (typeof gsap !== "undefined") {
    gsap.from(".modal-content", {
      scale: 0.8,
      opacity: 0,
      duration: 0.4
    });
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}`
    );

    const data = await response.json();

    const trailer =
      data.results.find(
        (v) => v.site === "YouTube" && v.type === "Trailer"
      ) || data.results.find((v) => v.site === "YouTube");

    if (trailer) {
      modalBody.innerHTML += `
        <iframe width="100%" height="315"
        src="https://www.youtube.com/embed/${trailer.key}"
        frameborder="0" allowfullscreen></iframe>
      `;
    } else {
      modalBody.innerHTML += `<p>No trailer available.</p>`;
    }
  } catch (error) {
    console.error(error);
    modalBody.innerHTML += `<p>Could not load trailer.</p>`;
  }
}

// CLOSE MODAL
closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

// INIT
displayWatchedList();
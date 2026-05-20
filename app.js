const API_KEY = "52e8c260be43feecca1a8cef0a780148";

const recommendationEngine = new RecommendationEngine(API_KEY);
const authManager = new AuthManager();
const watchlistManager = new WatchlistManager(authManager);

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
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const logoutBtn = document.getElementById("logoutBtn");
const authPanels = document.getElementById("authPanels");
const authMessage = document.getElementById("authMessage");
const profileDashboard = document.getElementById("profileDashboard");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const watchedCount = document.getElementById("watchedCount");
const recommendationCount = document.getElementById("recommendationCount");

// Modal elements
const modal = document.getElementById("movieModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

// Load more state
let currentMovies = [];
let visibleCount = 8;
const moviesPerLoad = 8;

// AUTH
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await authManager.login(
      document.getElementById("loginEmail").value,
      document.getElementById("loginPassword").value
    );
    loginForm.reset();
    await syncAccountState("Welcome back.");
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await authManager.register(
      document.getElementById("registerName").value,
      document.getElementById("registerEmail").value,
      document.getElementById("registerPassword").value
    );
    registerForm.reset();
    await syncAccountState("Account created. Your watched list is ready.");
  } catch (error) {
    authMessage.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  authManager.logout();
  currentMovies = [];
  visibleCount = moviesPerLoad;
  resultsContainer.innerHTML = "";
  resultsMessage.textContent = "Use the quiz or search to get started.";
  await syncAccountState("Create an account or sign in to save your watched movies.");
});

async function syncAccountState(message) {
  const user = authManager.currentUser;

  authMessage.textContent =
    message ||
    (user
      ? "Your profile is active and your watched list is saved."
      : "Create an account or sign in to save your watched movies.");

  authPanels.classList.toggle("hidden", Boolean(user));
  profileDashboard.classList.toggle("hidden", !user);
  logoutBtn.classList.toggle("hidden", !user);

  if (user) {
    profileName.textContent = user.name;
    profileEmail.textContent = user.email;
  }

  try {
    await watchlistManager.loadMovies();
  } catch (error) {
    authMessage.textContent = error.message;
  }

  displayWatchedList();
  updateDashboardStats();
}

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
  updateDashboardStats();

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

  updateDashboardStats();

  if (!authManager.currentUser) {
    watchedListContainer.innerHTML =
      '<p class="empty-state">Sign in to save and view watched movies.</p>';
    return;
  }

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

  const poster = document.createElement("img");
  poster.src = movie.getPosterUrl();
  poster.alt = `${movie.title} poster`;

  const title = document.createElement("h3");
  title.textContent = movie.title;

  const year = document.createElement("p");
  year.append(createStrongLabel("Year:"), ` ${movie.getYear()}`);

  const rating = document.createElement("p");
  rating.append(
    createStrongLabel("Rating:"),
    ` ${movie.rating ? movie.rating.toFixed(1) : "N/A"}`
  );

  const overview = document.createElement("p");
  overview.textContent = movie.getShortOverview();

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("card-buttons");

  card.append(poster, title, year, rating, overview, buttonContainer);

  card.addEventListener("click", () => {
    openModal(movie);
  });

  if (showAddButton) {
    const addButton = document.createElement("button");
    const isWatched = watchlistManager.hasMovie(movie.id);

    addButton.textContent = authManager.currentUser
      ? isWatched
        ? "Already Watched"
        : "Mark Watched"
      : "Login to Save";

    if (isWatched || !authManager.currentUser) {
      addButton.disabled = true;
      addButton.style.opacity = "0.7";
    }

    addButton.addEventListener("click", async (e) => {
      e.stopPropagation();

      try {
        await watchlistManager.addMovie(movie);
        displayWatchedList();
        updateDashboardStats();

        currentMovies = currentMovies.filter((savedMovie) => savedMovie.id !== movie.id);
        displayCurrentMovies();

        addButton.textContent = "Already Watched";
        addButton.disabled = true;
        addButton.style.opacity = "0.7";
      } catch (error) {
        authMessage.textContent = error.message;
      }
    });

    buttonContainer.appendChild(addButton);
  } else {
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", async (e) => {
      e.stopPropagation();

      try {
        await watchlistManager.removeMovie(movie.id);
        displayWatchedList();
      } catch (error) {
        authMessage.textContent = error.message;
      }
    });

    buttonContainer.appendChild(removeButton);
  }

  return card;
}

function createStrongLabel(text) {
  const label = document.createElement("strong");
  label.textContent = text;
  return label;
}

function updateDashboardStats() {
  watchedCount.textContent = authManager.currentUser
    ? watchlistManager.watchedMovies.length
    : "0";
  recommendationCount.textContent = currentMovies.length;
}

// MODAL
async function openModal(movie) {
  modalBody.textContent = "";

  const title = document.createElement("h2");
  title.textContent = movie.title;

  const poster = document.createElement("img");
  poster.src = movie.getPosterUrl();
  poster.alt = `${movie.title} poster`;

  const year = document.createElement("p");
  year.append(createStrongLabel("Year:"), ` ${movie.getYear()}`);

  const rating = document.createElement("p");
  rating.append(
    createStrongLabel("Rating:"),
    ` ${movie.rating ? movie.rating.toFixed(1) : "N/A"}`
  );

  const overview = document.createElement("p");
  overview.textContent = movie.overview || "No description available.";

  const trailerMessage = document.createElement("p");
  trailerMessage.textContent = "Loading trailer...";

  modalBody.append(title, poster, year, rating, overview, trailerMessage);

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
      trailerMessage.remove();

      const trailerFrame = document.createElement("iframe");
      trailerFrame.width = "100%";
      trailerFrame.height = "315";
      trailerFrame.src = `https://www.youtube.com/embed/${encodeURIComponent(
        trailer.key
      )}`;
      trailerFrame.title = `${movie.title} trailer`;
      trailerFrame.allowFullscreen = true;
      modalBody.appendChild(trailerFrame);
    } else {
      trailerMessage.textContent = "No trailer available.";
    }
  } catch (error) {
    console.error(error);
    trailerMessage.textContent = "Could not load trailer.";
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
async function initializeApp() {
  await authManager.loadCurrentUser();
  await syncAccountState();
}

initializeApp();

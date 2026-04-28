class RecommendationEngine {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.results = [];
  }

  async fetchMovies(query) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch movies from TMDB.");
    }

    const data = await response.json();
    this.results = data.results.map((movieData) => new Movie(movieData));
    return this.results;
  }

  filterByTime(movies, timePreference) {
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

  removeWatched(movies, watchedMovies) {
    return movies.filter((movie) => {
      return !watchedMovies.some((watchedMovie) => watchedMovie.id === movie.id);
    });
  }

  limitResults(movies, limit = 8) {
    return movies.slice(0, limit);
  }
}
class WatchlistManager {
  constructor(authManager) {
    this.authManager = authManager;
    this.watchedMovies = [];
  }

  async loadMovies() {
    if (!this.authManager.currentUser) {
      this.watchedMovies = [];
      return this.watchedMovies;
    }

    const data = await this.authManager.request("/api/watchlist");
    this.watchedMovies = data.movies;
    return this.watchedMovies;
  }

  async addMovie(movie) {
    if (!this.authManager.currentUser) {
      throw new Error("Sign in to save watched movies.");
    }

    const movieData = this.toMovieData(movie);
    const data = await this.authManager.request("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ movie: movieData })
    });

    this.watchedMovies = data.movies;
  }

  async removeMovie(movieId) {
    if (!this.authManager.currentUser) {
      return;
    }

    const data = await this.authManager.request(`/api/watchlist/${movieId}`, {
      method: "DELETE"
    });

    this.watchedMovies = data.movies;
  }

  hasMovie(movieId) {
    return this.watchedMovies.some((movie) => movie.id === movieId);
  }

  toMovieData(movie) {
    return {
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.posterPath,
      releaseDate: movie.releaseDate,
      rating: movie.rating,
      genreIds: movie.genreIds
    };
  }
}

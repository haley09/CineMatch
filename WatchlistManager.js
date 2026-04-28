class WatchlistManager {
  constructor() {
    this.watchedMovies = this.loadFromLocalStorage();
  }

  addMovie(movie) {
    const alreadyExists = this.watchedMovies.some(
      (savedMovie) => savedMovie.id === movie.id
    );

    if (!alreadyExists) {
      this.watchedMovies.push(movie);
      this.saveToLocalStorage();
    }
  }

  removeMovie(movieId) {
    this.watchedMovies = this.watchedMovies.filter(
      (movie) => movie.id !== movieId
    );
    this.saveToLocalStorage();
  }

  hasMovie(movieId) {
    return this.watchedMovies.some((movie) => movie.id === movieId);
  }

  saveToLocalStorage() {
    localStorage.setItem("watchedMovies", JSON.stringify(this.watchedMovies));
  }

  loadFromLocalStorage() {
    return JSON.parse(localStorage.getItem("watchedMovies")) || [];
  }
}
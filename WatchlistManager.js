class WatchlistManager {
  constructor(storageKey = "watchedMovies") {
    this.storageKey = storageKey;
    this.watchedMovies = this.loadFromLocalStorage();
  }

  setStorageKey(storageKey) {
    this.storageKey = storageKey;
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
    localStorage.setItem(this.storageKey, JSON.stringify(this.watchedMovies));
  }

  loadFromLocalStorage() {
    try {
      const savedMovies = JSON.parse(localStorage.getItem(this.storageKey));
      return Array.isArray(savedMovies) ? savedMovies : [];
    } catch (error) {
      console.warn("Could not load watched movies from localStorage.", error);
      return [];
    }
  }
}

class Movie {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.overview = data.overview || "";
    this.posterPath = data.poster_path;
    this.releaseDate = data.release_date || "";
    this.rating = data.vote_average || 0;
    this.genreIds = data.genre_ids || [];
  }

  getYear() {
    return this.releaseDate ? this.releaseDate.split("-")[0] : "N/A";
  }

  getPosterUrl() {
    return this.posterPath
      ? `https://image.tmdb.org/t/p/w500${this.posterPath}`
      : "https://via.placeholder.com/500x750?text=No+Image";
  }

  getShortOverview() {
    if (!this.overview) {
      return "No description available.";
    }

    if (this.overview.length <= 120) {
      return this.overview;
    }

    return `${this.overview.substring(0, 120)}...`;
  }
}
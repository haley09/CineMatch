require("dotenv").config();

const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d"
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "You must be signed in." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query(
      "SELECT id, name, email FROM cinematch_users WHERE id = $1",
      [payload.id]
    );

    if (!rows[0]) {
      return res.status(401).json({ error: "Session no longer exists." });
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

async function getWatchedMovies(userId) {
  const { rows } = await pool.query(
    `SELECT movie_data
     FROM cinematch_watched_movies
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return rows.map((row) => row.movie_data);
}

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || password.length < 6) {
    return res.status(400).json({
      error: "Name, valid email, and a 6+ character password are required."
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO cinematch_users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash]
    );

    const user = rows[0];
    return res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    console.error(error);
    return res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, password_hash FROM cinematch_users WHERE email = $1",
      [email]
    );
    const user = rows[0];
    const isValid = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!isValid) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    return res.json({ user: publicUser(user), token: signToken(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Could not log in." });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get("/api/watchlist", requireAuth, async (req, res) => {
  try {
    const movies = await getWatchedMovies(req.user.id);
    res.json({ movies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load watched movies." });
  }
});

app.post("/api/watchlist", requireAuth, async (req, res) => {
  const movie = req.body.movie || {};
  const movieId = Number(movie.id);

  if (!movieId || !movie.title) {
    return res.status(400).json({ error: "Movie id and title are required." });
  }

  const movieData = {
    id: movieId,
    title: String(movie.title),
    overview: String(movie.overview || ""),
    posterPath: String(movie.posterPath || ""),
    releaseDate: String(movie.releaseDate || ""),
    rating: Number(movie.rating) || 0,
    genreIds: Array.isArray(movie.genreIds) ? movie.genreIds : []
  };

  try {
    await pool.query(
      `INSERT INTO cinematch_watched_movies (user_id, tmdb_id, movie_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tmdb_id)
       DO UPDATE SET movie_data = EXCLUDED.movie_data`,
      [req.user.id, movieId, movieData]
    );

    const movies = await getWatchedMovies(req.user.id);
    res.status(201).json({ movies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not save movie." });
  }
});

app.delete("/api/watchlist/:movieId", requireAuth, async (req, res) => {
  const movieId = Number(req.params.movieId);

  if (!movieId) {
    return res.status(400).json({ error: "Movie id is required." });
  }

  try {
    await pool.query(
      "DELETE FROM cinematch_watched_movies WHERE user_id = $1 AND tmdb_id = $2",
      [req.user.id, movieId]
    );

    const movies = await getWatchedMovies(req.user.id);
    res.json({ movies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not remove movie." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cinematch_users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cinematch_watched_movies (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES cinematch_users(id) ON DELETE CASCADE,
      tmdb_id INTEGER NOT NULL,
      movie_data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, tmdb_id)
    );

    CREATE INDEX IF NOT EXISTS cinematch_watched_movies_user_id_idx
      ON cinematch_watched_movies(user_id);
  `);
}

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CineMatch server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database.", error);
    process.exit(1);
  });

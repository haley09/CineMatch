# CineMatch

CineMatch is a movie discovery app with mood-based recommendations, TMDB search, member accounts, and PostgreSQL-backed watched lists.

## Features

- Register and log in with hashed passwords
- Save watched movies by account
- Search TMDB for movies
- Generate mood-based recommendations
- View movie details and trailers

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and add:

   ```text
   DATABASE_URL=your-postgres-connection-string
   JWT_SECRET=your-long-random-secret
   ```

3. Start the app:

   ```bash
   npm start
   ```

4. Open `http://localhost:3000`.

## Deployment

Deploy as a Node web service. On Render, use:

```text
Build Command: npm install
Start Command: npm start
```

Add these environment variables in the Render dashboard:

```text
DATABASE_URL
JWT_SECRET
NODE_ENV=production
```

Do not commit `.env`.

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB.

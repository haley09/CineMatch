# TODO - CineMatch

## Auth
- Clearly note in the README that login/register is localStorage demo auth.
- Consider adding a backend later for real accounts, hashed passwords, and protected user data.
- Add profile editing for name and email.

## API
- Move TMDB requests through a backend proxy if turning this into a production-style app.
- Add loading and error states for trailer requests.
- Add filters for genre, rating, language, and release decade.

## User Experience
- Add tabs or filters for recommendations, search results, and watched movies.
- Add a "clear watched list" option with confirmation.
- Add empty-state suggestions when no movies match the selected filters.

## Design
- Add poster fallback styling that matches the app instead of the default placeholder image.
- Improve mobile spacing around the dashboard and forms.
- Add visible focus states for keyboard users.

## Testing
- Test account switching to confirm watched lists stay separate.
- Test corrupted localStorage data and empty TMDB responses.
- Test the app with the network offline or TMDB unavailable.


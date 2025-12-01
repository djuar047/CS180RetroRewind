// src/topMovies.js
const OMDB_API_KEY = process.env.REACT_APP_OMDB_API_KEY;

// Top 20 IMDb IDs
const TOP_MOVIE_IDS = [
  "tt0111161",
  "tt0068646",
  "tt0071562",
  "tt0468569",
  "tt0050083",
  "tt0108052",
  "tt0167260",
  "tt0110912",
  "tt0060196",
  "tt0137523",
  "tt0120737",
  "tt0816692",
  "tt0109830",
  "tt1375666",
  "tt0167261",
  "tt0080684",
  "tt0133093",
  "tt0099685",
  "tt0073486",
  "tt0114369",
];

export async function fetchTopMovies() {
  const requests = TOP_MOVIE_IDS.map((id) =>
    fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${id}`)
      .then((res) => res.json())
      .catch(() => null),
  );

  const results = await Promise.all(requests);

  // Map into your app's movie format
  const movies = results
    .filter((m) => m && m.Response === "True")
    .map((m) => ({
      id: m.imdbID,
      title: m.Title,
      year: m.Year,
      platforms: ["Theaters", "Streaming"],
      summary: m.Plot || "No summary available.",
      coverUrl:
        m.Poster !== "N/A"
          ? m.Poster
          : "https://placehold.co/200x280?text=No+Cover",
      type: "Movie",
    }));

  return movies;
}

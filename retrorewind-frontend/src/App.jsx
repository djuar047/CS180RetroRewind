import { useState } from "react";
import { useEffect } from "react";
import bear from "./assets/bear.webp";
// NEW: allow in-app links + route definitions
import { Routes, Route, Link } from "react-router-dom";

import bear from "./assets/bear.webp";
import Login from "./Login.jsx";
import Profile from "./Profile.jsx";
import CreateAccount from "./CreateAccount.jsx";
import CommunityThreads from "./pages/CommunityThreads.jsx";
import ThreadDetail from "./pages/ThreadDetail.jsx";

/**
 * App: tiny router shell that swaps pages.
 * - "/"             -> Home
 * - "/login"        -> Login
 * - "/profile"      -> Profile
 * - "/createAccount"-> Create account
 * - "/threads"      -> Community threads list
 * - "/threads/:title" -> Single thread detail
 */

export default function App({ auth, setAuth }) {
  return (
    <Routes>
      <Route path="/" element={<Home auth={auth} setAuth={setAuth} />} />
      <Route path="/login" element={<Login auth={auth} setAuth={setAuth} />} />
      <Route path="/profile" element={<Profile auth={auth} />} />
      <Route path="/createAccount" element={<CreateAccount setAuth={setAuth} />} />
      <Route path="/threads" element={<CommunityThreads />} />
      <Route path="/threads/:title" element={<ThreadDetail />} />
    </Routes>
  );
}

/**
 * Home: search UI + filters + rating modal.
 */
function Home({ auth, setAuth }) {
  // search
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ratings
  const [showModal, setShowModal] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [library, setLibrary] = useState([]); // IDs of items in the user's library
  const [ratings, setRatings] = useState({}); // { mediaId: { stars, review } }

  // filters
  const [typeFilter, setTypeFilter] = useState("All");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  function applyFilters(list) {
    const yf = parseInt(yearFrom, 10);
    const yt = parseInt(yearTo, 10);

    return (list || []).filter((it) => {
      // filter by type
      if (typeFilter !== "All") {
        if ((it.type || "").toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }
      }

      // year range
      if ((yearFrom || yearTo) && it.year && it.year !== "—") {
        const y = parseInt(String(it.year).slice(0, 4), 10);
        if (Number.isInteger(yf) && y < yf) return false;
        if (Number.isInteger(yt) && y > yt) return false;
      }

      // platform filter
      if (platformFilter.trim()) {
        const p = platformFilter.trim().toLowerCase();
        const arr = Array.isArray(it.platforms) ? it.platforms : [];
        const hit = arr.some((name) =>
          (name || "").toLowerCase().includes(p)
        );
        if (!hit) return false;
      }
      return true;
    });
  }

  function reapplyFilters() {
    setItems((prev) => applyFilters(prev));
  }

  function resetFilters() {
    setTypeFilter("All");
    setYearFrom("");
    setYearTo("");
    setPlatformFilter("");
    setItems((prev) => applyFilters(prev));
  }

  // fallback sample data
  const MOCK_RESULTS = [
    {
      id: "1",
      title: "Halo: Combat Evolved",
      year: "2001-11-15",
      platforms: ["Xbox", "PC (Windows)"],
      summary:
        "Fight for humanity against the Covenant on the ancient ring-world Halo.",
      coverUrl: "https://placehold.co/200x280?text=HALO",
      type: "Game",
    },
    {
      id: "2",
      title: "The Matrix",
      year: "1999-03-31",
      platforms: ["Theaters", "Blu-ray"],
      summary:
        "A hacker discovers reality is a simulated construct in this genre-defining film.",
      coverUrl: "https://placehold.co/200x280?text=MATRIX",
      type: "Movie",
    },
  ];


  function resetFilters() {
    setTypeFilter("All");
    setYearFrom("");
    setYearTo("");
    setPlatformFilter("");
    // optionally reapply filters to update displayed items
    setItems((prev) => applyFilters(prev));
  }
  // When the user submits the search:
  // - prevent page reload
  // - if box is empty, clear results
  // - otherwise, call our Flask API (/search?q=...)
  // - if backend fails, show a small warning + filter MOCK results as a fallback
  // search handler
  async function onSearch(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      setItems([]);
      setErr("");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const [gamesRes, moviesRes] = await Promise.all([
        fetch(`http://127.0.0.1:5000/search?q=${encodeURIComponent(query)}`),
        fetch(`http://127.0.0.1:5000/movies?q=${encodeURIComponent(query)}`),
      ]);
      const games = (await gamesRes.json()) || [];
      const movies = (await moviesRes.json()) || [];
      setItems(applyFilters([...games, ...movies]));
    } catch (e) {
      // backend not running → fallback
      setErr("Backend not reachable — showing sample results.");
      setItems(
        applyFilters(
          MOCK_RESULTS.filter((m) =>
            m.title.toLowerCase().includes(query.toLowerCase())
          )
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function addToLibrary(item) {
    if (!auth?.userId || !auth?.token) {
      alert("Please log in to add to your library.");
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:5000/profile/${auth.userId}/library/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            id: item.id,
            title: item.title,
            type: item.type,
            year: item.year || "",
            coverUrl: item.coverUrl || "",
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add to library");
      }
      alert(`${item.title} added to your library!`);
    } catch (err) {
      console.error("Add-to-library error:", err);
      alert("Failed to add to library.");
    }

    alert(`${item.title} added to your library!`);
    setLibrary(prev => [...prev, item.id]); // add to library state
  } catch (e) {
    console.error("Add-to-library error:", e);
    alert("Failed to add to library.");
  }

  async function submitRating() {
    if (!currentGame) return;
    if (!stars) {
      alert("Please select a star rating first.");
      return;
    }
    if (!auth?.userId || !auth?.token) {
      alert("Please log in to rate items.");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          user_id: auth.userId,
          media_id: currentGame.id,
          title: currentGame.title,
          cover_url: currentGame.coverUrl,
          type: currentGame.type,
          year: currentGame.year,
          stars,
          review_text: review,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error("Rating submit error:", msg);
        alert("Failed to submit rating.\n\nServer says: " + msg);
        return;
      }

      setRatings((prev) => ({
        ...prev,
        [currentGame.id]: { stars, review },
      }));
      setShowModal(false);
      setStars(0);
      setReview("");
    } catch (e) {
      console.error(e);
      alert("Failed to submit rating.");
    }
  }
}


  // logout helper
  function handleLogout() {
    setAuth({ userId: null, token: null });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <header className="border-b border-zinc-800 bg-gradient-to-r from-blue-600/15 via-zinc-950 to-amber-400/15">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          {/* Left: logo + title */}
          <div className="flex items-center gap-3">
            <div className="group relative h-9 w-9 rounded-xl overflow-hidden ring-2 ring-amber-400/70 bg-zinc-900 shadow-md shadow-blue-600/20 transition">
              <img src={bear} alt="Bear 180" className="h-full w-full object-cover" />
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-blue-600/70 group-hover:shadow-[0_0_18px_4px_rgba(251,191,36,0.35)] transition" />
            </div>

            <div className="text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(37,99,235,0.25)]">
                RetroRewind
              </span>
            </div>
          </div>

          {/* Right: team tag + nav */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-zinc-400">
              Team <span className="text-amber-400">Bear 180</span>
            </span>

            {/* Community Threads */}
            <Link
              to="/threads"
              className="text-sm rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 
                         text-zinc-200 hover:bg-zinc-800 hover:border-amber-400/70 transition"
            >
              Community Threads
            </Link>

            {/* Auth buttons */}
            {!auth?.userId && (
              <>
                <Link
                  to="/createAccount"
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium hover:bg-zinc-700 transition"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium hover:bg-zinc-700 transition"
                >
                  Login
                </Link>
              </>
            )}

            <Link
              to="/profile"
              className="rounded-lg border border-blue-600 bg-blue-600/10 px-3 py-2 text-sm font-medium text-blue-300 hover:bg-blue-600/20 transition"
            >
              Profile
            </Link>

            {auth?.userId && (
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-500 transition"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-zinc-100">
            Track, Rate, and Relive the Classics
          </h2>
          <p className="mt-1 text-zinc-400">Games and Movies</p>

          {/* search form */}
          <form onSubmit={onSearch} className="mt-5 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try 'Halo', 'Chrono Trigger'…"
              className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 active:bg-blue-700 ring-2 ring-transparent hover:ring-amber-400/60 transition disabled:opacity-60"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </form>

          {/* filters */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2"
            >
              <option>All</option>
              <option>Game</option>
              <option>Movie</option>
            </select>

            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={yearFrom}
              onChange={(e) =>
                setYearFrom(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Year from"
              className="rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2"
            />

            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={yearTo}
              onChange={(e) =>
                setYearTo(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Year to"
              className="rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2"
            />

            <input
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              placeholder="Platform (e.g., Xbox)"
              className="rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2"
            />

            <button
              type="button"
              onClick={reapplyFilters}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
            >
              Reset Filters
            </button>
          </div>

          {err && (
            <p className="mt-3 text-sm text-amber-300">
              {err}
            </p>
          )}
        </section>

        {/* results grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => {
            const rated = ratings[m.id];

            return (
              <article
                key={m.id || m.title}
                className={`group flex gap-4 rounded-2xl p-4 transition border ${
                  rated
                    ? "bg-amber-900/20 border-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-amber-400/70 hover:shadow-[0_0_0_1px] hover:shadow-amber-400/30"
                }`}
              >
                <img
                  src={m.coverUrl}
                  alt={m.title}
                  className="h-40 w-28 rounded-xl object-cover ring-1 ring-zinc-800 group-hover:ring-amber-400/60"
                />
                <div className="flex-1">
                  {rated && (
                    <span className="inline-block mb-2 px-2 py-1 text-xs font-semibold rounded bg-amber-600/20 text-amber-400 border border-amber-500/40">
                      Rated ★ {rated.stars}
                    </span>
                  )}

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{m.title}</h3>
                    <span className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                      {m.year ?? "—"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-400">
                    {m.type} • Platforms: {(m.platforms ?? []).join(", ")}
                  </p>

                  <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                    {m.summary}
                  </p>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700"
                      onClick={() => addToLibrary(m)}
                    >
                      Add to Library
                    </button>

                    {ratings[m.id] && (
                      <div className="mt-1 text-sm text-amber-400">
                        Rated {ratings[m.id].stars} / 5 — "{ratings[m.id].review}"
                      </div>
                    )}

                    <div className="mt-1 flex gap-2">
                      <button
                        className="rounded-lg border border-blue-600 bg-blue-600/10 px-3 py-1.5 text-sm text-blue-300"
                        onClick={() => {
                          setCurrentGame(m);
                          setStars(ratings[m.id]?.stars || 0);
                          setReview(ratings[m.id]?.review || "");
                          setShowModal(true);
                        }}
                      >
                        {rated ? "Update Rating" : "Rate ★"}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!loading && !items.length && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-400">
              No results yet. Try a search.
            </div>
          )}
        </section>
      </main>

      {/* Rating modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-700 max-w-sm w-full">
            <h3 className="text-xl font-semibold mb-3">
              Rate {currentGame?.title}
            </h3>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setStars(s)}
                  className={`text-2xl ${
                    s <= stars ? "text-amber-400" : "text-zinc-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Write a short review (optional)"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-2 text-sm rounded-lg bg-zinc-700 hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} RetroRewind • CS180 Team{" "}
        <span className="text-amber-400">Bear 180</span>
      </footer>
    </div>
  );
}


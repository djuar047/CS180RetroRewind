import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { useEffect } from "react";

import bear from "./assets/bear.webp";
import Login from "./Login.jsx";
import Profile from "./Profile.jsx";
import CreateAccount from "./CreateAccount.jsx";
import CommunityThreads from "./pages/CommunityThreads.jsx";
import ThreadDetail from "./pages/ThreadDetail.jsx";

/**
 * App: tiny router shell that swaps pages.
 * - "/"         -> Home (our existing screen)
 * - "/login"    -> Login
 * - "/profile"  -> Profile
 * - "/threads"  -> Community threads list
 * - "/threads/:title" -> Single thread detail
 * - "/createAccount" -> Create account
 */

export default function App({ auth: authProp, setAuth: setAuthProp }) {
  const [auth, setAuth] = useState(authProp || { userId: null, token: null });

  // Update auth when prop changes
  useEffect(() => {
    if (authProp) {
      setAuth(authProp);
    }
  }, [authProp]);

  return (
    <Routes>
      <Route path="/" element={<Home auth={auth} setAuth={setAuth} />} />
      <Route path="/login" element={<Login auth={auth} setAuth={setAuth} />} />
      <Route path="/profile" element={<Profile auth={auth} />} />
      <Route path="/createAccount" element={<CreateAccount setAuth={setAuth} />} />
      <Route path="/threads" element={<CommunityThreads auth={auth} />} />
      <Route path="/threads/:threadId" element={<ThreadDetail auth={auth} />} />
    </Routes>
  );
}


/**
 * Home: this is your original App UI.
 */
function Home({ auth, setAuth }) {
  // q = what the user typed in the search box
  const [q, setQ] = useState("");
  // items = list of results we show in the UI (from backend or mock)
  const [items, setItems] = useState([]);
  // loading = show “Searching…” on the button so user knows we’re working
  const [loading, setLoading] = useState(false);
  // err = simple message to tell user if backend isn’t reachable
  const [err, setErr] = useState("");
  // display ratings in the game cards ratings
  const [showModal, setShowModal] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");

  // for displaying ratings in the UI (local only)
  const [ratings, setRatings] = useState({});

  // --- NEW: simple search filters that user can change ---
  const [typeFilter, setTypeFilter] = useState("All");   // shows all by default, or pick “Game” or “Movie”
  const [yearFrom, setYearFrom] = useState("");          // the earliest year to show
  const [yearTo, setYearTo] = useState("");              // the latest year to show
  const [platformFilter, setPlatformFilter] = useState(""); // find results that match this platform (ex: “Xbox”)
  // ---------------------------

  // --- NEW: filter helper (used to narrow down the search results) ---
  function applyFilters(list) {
    const yf = parseInt(yearFrom, 10);
    const yt = parseInt(yearTo, 10);

    return (list || []).filter((it) => {
      // filter by type (Game / Movie)
      if (typeFilter !== "All") {
        if ((it.type || "").toLowerCase() !== typeFilter.toLowerCase()) return false;
      }
      // filter by year range if given(read first 4 chars)
      if ((yearFrom || yearTo) && it.year && it.year !== "—") {
        const y = parseInt(String(it.year).slice(0, 4), 10);
        if (Number.isInteger(yf) && y < yf) return false;
        if (Number.isInteger(yt) && y > yt) return false;
      }
      // filter by platform (checks if platform name includes the search text)
      if (platformFilter.trim()) {
        const p = platformFilter.trim().toLowerCase();
        const arr = Array.isArray(it.platforms) ? it.platforms : [];
        const hit = arr.some((name) => (name || "").toLowerCase().includes(p));
        if (!hit) return false;
      }
      return true;
    });
  }
   useEffect(() => {



  async function loadUserRatings() {


    if (!auth?.userId) return;





    try {


      const res = await fetch(


        `http://127.0.0.1:5000/profile/${auth.userId}/ratings`,


        { headers: { Authorization: `Bearer ${auth.token}` } }


      );


      const data = await res.json();





      if (!res.ok) return;





      // Convert into dictionary: { media_id: {...rating} }


      const mapped = {};


      data.forEach((r) => {


        mapped[r.media_id] = r;


      });





      setRatings(mapped);


    } catch (err) {


      console.error("Failed loading user ratings", err);


    }


  }





  loadUserRatings();


}, [auth]);





async function updateRating(mediaId) {


  const rating = ratings[mediaId];


  if (!rating) return;





  const ratingId = rating.rating_id || rating._id;





  try {


    const res = await fetch(`http://127.0.0.1:5000/ratings/${ratingId}`, {


      method: "PUT",


      headers: {


        "Content-Type": "application/json",


        Authorization: `Bearer ${auth.token}`


      },


      body: JSON.stringify({


        stars,


        review_text: review


      })


    });





    if (!res.ok) {


      const msg = await res.text();


      alert("Failed to update rating.\n" + msg);


      return;


    }





    // update UI


    setRatings(prev => ({


      ...prev,


      [mediaId]: {


        ...prev[mediaId],


        stars,


        review,


        rating_id: ratingId


      }


    }));





    alert("Rating updated!");


    setShowModal(false);


    setStars(0);


    setReview("");





  } catch (err) {


    console.error(err);


    alert("Server error updating rating.");


  }


}
  // --------------------------------------------------

  // MOCK data to show something if the backend isn't running.
  // (Only used as a fallback inside the catch block.)
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

  // When the user submits the search:
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
      // call our local backend (Flask) which calls IGDB and OMDb
      const [gamesRes, moviesRes] = await Promise.all([
        fetch(`http://127.0.0.1:5000/search?q=${encodeURIComponent(query)}`),
        fetch(`http://127.0.0.1:5000/movies?q=${encodeURIComponent(query)}`)
      ]);
      const games = (await gamesRes.json()) || [];
      const movies = (await moviesRes.json()) || [];
      setItems(applyFilters([...games, ...movies]));  // merge + filter
    } catch (e) {
      // backend not running or failed → tell user + fall back to MOCK
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

  // --- NEW: apply filters again without re-searching ---
  function reapplyFilters() {
    setItems((prev) => applyFilters(prev));
  }
  // -----------------------------------------------------

  // Ratings 
  async function submitRating() {
     if (ratings[currentGame.id]) {
      await updateRating(currentGame.id);
      return;
      }

    if (!auth?.userId) {
      alert("Please log in to rate items.");
      return;
    }
  
    if (!stars) {
      alert("Please select a star rating first.");
      return;
    }
  
    try {
      const res = await fetch("http://127.0.0.1:5000/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        const message = await res.text();
        console.error("Rating submit error:", message);
        alert("Failed to submit rating.\n\nServer says: " + message);
        return;
}
      const data = await res.json();
  
      if (res.status === 409) {
        alert("You already rated this item. You can edit or delete it from your profile.");
        return;
      }
  
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit rating.");
      }
  
      alert("Thanks for rating!");
  
      // local UI-only storage for the cards
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
  
  async function addToLibrary(item) {
    if (!auth?.userId) {
      alert("Please log in to add items to your library.");
      return;
    }
  
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/profile/${auth.userId}/library/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${auth.token}`, // if needed
          },
          body: JSON.stringify({
            id: item.id,
            title: item.title,
            type: item.type,
            year: item.year,
          }),
        },
      );
  
      const data = await res.json();
  
      if (res.status === 409) {
        alert("That item is already in your library.");
        return;
      }
  
      if (!res.ok) {
        throw new Error(data.error || "Failed to add to library.");
      }
  
      alert("Added to your library!");
    } catch (err) {
      console.error(err);
      alert("Server error adding to library.");
    }
  }
  
     async function loadRatings() {
  const res = await fetch(
    `http://127.0.0.1:5000/profile/${auth.userId}/ratings`,
    { headers: { Authorization: `Bearer ${auth.token}` } }
  );
  const data = await res.json();
  /*setRatings((prev) => ({
    ...prev,
    [mediaId]: data
  }));*/
  const mapped = {};
  data.forEach((r) => (mapped[r.media_id] = r));
  setRatings(mapped);
}

async function deleteRating(ratingId, mediaId) {
  const res = await fetch(`http://127.0.0.1:5000/ratings/${ratingId}`, {
    method: "DELETE",
  });

  if (!res.ok) return alert("Failed to delete.");
  // remove from local UI
  setRatings((prev) => {
    const copy = {...prev};
    delete copy[mediaId];
    return copy;

  });
  alert("Deleted!");
}
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar with logo + app name */}
      <header className="border-b border-zinc-800 bg-gradient-to-r from-blue-600/15 via-zinc-950 to-amber-400/15">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">

          <div className="flex items-center gap-3">
            {/* Little bear icon with glow for team branding */}
            <div className="group relative h-9 w-9 rounded-xl overflow-hidden ring-2 ring-amber-400/70 bg-zinc-900 shadow-md shadow-blue-600/20 transition">
              <img src={bear} alt="Bear 180" className="h-full w-full object-cover" />
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-blue-600/70 group-hover:shadow-[0_0_18px_4px_rgba(251,191,36,0.35)] transition" />
            </div>

            {/* Title uses blue→gold gradient for UCR colors */}
            <div className="text-2xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(37,99,235,0.25)]">
                RetroRewind
              </span>
            </div>
          </div>

          {/* Right side: team tag + nav buttons */}
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

            {/* Create Account */}
            <Link
              to="/createAccount"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium hover:bg-zinc-700 transition"
            >
              Create Account
            </Link>

            {/* Login */}
            {auth?.userId ? (
              <button
                onClick={() => {
                  setAuth({ userId: null, token: null });
                  localStorage.removeItem("rr_email");
                  localStorage.removeItem("rr_bio");
                  alert("Logged out!");
                }}
                className="rounded-lg border border-red-600 bg-red-600/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-600/20 transition"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium hover:bg-zinc-700 transition"
              >
                Login
              </Link>
            )}


            {/* Profile */}
            <Link
              to="/profile"
              className="rounded-lg border border-blue-600 bg-blue-600/10 px-3 py-2 text-sm font-medium text-blue-300 hover:bg-blue-600/20 transition"
            >
              Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Section with the title + search box */}
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-zinc-100">
            Track, rate, and relive the classics
          </h2>
          <p className="mt-1 text-zinc-400">Blue & gold theme • games now, movies soon</p>

          {/* Search form: on submit calls onSearch() */}
          <form onSubmit={onSearch} className="mt-5 flex gap-2">
            {/* user types here */}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try 'Halo', 'Chrono Trigger'…"
              className="w-full rounded-xl bg-zinc-900/70 border border-zinc-800 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/30"
            />
            {/* button shows “Searching…” while loading */}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 active:bg-blue-700 ring-2 ring-transparent hover:ring-amber-400/60 transition disabled:opacity-60"
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </form>

          {/* --- NEW: quick filter controls shown under the search bar --- */}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {/* dropdown to choose type (shows all by default) */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2"
              title="Type"
            >
              <option>All</option>
              <option>Game</option>
              <option>Movie</option>
            </select>

            {/* box for starting year (oldest year to include) */}
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={yearFrom}
              onChange={(e) =>
                setYearFrom(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Year from"
              className="rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2"
              title="Start year"
            />

            {/* box for ending year (latest year to include) */}
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={yearTo}
              onChange={(e) =>
                setYearTo(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="Year to"
              className="rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2"
              title="End year"
            />

            {/* text box for typing a platform name (like Xbox or Wii) */}
            <input
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              placeholder="Platform (e.g., Xbox)"
              className="rounded-xl bg-zinc-900/70 border border-zinc-800 px-3 py-2"
              title="Platform"
            />

            {/* button that re-filters what’s already loaded (no new search call) */}
            <button
              type="button"
              onClick={reapplyFilters}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
              title="Filter current results"
            >
              Apply Filters
            </button>
          </div>

          {/* small warning if backend is down (we still show mock results) */}
          {err && (
            <p className="mt-3 text-sm text-amber-300">
              {err}
            </p>
          )}
        </section>

        {/* Cards grid: one card per result item */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {items.map((m) => {
            const rated = ratings[m.id];
            return (
            <article
              key={m.id || m.title}  // fallback to title if id missing
              className={`group flex gap-4 rounded-2xl p-4 transition border
              ${rated
              ? "bg-amber-900/20 border-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
              : "bg-zinc-900/60 border-zinc-800 hover:border-amber-400/70 hover:shadow-[0_0_0_1px] hover:shadow-amber-400/30"}`}
            >
              {/* cover image (or placeholder) */}
              <img
                src={m.coverUrl}
                alt={m.title}
                className="h-40 w-28 rounded-xl object-cover ring-1 ring-zinc-800 group-hover:ring-amber-400/60"
              />
              <div className="flex-1">
                {/* RATED BADGE */}
          {rated && (
                 <span className="inline-block mb-2 px-2 py-1 text-xs font-semibold rounded bg-amber-600/20 text-amber-400 border border-amber-500/40">
                  Rated ★ {rated.stars}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  {/* title on the left */}
                  <h3 className="text-lg font-semibold">{m.title}</h3>
                  {/* release year/date on the right */}
                  <span className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                    {m.year ?? "—"}
                  </span>
                </div>
                {/* type + platforms under the title */}
                <p className="mt-1 text-sm text-zinc-400">
                  {m.type} • Platforms: {(m.platforms ?? []).join(", ")}
                </p>
                {/* summary text */}
                <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                  {m.summary}
                </p>
                {/* fake actions for now (hook these up later) */}
                <div className="mt-4 flex gap-2">
                  <button

  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700"
  onClick={() => addToLibrary(m)}
>
  Add to Watchlist
</button>


<div className="mt-4 flex gap-2">
  <button
    className="rounded-lg border border-blue-600 bg-blue-600/10 px-3 py-1.5 text-sm text-blue-300"
    onClick={() => {
      setCurrentGame(m);
      loadRatings();
      setShowModal(true);
    }}
  >
     {rated ? "Update Rating" : "Rate ★"}
  </button>
</div>
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

                </div>
              </div>
            </article>
);})}

          {/* if not loading and no items yet, show a friendly empty state */}
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

      {/* simple footer with year + team name */}
      <footer className="mt-10 border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} RetroRewind • CS180 Team{" "}
        <span className="text-amber-400">Bear 180</span>
      </footer>
    </div>
  );
}

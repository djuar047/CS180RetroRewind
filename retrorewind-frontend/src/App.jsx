import { useState } from "react";
import bear from "./assets/bear.webp";

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

export default function App() {
  // q = what the user typed in the search box
  const [q, setQ] = useState("");
  // items = list of results we show in the UI (from backend or mock)
  const [items, setItems] = useState([]);
  // loading = show “Searching…” on the button so user knows we’re working
  const [loading, setLoading] = useState(false);
  // err = simple message to tell user if backend isn’t reachable
  const [err, setErr] = useState("");

  // When the user submits the search:
  // - prevent page reload
  // - if box is empty, clear results
  // - otherwise, call our Flask API (/search?q=...)
  // - if backend fails, show a small warning + filter MOCK results as a fallback
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
      // call our local backend (Flask) which calls IGDB for us
      const res = await fetch(
        `http://127.0.0.1:5000/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) {
        // if backend gives an error (like 500), throw so we go to catch
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      // only set array results; if not an array, show empty
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      // backend not running or failed → tell user + fall back to MOCK
      setErr("Backend not reachable — showing sample results.");
      setItems(
        MOCK_RESULTS.filter((m) =>
          m.title.toLowerCase().includes(query.toLowerCase())
        )
      );
    } finally {
      // turn off the “Searching…” state either way
      setLoading(false);
    }
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

          {/* Tiny team tag on the right */}
          <span className="hidden sm:inline text-xs font-medium text-zinc-400">
            Team <span className="text-amber-400">Bear 180</span>
          </span>
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

          {/* small warning if backend is down (we still show mock results) */}
          {err && (
            <p className="mt-3 text-sm text-amber-300">
              {err}
            </p>
          )}
        </section>

        {/* Cards grid: one card per result item */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <article
              key={m.id || m.title}  // fallback to title if id missing
              className="group flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-amber-400/70 hover:shadow-[0_0_0_1px] hover:shadow-amber-400/30 transition"
            >
              {/* cover image (or placeholder) */}
              <img
                src={m.coverUrl}
                alt={m.title}
                className="h-40 w-28 rounded-xl object-cover ring-1 ring-zinc-800 group-hover:ring-amber-400/60"
              />
              <div className="flex-1">
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
                  <button className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700">
                    Add to Library
                  </button>
                  <button className="rounded-lg border border-blue-600 bg-blue-600/10 px-3 py-1.5 text-sm text-blue-300 hover:bg-blue-600/20">
                    Rate ★
                  </button>
                </div>
              </div>
            </article>
          ))}

          {/* if not loading and no items yet, show a friendly empty state */}
          {!loading && !items.length && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-400">
              No results yet. Try a search.
            </div>
          )}
        </section>
      </main>

      {/* simple footer with year + team name */}
      <footer className="mt-10 border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} RetroRewind • CS180 Team{" "}
        <span className="text-amber-400">Bear 180</span>
      </footer>
    </div>
  );
}









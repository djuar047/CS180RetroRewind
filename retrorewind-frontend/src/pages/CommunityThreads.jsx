import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CommunityThreads() {
  const [threads, setThreads] = useState([]);
  const [newThread, setNewThread] = useState({
    title: "",
    content: "",
    category: "General",
  });
  const [editingTitle, setEditingTitle] = useState(null);
  const [editContent, setEditContent] = useState("");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const PAGE_SIZE = 5;

  async function fetchThreads(pageNumber) {
    try {
      setLoading(true);

      const res = await fetch(
        `http://127.0.0.1:5000/threads?page=${pageNumber}&limit=${PAGE_SIZE}`,
      );

      const data = await res.json();

      setThreads(Array.isArray(data) ? data : []);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching threads:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load threads from backend
  useEffect(() => {
    fetchThreads(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Handle new thread submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("http://127.0.0.1:5000/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newThread,
        user_id: "123", // placeholder
      }),
    });

    setNewThread({ title: "", content: "", category: "General" });

    // Reload threads
    const res = await fetch("http://127.0.0.1:5000/threads");
    setThreads(await res.json());
  };

  // --------------------------
  // Editing Threads
  // --------------------------
  const startEdit = (thread) => {
    setEditingTitle(thread.title);
    setEditContent(thread.content || "");
  };

  const cancelEdit = () => {
    setEditingTitle(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingTitle) return;

    await fetch(
      `http://127.0.0.1:5000/threads/${encodeURIComponent(editingTitle)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      },
    );

    // Reload updated thread list
    const res = await fetch("http://127.0.0.1:5000/threads");
    setThreads(await res.json());

    setEditingTitle(null);
    setEditContent("");
  };

  const deleteThread = async (thread, e) => {
    e.stopPropagation(); // prevent navigation when deleting

    const ok = window.confirm(`Delete thread "${thread.title}"?`);
    if (!ok) return;

    await fetch(
      `http://127.0.0.1:5000/threads/${encodeURIComponent(thread.title)}`,
      {
        method: "DELETE",
      },
    );

    // Reload thread list
    const res = await fetch("http://127.0.0.1:5000/threads");
    setThreads(await res.json());
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-10">
      <div className="mb-6">
        <button
          onClick={() => navigate("/")}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm hover:bg-zinc-800"
        >
          ← Back to Home
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">🎮 Community Threads</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 max-w-md space-y-3 border border-zinc-800 bg-zinc-900/60 p-4 rounded-xl"
      >
        <input
          type="text"
          placeholder="Thread Title"
          value={newThread.title}
          onChange={(e) =>
            setNewThread({ ...newThread, title: e.target.value })
          }
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
        />

        <textarea
          placeholder="Write something..."
          value={newThread.content}
          onChange={(e) =>
            setNewThread({ ...newThread, content: e.target.value })
          }
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
        />

        <select
          value={newThread.category}
          onChange={(e) =>
            setNewThread({ ...newThread, category: e.target.value })
          }
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
        >
          <option value="General">General</option>
          <option value="Games">Games</option>
          <option value="Movies">Movies</option>
        </select>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
        >
          Post Thread
        </button>
      </form>

      <div className="space-y-4">
        {threads.length === 0 ? (
          <p className="text-zinc-400">No threads yet. Be the first!</p>
        ) : (
          threads.map((t, i) => (
            <div
              key={i}
              className="border border-zinc-800 rounded-xl bg-zinc-900/60 p-4 hover:border-amber-400/70"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2
                    className="text-lg font-semibold cursor-pointer hover:underline"
                    onClick={() =>
                      navigate(`/threads/${encodeURIComponent(t.title)}`, {
                        state: { thread: t },
                      })
                    }
                  >
                    {t.title}
                  </h2>

                  <p className="text-sm text-zinc-500 mt-1">
                    Posted by User {t.user_id}
                  </p>

                  <div className="mt-1 inline-flex items-center gap-2 text-xs text-zinc-400">
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5">
                      {t.category || "General"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="text-xs rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
                    onClick={(e) => {
                      e.stopPropagation(); // don't navigate
                      startEdit(t);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-xs rounded-md border border-red-600/60 text-red-300 px-2 py-1 hover:bg-red-900/40"
                    onClick={(e) => deleteThread(t, e)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingTitle === t.title ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium hover:bg-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveEdit();
                      }}
                    >
                      Save
                    </button>
                    <button
                      className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelEdit();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-zinc-300">{t.content}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center gap-3">
        <button
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-zinc-800"
        >
          ← Previous
        </button>

        <span className="text-xs text-zinc-500">Page {page}</span>

        <button
          disabled={!hasMore || loading}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-zinc-800"
        >
          Next →
        </button>
      </div>

      {loading && (
        <p className="mt-2 text-xs text-zinc-500">Loading threads…</p>
      )}
    </div>
  );
}

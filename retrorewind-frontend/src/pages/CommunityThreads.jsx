import { useEffect, useState } from "react";

export default function CommunityThreads() {
  const [threads, setThreads] = useState([]);
  const [newThread, setNewThread] = useState({ title: "", content: "" });

  // Load threads from backend
  useEffect(() => {
    fetch("http://127.0.0.1:5000/threads")
      .then((res) => res.json())
      .then((data) => setThreads(data))
      .catch((err) => console.error("Error fetching threads:", err));
  }, []);

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
    setNewThread({ title: "", content: "" });

    // Reload threads
    const res = await fetch("http://127.0.0.1:5000/threads");
    setThreads(await res.json());
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-10">
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
              className="border border-zinc-800 rounded-xl bg-zinc-900/60 p-4"
            >
              <h2 className="text-lg font-semibold">{t.title}</h2>
              <p className="text-zinc-300">{t.content}</p>
              <p className="text-sm text-zinc-500 mt-1">
                Posted by User {t.user_id}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


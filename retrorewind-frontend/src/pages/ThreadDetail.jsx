import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:5000";

function timeAgo(dateString) {
  if (!dateString) return "Unknown date";

  const now = new Date();
  const then = new Date(dateString);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export default function ThreadDetail({ auth }) {
  const userId = auth?.userId;

  // we now use the Mongo thread _id from the URL: /threads/:threadId
  const { threadId } = useParams();
  const location = useLocation();

  // thread data from navigation state (if provided)
  const initialThread = location.state?.thread || null;

  const [thread, setThread] = useState(initialThread);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Load thread + comments
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      try {
        if (!threadId) {
          setError("Missing thread id.");
          setLoading(false);
          return;
        }

        // If no thread passed in via location.state, fetch it by id
        if (!initialThread) {
          const resThread = await fetch(`${API_BASE}/threads/${threadId}`);
          const dataThread = await resThread.json();
          if (!resThread.ok) {
            throw new Error(dataThread.error || "Failed to load thread");
          }
          setThread(dataThread);
        }

        const resComments = await fetch(`${API_BASE}/comments/${threadId}`);
        const dataComments = await resComments.json();
        setComments(Array.isArray(dataComments) ? dataComments : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load thread or comments.");
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Post a new comment
  async function handlePostComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!userId) {
      alert("You must be logged in to comment.");
      return;
    }

    setPosting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          thread_id: threadId,   // use thread id, not title
          user_id: userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post");
      }

      setNewComment("");

      // reload comments
      const resComments = await fetch(`${API_BASE}/comments/${threadId}`);
      const dataComments = await resComments.json();
      setComments(Array.isArray(dataComments) ? dataComments : []);
    } catch (err) {
      console.error(err);
      setError("Failed to post comment.");
    } finally {
      setPosting(false);
    }
  }

  function startEditComment(comment) {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content || "");
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditCommentText("");
  }

  async function saveEditedComment() {
    if (!editingCommentId) return;

    try {
      const res = await fetch(`${API_BASE}/comment/${editingCommentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editCommentText,
          user_id: userId, // tell backend who is editing
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);

      const resComments = await fetch(`${API_BASE}/comments/${threadId}`);
      setComments(await resComments.json());

      setEditingCommentId(null);
      setEditCommentText("");
    } catch (err) {
      console.error(err);
      setError("Failed to edit comment.");
    }
  }

  async function deleteComment(comment) {
    const ok = window.confirm("Delete this comment?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/comment/${comment.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }), // who is deleting
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);

      const resComments = await fetch(`${API_BASE}/comments/${threadId}`);
      setComments(await resComments.json());
    } catch (err) {
      console.error(err);
      setError("Failed to delete comment.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">🎮 Community Thread</h1>
        <Link
          to="/threads"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          ← Back to Threads
        </Link>
      </header>

      {loading && <p className="text-zinc-400">Loading…</p>}
      {error && <p className="text-amber-400 mb-4">{error}</p>}

      {thread && (
        <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="text-xl font-semibold mb-1">{thread.title}</h2>
          <p className="text-zinc-200 mb-2">{thread.content}</p>
          <p className="text-sm text-zinc-500">
            Posted by {thread.username || `User ${thread.user_id || "unknown"}`}
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
              {thread.category || "General"}
            </span>
          </div>
        </section>
      )}

      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Comments</h3>

        {comments.length === 0 ? (
          <p className="text-sm text-zinc-400 mb-4">
            No comments yet. Be the first!
          </p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map((c, idx) => {
              const isDeleted =
                c.deleted || c.content === "Comment has been deleted";
              const isEditing = editingCommentId === c.id;
              const created = timeAgo(c.date_created);
              const canEdit = userId && c.user_id === userId;

              return (
                <div
                  key={c.id || idx}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3"
                >
                  {/* EDIT MODE */}
                  {isEditing && !isDeleted ? (
                    <div className="space-y-2">
                      <textarea
                        value={editCommentText}
                        onChange={(e) => setEditCommentText(e.target.value)}
                        className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium hover:bg-blue-500"
                          onClick={saveEditedComment}
                        >
                          Save
                        </button>
                        <button
                          className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
                          onClick={cancelEditComment}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* NORMAL / DELETED VIEW */}
                      <p
                        className={`text-sm ${
                          isDeleted
                            ? "text-zinc-500 italic"
                            : "text-zinc-100"
                        }`}
                      >
                        {isDeleted ? "Comment has been deleted" : c.content}
                      </p>

                      {/* USER + DATE */}
                      <div className="flex justify-between mt-1 text-xs text-zinc-500">
                        <span>
                          By {c.username || `User ${c.user_id || "unknown"}`}
                        </span>
                        <span>{created}</span>
                      </div>
                    </>
                  )}

                  {/* ACTION BUTTONS – only if owner */}
                  {!isDeleted && !isEditing && canEdit && (
                    <div className="mt-2 flex gap-2">
                      <button
                        className="text-xs rounded-md border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
                        onClick={() => startEditComment(c)}
                      >
                        Edit
                      </button>

                      <button
                        className="text-xs rounded-md border border-red-600/60 text-red-300 px-2 py-1 hover:bg-red-900/40"
                        onClick={() => deleteComment(c)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handlePostComment} className="space-y-2 max-w-lg">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment…"
            className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
          >
            {posting ? "Posting…" : "Post Comment"}
          </button>
        </form>
      </section>
    </div>
  );
}

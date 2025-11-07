import { useState, useEffect } from "react";

export default function Profile() {
  // Store fake user info for now (we’ll replace this with real data later)
  const [user, setUser] = useState({
    username: "RetroFan42",
    email: "retrofan@example.com",
    bio: "I love old-school games and classic movies!",
    avatar_url: "https://placehold.co/120x120?text=User",
  });

  // Just to make sure the component loads fine
  useEffect(() => {
    console.log("Profile page loaded");
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        {/* Avatar + username */}
        <div className="flex flex-col items-center">
          <img
            src={user.avatar_url}
            alt="User avatar"
            className="w-24 h-24 rounded-full border border-zinc-700 mb-4"
          />
          <h1 className="text-2xl font-bold text-amber-400">{user.username}</h1>
          <p className="text-sm text-zinc-400">{user.email}</p>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">About Me</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{user.bio}</p>
        </div>

        {/* Buttons (placeholder actions for now) */}
        <div className="mt-6 flex justify-center gap-3">
          <button className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700">
            Edit Profile
          </button>
          <button className="rounded-lg border border-red-600 bg-red-600/10 px-4 py-2 text-sm text-red-400 hover:bg-red-600/20">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

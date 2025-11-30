import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();

  // figure out which email to use (login → localStorage → fallback)
  function getInitialEmail() {
    const fromLogin = location.state?.email;
    const fromStorage = localStorage.getItem("rr_email");
    return fromLogin || fromStorage || "user@example.com";
  }

  // make a username from the email before "@"
  function makeUsername(email) {
    if (!email) return "RetroUser";
    return email.split("@")[0];
  }

  // main user info shown on the profile page
  const [user, setUser] = useState(() => {
    const email = getInitialEmail();
    const savedBio = localStorage.getItem("rr_bio");

    return {
      username: makeUsername(email),
      email,
      bio: savedBio || "I love old-school games and classic movies!",
      avatar_url: "https://placehold.co/120x120?text=User",
    };
  });

  // state for editing the bio
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(user.bio);

  // update page if login sends new email
  useEffect(() => {
    const emailFromLogin = location.state?.email;
    if (emailFromLogin) {
      setUser((prev) => ({
        ...prev,
        email: emailFromLogin,
        username: makeUsername(emailFromLogin),
      }));
      localStorage.setItem("rr_email", emailFromLogin);
    }
    console.log("Profile page loaded");
  }, [location.state]);

  // start editing bio
  function handleEditBio() {
    setBioDraft(user.bio);
    setIsEditingBio(true);
  }

  async function removeFromLibrary(itemId) {
  if (!window.confirm("Remove this item from your library?")) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:5000/profile/${userId}/library/${itemId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      return alert(data.error || "Server error removing item.");
    }

    // Remove from UI
    setUser((prev) => ({
      ...prev,
      library: (prev?.library || []).filter((i) => i.id !== itemId),
    }));

    alert("Item removed!");
  } catch (err) {
    console.error(err);
    alert("Server error removing item.");
  }
}


  async function handleUpdate(e) {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/profile/${userId}/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

  // cancel editing
  function handleCancelEdit() {
    setBioDraft(user.bio);
    setIsEditingBio(false);
  }

  // clear saved login + send back home
  function handleLogout() {
    localStorage.removeItem("rr_email");
    localStorage.removeItem("rr_bio");
    navigate("/");
  }

  // go back to search page
  function goHome() {
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        {/* avatar + username */}
        <div className="flex flex-col items-center">
          <img
            src={user.avatar_url}
            alt="User avatar"
            className="w-24 h-24 rounded-full border border-zinc-700 mb-4"
          />
          <h1 className="text-2xl font-bold text-amber-400">{user.username}</h1>
          <p className="text-sm text-zinc-400">{user.email}</p>
        </div>

        {/* bio section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">About Me</h2>

          {/* bio when not editing */}
          {!isEditingBio && (
            <p className="text-sm text-zinc-300 leading-relaxed">{user.bio}</p>
          )}

          {/* bio editor */}
          {isEditingBio && (
            <div className="flex flex-col gap-2">
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBio}
                  className="rounded-lg border border-blue-600 bg-blue-600/10 px-3 py-1.5 text-sm text-blue-300 hover:bg-blue-600/20"
                >
                  Save Bio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
<div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 justify-center mx-auto">

      {/* Library Section */}
<div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md mb-6">
  <h2 className="text-xl font-semibold text-amber-400 text-center mb-4">
    My Library
  </h2>
  <div className="flex flex-col gap-3">
    {user.library && user.library.length > 0 ? (
      user.library.map((item, index) => (
        <div
          key={index}
          className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 flex justify-between items-center"
        >
          <div>
            <p className="text-lg font-semibold text-white">{item.title}</p>
            <p className="text-sm text-zinc-400">{item.type}</p>
            <p className="text-sm text-zinc-500">{item.year}</p>
          </div>
          <button
            onClick={() => removeFromLibrary(item.id)}
            className="ml-4 text-red-400 hover:text-red-300 text-sm px-2 py-1 border border-red-400 rounded"
          >
            Remove
          </button>
        </div>
      ))
    ) : (
      <p className="text-center text-zinc-400 mt-2">Your watchlist is empty</p>
    )}
  </div>
</div>

      {/* Ratings Section */}
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold text-amber-400 text-center mb-4">
          My Ratings
        </h2>
        <div className="flex flex-col gap-4">
          {user.ratings && user.ratings.length > 0 ? (
            user.ratings.map((rating) => (
              <div
                key={rating.rating_id}
                className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 flex gap-3"
              >
                <img
                  src={
                    rating.cover_url ||
                    "https://placehold.co/80x110?text=No+Cover"
                  }
                  alt={rating.title}
                  className="w-20 h-28 rounded-md object-cover border border-zinc-700"
                />

          {/* go home */}
          <button
            type="button"
            onClick={goHome}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Back to Home
          </button>

          {/* logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-red-600 bg-red-600/10 px-4 py-2 text-sm text-red-400 hover:bg-red-600/20"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}


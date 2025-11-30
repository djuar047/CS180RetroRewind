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

  // save updated bio (local only)
  function handleSaveBio() {
    const cleaned = bioDraft.trim();
    setUser((prev) => ({
      ...prev,
      bio: cleaned || prev.bio,
    }));
    localStorage.setItem("rr_bio", cleaned || user.bio);
    setIsEditingBio(false);
  }

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

        {/* action buttons */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {/* edit bio */}
          {!isEditingBio && (
            <button
              type="button"
              onClick={handleEditBio}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              Edit Bio
            </button>
          )}

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
  );
}


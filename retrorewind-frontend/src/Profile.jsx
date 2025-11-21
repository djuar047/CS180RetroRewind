import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // import navigate hook

export default function Profile({ auth }) {
  const userId = auth?.userId;
  const token = auth?.token;
  const navigate = useNavigate(); // add this

  // Guard if user is not logged in
  if (!userId || !token) {
    return (
      <p className="text-center mt-10 text-zinc-300">
        You must be logged in to view your profile.
      </p>
    );
  }

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    avatar_url: "",
  });

  // Fetch user data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`http://127.0.0.1:5000/profile/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          setFormData({
            username: data.username || "",
            email: data.email || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
          });
        } else {
          setError(data.error || "Failed to load profile.");
        }
      } catch (err) {
        console.error(err);
        setError("Server not reachable.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId, token]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5000/profile/${userId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(formData);
        setEditMode(false);
        alert("Profile updated successfully!");
      } else {
        alert(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Server not reachable.");
    }
  }

  if (loading) return <p className="text-center mt-10 text-zinc-300">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-400">{error}</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        <div className="flex flex-col items-center">
          <img
            src={formData.avatar_url || "https://placehold.co/120x120?text=User"}
            alt="User avatar"
            className="w-24 h-24 rounded-full border border-zinc-700 mb-4"
          />

          {!editMode ? (
            <>
              <h1 className="text-2xl font-bold text-amber-400">{user.username}</h1>
              <p className="text-sm text-zinc-400">{user.email}</p>
              <p className="mt-2 text-sm text-zinc-300">{user.bio}</p>
            </>
          ) : (
            <form onSubmit={handleUpdate} className="w-full flex flex-col gap-3 mt-2">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                className="p-2 rounded bg-zinc-800 border border-zinc-700"
                required
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="p-2 rounded bg-zinc-800 border border-zinc-700"
                required
              />
              <input
                type="text"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                placeholder="Avatar URL"
                className="p-2 rounded bg-zinc-800 border border-zinc-700"
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Bio"
                className="p-2 rounded bg-zinc-800 border border-zinc-700 resize-none"
              />
              <div className="flex gap-2 justify-center mt-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {!editMode && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setEditMode(true)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              Edit Profile
            </button>
            {/* Return to Home Button */}
          <button
    onClick={() => navigate("/")}
    className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg"
  >
    Home
  </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getProfile } from "./api";

export default function ProfilePage({ auth }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getProfile(auth.userId);
      setProfile(data);
    };
    fetchProfile();
  }, [auth.userId]);

  if (!profile) return <p className="text-zinc-400 p-6">Loading profile...</p>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <img
        src={profile.avatar_url || "https://placehold.co/100x100?text=Avatar"}
        alt="Avatar"
        className="rounded-full w-24 h-24 mb-4"
      />
      <p><strong>Username:</strong> {profile.username}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Bio:</strong> {profile.bio}</p>
      <p><strong>Wishlist:</strong> {(profile.wishlist || []).join(", ") || "None"}</p>
      <p><strong>Library:</strong> {(profile.library || []).join(", ") || "None"}</p>
    </div>
  );
}

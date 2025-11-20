import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateAccount() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username || !email || !password) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        // Optionally, automatically log in the user or redirect to login
        alert("Account created successfully!");
        navigate("/login");
      }
    } catch (e) {
      setError("Server not reachable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-amber-400">
          Create Account
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 focus:border-blue-600 outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 focus:border-blue-600 outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 focus:border-blue-600 outline-none"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 focus:border-blue-600 outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-blue-600 hover:bg-blue-500 rounded-lg py-2 font-semibold transition disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-center text-amber-300">{error}</p>
        )}
      </div>
    </div>
  );
}

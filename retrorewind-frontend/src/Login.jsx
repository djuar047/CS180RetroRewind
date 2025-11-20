import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  // Store user input
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // hook to navigate programmatically


  // Temporary message for testing
  const [message, setMessage] = useState("");

  // Simple login button just to test the UI for now
  async function handleLogin(e) {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), // make sure you send email
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      alert(data.message); // optional: show success message
      navigate("/"); // redirect to home page
    } catch (err) {
      alert(err.message || "Login failed, try again.");
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-amber-400">
          RetroRewind Login
        </h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

          <button
            type="submit"
            className="mt-2 bg-blue-600 hover:bg-blue-500 rounded-lg py-2 font-semibold transition"
          >
            Log In
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-center text-amber-300">{message}</p>
        )}
      </div>
    </div>
  );
}

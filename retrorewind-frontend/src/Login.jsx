import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ auth, setAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // If user is already logged in, show log out option
  if (auth?.userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-center text-amber-300 mb-4">
          You are already logged in. Please log out first to log in as another user.
        </p>
        <button
          onClick={() => setAuth({ userId: null, token: null })}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-white"
        >
          Log Out
        </button>
      </div>
    );
  }

  // Simple login button just to test the UI for now
  async function handleLogin(e) {
  e.preventDefault();
  try {
    const res = await fetch("http://127.0.0.1:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    // store userId and token globally
    setAuth({
      userId: data.user_id,
      token: data.auth_token,
    });


    alert(data.message);

    // go to profile screen after login
    navigate("/");
  } catch (err) {
    console.error(err);
    setMessage(err.message || "Login failed");
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

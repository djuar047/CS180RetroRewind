import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  // keep track of what the user typed
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // small messages (error / success)
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // runs when login button is clicked
  async function handleLogin(e) {
    e.preventDefault();

    // quick empty-field check
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // ask backend to log into Firebase for us
      const firebaseRes = await fetch("http://127.0.0.1:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const firebaseData = await firebaseRes.json();

      // if Firebase rejects the login → show message
      if (!firebaseRes.ok) {
        setMessage(firebaseData.error || "Login failed.");
        setLoading(false);
        return;
      }

      // Firebase gave us an idToken + UID (proof user is real)
      const idToken = firebaseData.idToken;
      const uid = firebaseData.uid;

      // link Firebase user to MongoDB user (create if missing)
      const mongoRes = await fetch("http://127.0.0.1:5000/auth/link-mongo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_token: idToken,
          username: email.split("@")[0], // temp username based on email
        }),
      });

      const mongoData = await mongoRes.json();

      // if backend failed to link account
      if (!mongoRes.ok) {
        setMessage(mongoData.error || "Failed to link account.");
        setLoading(false);
        return;
      }

      // store info so other pages know the user is logged in
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("firebase_uid", uid);
      localStorage.setItem("mongo_user_id", mongoData.mongo_user_id);
      localStorage.setItem("rr_email", email); // profile needs this later

      // go to profile page with email included
      setMessage("Login successful! Redirecting...");
      setTimeout(
        () =>
          navigate("/profile", {
            state: { email }, // lets profile update right away
          }),
        700
      );
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-amber-400">
          RetroRewind Login
        </h1>

        {/* login form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // update email field
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 focus:border-blue-600 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // update password field
            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 focus:border-blue-600 outline-none"
          />

          {/* disable button while logging in */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-blue-600 hover:bg-blue-500 rounded-lg py-2 font-semibold transition disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        {/* shows errors or success messages */}
        {message && (
          <p className="mt-4 text-sm text-center text-amber-300">{message}</p>
        )}
      </div>
    </div>
  );
}


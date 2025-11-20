import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./api";

export default function LoginPage({ setAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await loginUser(email, password);
    if (res.auth_token) {
      setAuth({ userId: res.user_id, token: res.auth_token });
      navigate("/"); // go to home after login
    } else {
      setError(res.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <form onSubmit={handleLogin} className="bg-zinc-900 p-6 rounded-xl w-80 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        {error && <p className="text-red-400">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 rounded bg-zinc-800 border border-zinc-700"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 rounded bg-zinc-800 border border-zinc-700"
        />
        <button className="bg-blue-600 hover:bg-blue-500 p-2 rounded">Login</button>
      </form>
    </div>
  );
}

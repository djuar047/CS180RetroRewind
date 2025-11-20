// connects login frontend to backend? still a work in progress

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getProfile(userId) {
  const res = await fetch(`${API_BASE}/profile/${userId}`);
  return res.json();
}

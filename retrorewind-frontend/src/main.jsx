import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // lets us move between pages like Home, Login, and Profile
import "./index.css";
import App from "./App.jsx";

function AppWrapper() {
  // global auth state shared across all pages
  const [auth, setAuth] = useState({ userId: null, token: null });

  return <App auth={auth} setAuth={setAuth} />;
}

// This sets up the app and connects it to the "root" element in index.html.
// We also wrap it with BrowserRouter so our app can use page routes.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </StrictMode>
);

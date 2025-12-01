import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

function AppWrapper() {
  // global auth state shared across all pages
  const [auth, setAuth] = useState({ userId: null, token: null });

  return <App auth={auth} setAuth={setAuth} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  </StrictMode>,
);

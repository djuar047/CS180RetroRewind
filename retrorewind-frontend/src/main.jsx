import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // lets us move between pages like Home, Login, and Profile
import "./index.css";
import App from "./App.jsx";

// This sets up the app and connects it to the "root" element in index.html.
// We also wrap it with BrowserRouter so our app can use page routes.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* BrowserRouter allows page navigation without reloading the whole site */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);


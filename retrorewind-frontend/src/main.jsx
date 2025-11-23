import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import CommunityThreads from "./pages/CommunityThreads.jsx";
import ThreadDetail from "./pages/ThreadDetail.jsx";


// This sets up the app and connects it to the "root" element in index.html.
// We also wrap it with BrowserRouter so our app can use page routes.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* BrowserRouter allows page navigation without reloading the whole site */}
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/threads" element={<CommunityThreads />} />
        <Route path="/threads/:title" element={<ThreadDetail />} />

      </Routes>

    </BrowserRouter>
  </StrictMode>
);

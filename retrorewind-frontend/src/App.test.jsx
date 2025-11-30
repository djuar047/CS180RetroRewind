import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

// Mock fetch globally
global.fetch = jest.fn();

// Mock images
jest.mock("./assets/bear.webp", () => "bear.webp");

// Mock auth object
const mockAuth = { userId: "user123", token: "token123" };

// Global mock implementation for fetch
beforeEach(() => {
  fetch.mockReset();
  fetch.mockImplementation((url) => {
    if (url.includes("/profile")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          username: "testuser",
          email: "test@example.com",
          favorites: ["Halo"],
        }),
      });
    }
    if (url.includes("/library") || url.includes("/ratings")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      });
    }
    // default search endpoint
    return Promise.resolve({
      ok: true,
      json: async () => [
        { title: "Halo: Combat Evolved", type: "Game" },
        { title: "Chrono Trigger", type: "Game" },
      ],
    });
  });
});

describe("App component", () => {
  test("renders Home route by default", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Track, Rate, and Relive the Classics/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Try 'Halo'/i)).toBeInTheDocument();
  });

  test("renders Login route", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });

  test("renders Profile route", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>
      );
    });

    const username = await screen.findByText(/testuser/i);
    expect(username).toBeInTheDocument();
  });
});

describe("Home component interactions", () => {
  test("typing in search input updates value", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>
      );
    });

    const input = screen.getByPlaceholderText(/Try 'Halo'/i);
    fireEvent.change(input, { target: { value: "Halo" } });
    expect(input.value).toBe("Halo");
  });

  test("search shows mock results if backend fails", async () => {
    fetch.mockImplementation(() => Promise.reject("API down"));

    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>
      );
    });

    const input = screen.getByPlaceholderText(/Try 'Halo'/i);
    fireEvent.change(input, { target: { value: "Halo" } });
    fireEvent.submit(screen.getByRole("button", { name: /search/i }));

    await waitFor(() =>
      expect(screen.getByText(/Halo: Combat Evolved/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Backend not reachable/i)).toBeInTheDocument();
  });

  test("Filters can be applied and reset", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>
      );
    });

    const applyBtn = screen.getByText(/Apply Filters/i);
    const resetBtn = screen.getByText(/Reset Filters/i);

    fireEvent.click(applyBtn);
    fireEvent.click(resetBtn);
  });
});

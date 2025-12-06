import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App.jsx";

// Mock fetch globally
global.fetch = jest.fn();
global.alert = jest.fn();

// Mock images
jest.mock("./assets/bear.webp", () => "bear.webp");

// Mock auth object
const mockAuth = { userId: "user123", token: "token123" };

// Global mock implementation for fetch
beforeEach(() => {
  fetch.mockReset();
  alert.mockClear();
  fetch.mockImplementation((url) => {
    // Profile endpoint
    if (url.includes("/profile/user123") && !url.includes("/library") && !url.includes("/ratings")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          username: "testuser",
          email: "test@example.com",
          bio: "Test bio",
          avatar_url: "",
        }),
      });
    }
    // Library endpoint
    if (url.includes("/library")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    }
    // Ratings endpoint
    if (url.includes("/ratings")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    }
    // Login endpoint
    if (url.includes("/login")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          user_id: "user123",
          auth_token: "token123",
          message: "Login successful",
        }),
      });
    }
    // Register endpoint
    if (url.includes("/register")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ message: "User created successfully" }),
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

describe("App component - Routing", () => {
  test("renders Home route by default", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(
      screen.getByText(/Track, rate, and relive the classics/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Try 'Halo'/i)).toBeInTheDocument();
  });

  test("renders Login route", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/RetroRewind Login/i)).toBeInTheDocument();
  });

  test("renders Profile route", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const username = await screen.findByText(/testuser/i);
    expect(username).toBeInTheDocument();
  });

  test("renders Create Account route", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/createAccount"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const createAccountElements = screen.getAllByText(/Create Account/i);
    expect(createAccountElements.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
  });
});

describe("Home component - Header and Navigation", () => {
  test("displays RetroRewind branding", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const retroRewindElements = screen.getAllByText(/RetroRewind/i);
    expect(retroRewindElements.length).toBeGreaterThan(0);
    const bearElements = screen.getAllByText(/Bear 180/i);
    expect(bearElements.length).toBeGreaterThan(0);
  });

  test("displays bear logo image", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const bearImage = screen.getByAltText(/Bear 180/i);
    expect(bearImage).toBeInTheDocument();
    expect(bearImage).toHaveAttribute("src", "bear.webp");
  });

  test("shows Login button when not authenticated", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const loginLinks = screen.getAllByText(/Login/i);
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  test("shows Logout button when authenticated", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  test("logout button is clickable", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    // Wait for component to fully render with auth
    await waitFor(() => {
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    });

    const logoutBtn = screen.getByText(/Logout/i);
    
    await act(async () => {
      fireEvent.click(logoutBtn);
    });

    // Verify alert was called
    expect(alert).toHaveBeenCalledWith("Logged out!");
  });

  test("displays Community Threads link", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/Community Threads/i)).toBeInTheDocument();
  });

  test("displays Create Account link", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
  });

  test("displays Profile link", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });
});

describe("Home component - Search functionality", () => {
  test("typing in search input updates value", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const input = screen.getByPlaceholderText(/Try 'Halo'/i);
    fireEvent.change(input, { target: { value: "Halo" } });
    expect(input.value).toBe("Halo");
  });

  test("search button is present", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByRole("button", { name: /Search/i })).toBeInTheDocument();
  });

  test("search shows mock results if backend fails", async () => {
    fetch.mockImplementation(() => Promise.reject("API down"));

    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const input = screen.getByPlaceholderText(/Try 'Halo'/i);
    fireEvent.change(input, { target: { value: "Halo" } });
    fireEvent.submit(screen.getByRole("button", { name: /search/i }));

    await waitFor(() =>
      expect(screen.getByText(/Halo: Combat Evolved/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Backend not reachable/i)).toBeInTheDocument();
  });

  test("shows empty state when no results", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/No results yet/i)).toBeInTheDocument();
  });

  test("clearing search input works", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const input = screen.getByPlaceholderText(/Try 'Halo'/i);
    fireEvent.change(input, { target: { value: "Test" } });
    expect(input.value).toBe("Test");
    
    fireEvent.change(input, { target: { value: "" } });
    expect(input.value).toBe("");
  });
});

describe("Home component - Filter functionality", () => {
  test("type filter dropdown is present", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const typeFilter = screen.getByTitle("Type");
    expect(typeFilter).toBeInTheDocument();
    expect(typeFilter.tagName).toBe("SELECT");
  });

  test("year from input is present", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByPlaceholderText(/Year from/i)).toBeInTheDocument();
  });

  test("year to input is present", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByPlaceholderText(/Year to/i)).toBeInTheDocument();
  });

  test("platform filter input is present", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByPlaceholderText(/Platform/i)).toBeInTheDocument();
  });

  test("Apply Filters button is present", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/Apply Filters/i)).toBeInTheDocument();
  });

  test("Filters can be applied", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const applyBtn = screen.getByText(/Apply Filters/i);
    fireEvent.click(applyBtn);
  });

  test("type filter can be changed", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const typeFilter = screen.getByTitle("Type");
    fireEvent.change(typeFilter, { target: { value: "Game" } });
    expect(typeFilter.value).toBe("Game");
  });

  test("year from input accepts numeric input", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const yearFromInput = screen.getByPlaceholderText(/Year from/i);
    fireEvent.change(yearFromInput, { target: { value: "2000" } });
    expect(yearFromInput.value).toBe("2000");
  });

  test("year to input accepts numeric input", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const yearToInput = screen.getByPlaceholderText(/Year to/i);
    fireEvent.change(yearToInput, { target: { value: "2024" } });
    expect(yearToInput.value).toBe("2024");
  });

  test("platform filter accepts text input", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const platformInput = screen.getByPlaceholderText(/Platform/i);
    fireEvent.change(platformInput, { target: { value: "Xbox" } });
    expect(platformInput.value).toBe("Xbox");
  });
});

describe("Login component tests", () => {
  test("login form has email and password inputs", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  test("login email input updates on change", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const emailInput = screen.getByPlaceholderText(/Email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
  });

  test("login password input updates on change", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const passwordInput = screen.getByPlaceholderText(/Password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(passwordInput.value).toBe("password123");
  });

  test("login shows logout option when already authenticated", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByText(/already logged in/i)).toBeInTheDocument();
  });
});

describe("CreateAccount component tests", () => {
  test("create account form has all required fields", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/createAccount"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm Password/i)).toBeInTheDocument();
  });

  test("create account username input updates", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/createAccount"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    fireEvent.change(usernameInput, { target: { value: "newuser" } });
    expect(usernameInput.value).toBe("newuser");
  });

  test("create account email input updates", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/createAccount"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const emailInput = screen.getByPlaceholderText(/Email/i);
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });
    expect(emailInput.value).toBe("new@example.com");
  });

  test("create account password input updates", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/createAccount"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const passwordInput = screen.getByPlaceholderText(/^Password$/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    expect(passwordInput.value).toBe("password123");
  });

  test("create account confirm password input updates", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/createAccount"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const confirmInput = screen.getByPlaceholderText(/Confirm Password/i);
    fireEvent.change(confirmInput, { target: { value: "password123" } });
    expect(confirmInput.value).toBe("password123");
  });
});

describe("Profile component tests", () => {
  test("profile shows username when loaded", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const username = await screen.findByText(/testuser/i);
    expect(username).toBeInTheDocument();
  });

  test("profile shows email when loaded", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const email = await screen.findByText(/test@example.com/i);
    expect(email).toBeInTheDocument();
  });

  test("profile shows login message when not authenticated", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={null} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/must be logged in/i)).toBeInTheDocument();
    });
  });

  test("profile has Edit Profile button when authenticated", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const editButton = await screen.findByText(/Edit Profile/i);
    expect(editButton).toBeInTheDocument();
  });

  test("profile has Home button", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const homeButton = await screen.findByText(/^Home$/i);
    expect(homeButton).toBeInTheDocument();
  });

  test("profile displays My Library section", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const librarySection = await screen.findByText(/My Library/i);
    expect(librarySection).toBeInTheDocument();
  });

  test("profile displays My Ratings section", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/profile"]}>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const ratingsSection = await screen.findByText(/My Ratings/i);
    expect(ratingsSection).toBeInTheDocument();
  });
});

describe("Footer tests", () => {
  test("footer displays copyright year", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  test("footer displays team name", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <App auth={mockAuth} setAuth={jest.fn()} />
        </MemoryRouter>,
      );
    });

    const footerText = screen.getByText(/RetroRewind.*CS180/i);
    expect(footerText).toBeInTheDocument();
  });
});

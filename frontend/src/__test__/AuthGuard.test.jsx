import { render, screen } from "@testing-library/react";
import { describe, it, vi } from "vitest";
import AuthGuard from "../components/AuthGuard";
import { MemoryRouter } from "react-router-dom";

// Mock useAuth hook
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../hooks/useAuth";

describe("AuthGuard", () => {
  it("shows loading spinner when loading is true", () => {
    useAuth.mockReturnValue({ loading: true, isAuthenticated: false });
    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    useAuth.mockReturnValue({ loading: false, isAuthenticated: false });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    useAuth.mockReturnValue({ loading: false, isAuthenticated: true });
    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});

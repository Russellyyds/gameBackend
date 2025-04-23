import { render, screen} from "@testing-library/react";
import GameCard from "../components/GameCard";
import { MemoryRouter } from "react-router-dom";

describe("GameCard", () => {
  const mockGame = {
    id: 1,
    name: "Sample Game",
    thumbnail: "https://example.com/thumb.jpg",
    questions: [{ duration: 10 }, { duration: 20 }],
    active: null,
  };

  it("renders game name, question count, and duration", () => {
    render(<GameCard game={mockGame} />, { wrapper: MemoryRouter });

    expect(screen.getByText("Sample Game")).toBeInTheDocument();
    expect(screen.getByText("Questions: 2")).toBeInTheDocument();
    expect(screen.getByText("Duration: 30 seconds")).toBeInTheDocument();
  });

  it("renders Start Game button if no active session", () => {
    render(<GameCard game={mockGame} />, { wrapper: MemoryRouter });

    expect(screen.getByRole("button", { name: "Start Game" })).toBeInTheDocument();
  });

  it("renders Stop Session button if session is active", () => {
    const activeGame = { ...mockGame, active: 999 };
    render(<GameCard game={activeGame} />, { wrapper: MemoryRouter });

    expect(screen.getByRole("button", { name: "Stop Session" })).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SearchBar from "../components/SearchBar";

describe("SearchBar", () => {
  it("renders input with correct initial value", () => {
    render(<SearchBar value="init" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Search games...")).toHaveValue("init");
  });

  it("calls onChange with new value on input", () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);
    const input = screen.getByPlaceholderText("Search games...");
    fireEvent.change(input, { target: { value: "quiz" } });
    expect(handleChange).toHaveBeenCalledWith("quiz");
  });

  it("handles input of mixed case characters", () => {
    const handleChange = vi.fn();
    render(<SearchBar value="QuiZ" onChange={handleChange} />);
    const input = screen.getByPlaceholderText("Search games...");
    fireEvent.change(input, { target: { value: "BigBrain" } });
    expect(handleChange).toHaveBeenCalledWith("BigBrain");
  });
  
  it("handles empty string input", () => {
    const handleChange = vi.fn();
    render(<SearchBar value="non-empty" onChange={handleChange} />);
    const input = screen.getByPlaceholderText("Search games...");
    fireEvent.change(input, { target: { value: "" } });
    expect(handleChange).toHaveBeenCalledWith("");
  });  
});
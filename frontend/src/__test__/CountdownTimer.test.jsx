// CountdownTimer.test.jsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CountdownTimer from "../components/CountdownTimer";

describe("CountdownTimer", () => {
  it("renders remaining time", () => {
    render(<CountdownTimer remaining={25} total={30} />);
    expect(screen.getByText("Time Remaining: 25 seconds")).toBeInTheDocument();
  });

  it("shows error color when in critical zone", () => {
    render(<CountdownTimer remaining={5} total={30} criticalThreshold={10} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar.className).toMatch(/MuiLinearProgress-colorError/);
  });

  it("handles 0 remaining correctly", () => {
    render(<CountdownTimer remaining={0} total={30} />);
    expect(screen.getByText("Time Remaining: 0 seconds")).toBeInTheDocument();
  });
});

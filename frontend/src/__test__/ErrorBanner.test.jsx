import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ErrorBanner from "../components/ErrorBanner";

describe("ErrorBanner", () => {
  it("renders error message when message is provided", () => {
    render(<ErrorBanner message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders nothing when message is empty", () => {
    const { container } = render(<ErrorBanner message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when message is null", () => {
    const { container } = render(<ErrorBanner message={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
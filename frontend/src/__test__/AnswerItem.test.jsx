import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AnswerItem from "../components/AnswerItem";

const sampleAnswer = {
  id: 1,
  text: "Sample answer",
  isCorrect: false,
};

describe("AnswerItem", () => {
  it("renders answer text", () => {
    render(
      <AnswerItem
        index={0}
        answer={sampleAnswer}
        questionType="multiple"
        disableDelete={false}
        onChange={() => {}}
        onMarkCorrect={() => {}}
        onDelete={() => {}}
      />
    );
    expect(screen.getByDisplayValue("Sample answer")).toBeInTheDocument();
    expect(screen.getByText("1.")).toBeInTheDocument();
  });

  it("calls onChange when answer text is changed", () => {
    const handleChange = vi.fn();
    render(
      <AnswerItem
        index={0}
        answer={sampleAnswer}
        questionType="multiple"
        disableDelete={false}
        onChange={handleChange}
        onMarkCorrect={() => {}}
        onDelete={() => {}}
      />
    );
    fireEvent.change(screen.getByLabelText("Answer Text"), {
      target: { value: "Updated text" },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  it("calls onMarkCorrect when radio is clicked (single)", () => {
    const handleMark = vi.fn();
    render(
      <AnswerItem
        index={0}
        answer={sampleAnswer}
        questionType="single"
        disableDelete={false}
        onChange={() => {}}
        onMarkCorrect={handleMark}
        onDelete={() => {}}
      />
    );
    fireEvent.click(screen.getByLabelText("Correct"));
    expect(handleMark).toHaveBeenCalledWith(1);
  });

  it("calls onMarkCorrect when checkbox is toggled (multiple)", () => {
    const handleMark = vi.fn();
    render(
      <AnswerItem
        index={0}
        answer={sampleAnswer}
        questionType="multiple"
        disableDelete={false}
        onChange={() => {}}
        onMarkCorrect={handleMark}
        onDelete={() => {}}
      />
    );
    fireEvent.click(screen.getByLabelText("Correct"));
    expect(handleMark).toHaveBeenCalledWith(1);
  });
});

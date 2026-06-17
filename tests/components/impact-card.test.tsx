import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImpactCard } from "../../src/components/impact-card";

describe("ImpactCard", () => {
  it("renders all four impact metrics", () => {
    render(<ImpactCard co2Kg={42} />);
    expect(screen.getByText(/Your impact/i)).toBeInTheDocument();
    expect(screen.getByText(/CO₂ avoided/)).toBeInTheDocument();
    expect(screen.getByText(/Tree-years/)).toBeInTheDocument();
    expect(screen.getByText(/Water saved/)).toBeInTheDocument();
    expect(screen.getByText(/Energy saved/)).toBeInTheDocument();
    expect(screen.getByText("42 kg")).toBeInTheDocument();
    expect(screen.getByText("84 kWh")).toBeInTheDocument();
    expect(screen.getByText("126 L")).toBeInTheDocument();
  });

  it("clamps negative input to zero", () => {
    render(<ImpactCard co2Kg={-10} />);
    expect(screen.getByText("0 kg")).toBeInTheDocument();
  });
});

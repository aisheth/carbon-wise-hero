import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopRecommendations } from "../../src/components/top-recommendations";
import type { Recommendation } from "../../src/lib/carbon";

const recs: Recommendation[] = [
  { category: "transport", title: "Bike to work", detail: "swap car commute", estimatedSavingKg: 50 },
  { category: "food", title: "Plant-based Mondays", detail: "skip meat", estimatedSavingKg: 20 },
  { category: "electricity", title: "LED bulbs", detail: "swap incandescent", estimatedSavingKg: 5 },
  { category: "shopping", title: "Buy used", detail: "thrift", estimatedSavingKg: 80 },
];

describe("TopRecommendations", () => {
  it("renders empty state when no recommendations", () => {
    render(<TopRecommendations recommendations={[]} />);
    expect(screen.getByText(/no high-impact changes/i)).toBeInTheDocument();
  });

  it("renders top N sorted by estimated saving", () => {
    render(<TopRecommendations recommendations={recs} limit={3} />);
    expect(screen.getByText(/Top 3 AI-prioritized actions/i)).toBeInTheDocument();
    expect(screen.getByText("Buy used")).toBeInTheDocument();
    expect(screen.getByText("Bike to work")).toBeInTheDocument();
    expect(screen.getByText("Plant-based Mondays")).toBeInTheDocument();
    expect(screen.queryByText("LED bulbs")).not.toBeInTheDocument();
  });

  it("respects custom limit", () => {
    render(<TopRecommendations recommendations={recs} limit={1} />);
    expect(screen.getByText("Buy used")).toBeInTheDocument();
    expect(screen.queryByText("Bike to work")).not.toBeInTheDocument();
  });
});

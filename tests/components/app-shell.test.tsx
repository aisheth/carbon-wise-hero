import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const navigateMock = vi.fn();
const locationState = { pathname: "/dashboard" };
const signOutMock = vi.fn().mockResolvedValue({ error: null });

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, className, ...rest }: any) => (
    <a href={to} className={className} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => navigateMock,
  useLocation: () => locationState,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { signOut: signOutMock } },
}));

import { AppShell } from "../../src/components/app-shell";

function renderShell() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <AppShell>
        <div>content-here</div>
      </AppShell>
    </QueryClientProvider>,
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    signOutMock.mockClear();
    locationState.pathname = "/dashboard";
  });

  it("renders children and all nav links", () => {
    renderShell();
    expect(screen.getByText("content-here")).toBeInTheDocument();
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Missions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Leaderboard").length).toBeGreaterThan(0);
  });

  it("toggles the mobile menu when the menu button is clicked", () => {
    renderShell();
    const toggle = screen.getByLabelText(/toggle menu/i);
    // Initially closed — only desktop sidebar renders nav once
    const before = screen.getAllByText("Assessment").length;
    fireEvent.click(toggle);
    const afterOpen = screen.getAllByText("Assessment").length;
    expect(afterOpen).toBeGreaterThan(before);
    fireEvent.click(toggle);
    const afterClose = screen.getAllByText("Assessment").length;
    expect(afterClose).toBe(before);
  });

  it("highlights the active route", () => {
    locationState.pathname = "/missions";
    renderShell();
    const missionsLinks = screen.getAllByText("Missions");
    // Find the parent <a> with active style
    const active = missionsLinks.find((el) => el.closest("a")?.className.includes("bg-primary-soft"));
    expect(active).toBeTruthy();
  });

  it("signs out and navigates to /auth", async () => {
    renderShell();
    const buttons = screen.getAllByRole("button", { name: /sign out/i });
    fireEvent.click(buttons[0]);
    // Allow promise chain to flush
    await Promise.resolve();
    await Promise.resolve();
    expect(signOutMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith({ to: "/auth", replace: true });
  });
});

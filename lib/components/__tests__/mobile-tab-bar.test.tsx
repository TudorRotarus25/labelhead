// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileTabBar } from "../mobile-tab-bar";
import { SidebarProvider, useSidebar } from "../sidebar-context";

/** Mock next/navigation's usePathname; switched per-test. */
const mockPathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

/** Capture the current sidebar state via a helper so we can assert against it. */
function WithProbe({ onState }: { onState: (open: boolean) => void }) {
  const { open } = useSidebar();
  onState(open);
  return null;
}

function renderBar(pathname = "/") {
  mockPathname.mockReturnValue(pathname);
  let currentOpen = false;
  render(
    <SidebarProvider>
      <MobileTabBar />
      <WithProbe onState={(o) => { currentOpen = o; }} />
    </SidebarProvider>
  );
  return { getOpen: () => currentOpen };
}

describe("MobileTabBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders exactly two tabs: Notes and Scan", () => {
    renderBar();
    expect(screen.getByRole("button", { name: /notes/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /scan/i })).toBeTruthy();
  });

  it("Notes tab opens the sidebar when clicked", () => {
    const { getOpen } = renderBar();
    expect(getOpen()).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /notes/i }));
    expect(getOpen()).toBe(true);
  });

  it("Scan tab links to /scan", () => {
    renderBar();
    const scan = screen.getByRole("link", { name: /scan/i });
    expect(scan.getAttribute("href")).toBe("/scan");
  });

  it("highlights the Scan tab when pathname is /scan", () => {
    renderBar("/scan");
    const scan = screen.getByRole("link", { name: /scan/i });
    expect(scan.getAttribute("aria-current")).toBe("page");
  });

  it("does not highlight the Scan tab on non-scan routes", () => {
    renderBar("/n/abc/edit");
    const scan = screen.getByRole("link", { name: /scan/i });
    expect(scan.getAttribute("aria-current")).not.toBe("page");
  });

  it("uses a nav landmark with an accessible label", () => {
    renderBar();
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(nav).toBeTruthy();
  });

  it("is hidden on desktop via md:hidden class", () => {
    renderBar();
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(nav.className).toContain("md:hidden");
  });
});

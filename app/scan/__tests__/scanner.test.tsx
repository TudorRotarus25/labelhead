// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScannerView } from "../scanner-view";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock jsqr
vi.mock("jsqr", () => ({
  default: vi.fn(() => null),
}));

// Mock server action
vi.mock("@/app/actions/notes", () => ({
  getNote: vi.fn(() => Promise.resolve(null)),
}));

// Mock getUserMedia
const mockGetUserMedia = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: mockGetUserMedia },
    writable: true,
    configurable: true,
  });
});

describe("ScannerView", () => {
  it("renders the scanner container", () => {
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));
    render(<ScannerView />);
    expect(screen.getByTestId("scanner-view")).toBeTruthy();
  });

  it("renders a video element", () => {
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));
    render(<ScannerView />);
    expect(screen.getByTestId("scanner-video")).toBeTruthy();
  });

  it("renders a back button with aria label", () => {
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));
    render(<ScannerView />);
    expect(screen.getByLabelText("Go back")).toBeTruthy();
  });

  it("shows permission denied state when camera access fails", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("NotAllowedError"));
    render(<ScannerView />);

    // Wait for async permission request to settle
    const denied = await screen.findByTestId("permission-denied");
    expect(denied).toBeTruthy();
    expect(screen.getByText("Camera access required")).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
  });

  it("requests camera with environment facing mode", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("denied"));
    render(<ScannerView />);

    // Wait for the effect to run
    await screen.findByTestId("permission-denied");

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "environment" },
    });
  });
});

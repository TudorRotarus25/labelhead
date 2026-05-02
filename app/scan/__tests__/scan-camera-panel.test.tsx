// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { forwardRef } from "react";
import { render, screen } from "@testing-library/react";
import { ScanCameraPanel } from "../scan-camera-panel";

// Helper: capture a ref we can inspect after render
function TestHost({
  showFeedback,
  onBack,
}: {
  showFeedback: boolean;
  onBack: () => void;
}) {
  return <ScanCameraPanel showFeedback={showFeedback} onBack={onBack} />;
}

describe("ScanCameraPanel", () => {
  it("renders a video element", () => {
    render(<TestHost showFeedback={false} onBack={vi.fn()} />);
    expect(screen.getByTestId("scanner-video")).toBeTruthy();
  });

  it("renders a back button with aria label", () => {
    render(<TestHost showFeedback={false} onBack={vi.fn()} />);
    expect(screen.getByLabelText("Go back")).toBeTruthy();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(<TestHost showFeedback={false} onBack={onBack} />);
    screen.getByLabelText("Go back").click();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the viewfinder guide", () => {
    render(<TestHost showFeedback={false} onBack={vi.fn()} />);
    expect(screen.getByTestId("scanner-viewfinder")).toBeTruthy();
  });

  it("does not render the detection badge when showFeedback is false", () => {
    render(<TestHost showFeedback={false} onBack={vi.fn()} />);
    expect(screen.queryByTestId("scanner-detection-badge")).toBeNull();
  });

  it("renders the detection badge when showFeedback is true", () => {
    render(<TestHost showFeedback={true} onBack={vi.fn()} />);
    expect(screen.getByTestId("scanner-detection-badge")).toBeTruthy();
  });

  it("forwards videoRef to the video element", () => {
    const ref = { current: null as HTMLVideoElement | null };
    // Directly render with a ref forwarded prop
    const Wrapper = forwardRef<HTMLVideoElement>(function Wrapper(_, r) {
      return (
        <ScanCameraPanel
          showFeedback={false}
          onBack={vi.fn()}
          videoRef={r as React.RefObject<HTMLVideoElement | null>}
        />
      );
    });
    render(<Wrapper ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLVideoElement);
  });
});

import type { Metadata } from "next";
import { ScannerViewLoader } from "./scanner-view-loader";

export const metadata: Metadata = {
  title: "Scan QR Code — LabelHead",
  description: "Scan a LabelHead QR code to view note contents",
};

/** Server component shell for the QR scanner page. */
export default function ScanPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-black">
      <ScannerViewLoader />
    </div>
  );
}

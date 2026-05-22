import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bold Bible Talk",
  description:
    "Bold Bible Talk — open, honest Bible discussion every Thursday at Rosebank Mall.",
  openGraph: {
    title: "Bold Bible Talk",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

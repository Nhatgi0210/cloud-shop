import type { Metadata } from "next";
import { Providers } from "../components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloudKicks | Phong cách trên từng bước chân",
  description:
    "Khám phá sneaker, giày chạy bộ và lifestyle tại CloudKicks. Bước đi phong cách, tự tin chất riêng.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Browser extensions may add data-* attributes before React hydrates.
    // Limit suppression to <html>; descendants retain hydration checks.
    <html lang="vi" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

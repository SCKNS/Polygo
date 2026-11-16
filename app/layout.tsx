import type { Metadata } from "next";
import { Caveat, DM_Sans } from "next/font/google";
import "./globals.css";

// Latin-ext, Türkçe harflerin başka bir yazı tipine düşmesini önler.
const handwriting = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-hand",
  display: "swap",
});
const interfaceFont = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Polygo — küçük bir çizim defteri",
  description:
    "Bir ızgara, birkaç hücre, sana ait bir işaret. Polygo çizim defteri.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${handwriting.variable} ${interfaceFont.variable}`}>
        {children}
      </body>
    </html>
  );
}

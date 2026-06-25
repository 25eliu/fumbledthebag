import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "fumbledthebag",
  description: "I should've bought ___",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body className="font-sans antialiased">
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}

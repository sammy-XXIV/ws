import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

export const metadata: Metadata = {
  title: "NFT Sweeper",
  description: "Sweep sellable NFTs on Robinhood Chain in one go.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={bebasNeue.variable}>
      <body>
        <Providers>{children}</Providers>
        <div
          style={{
            position: "fixed",
            right: "1rem",
            top: "0.75rem",
            fontFamily: "var(--font-bebas-neue)",
            fontSize: "1.1rem",
            letterSpacing: "0.05em",
          }}
        >
          made by sammy
        </div>
      </body>
    </html>
  );
}

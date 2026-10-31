import type { Metadata } from "next";

import {
  Noto_Sans_Thai,
  Noto_Serif_Thai,
} from "next/font/google";

import WalletProvider from "@/components/wallet/WalletProvider";

import "./globals.css";

const notoSansThai =
  Noto_Sans_Thai({
    subsets: ["thai"],

    variable:
      "--font-sans",

    weight: [
      "400",
      "500",
      "600",
      "700",
      "800",
    ],
  });

const notoSerifThai =
  Noto_Serif_Thai({
    subsets: ["thai"],

    variable:
      "--font-serif",

    weight: [
      "400",
      "500",
      "600",
      "700",
    ],
  });

export const metadata: Metadata = {
  title: "SkillChain",

  description:
    "Skill Token Exchange Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`
          ${notoSansThai.variable}
          ${notoSerifThai.variable}
          font-sans
        `}
      >
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
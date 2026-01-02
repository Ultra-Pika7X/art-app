import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AetherArt | Professional Drawing Suite",
  description: "A premium drawing and painting application for digital artists. Created with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

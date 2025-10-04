import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ClientWrapper } from "@/components/client-wrapper";

export const metadata: Metadata = {
  title: "Tic Tac Toe",
  description: "Play Tic Tac Toe on Stacks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientWrapper>
          <div className="antialiased bg-gray-900 text-gray-50">
            <Navbar />
            {children}
          </div>
        </ClientWrapper>
      </body>
    </html>
  );
}

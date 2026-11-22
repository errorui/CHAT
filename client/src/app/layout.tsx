import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { ChatProvider } from "@/context/ChatProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "talk-tip",
  description: "Real-time one-to-one and group chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChatProvider>
        
        {children}
      <Toaster />
      </ChatProvider>
      </body>
    </html>
  );
}

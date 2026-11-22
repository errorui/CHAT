import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { ChatProvider } from "@/context/ChatProvider";
import { THEME_SCRIPT } from "@/lib/theme";

const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });

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
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ChatProvider>
        
        {children}
      <Toaster />
      </ChatProvider>
      </body>
    </html>
  );
}

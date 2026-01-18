import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventHorizon | AI Smart Ticketing",
  description: "Experience the future of events with AI-driven discovery and ticketing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-purple-900/40 to-black"></div>
          <div className="fixed top-0 left-0 w-full h-full -z-20 bg-black"></div>

          {/* Animated Orbs */}
          <div className="fixed top-20 left-20 w-72 h-72 bg-purple-600/30 rounded-full blur-[100px] animate-float"></div>
          <div className="fixed bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '2s' }}></div>

          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

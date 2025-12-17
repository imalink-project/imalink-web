import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { BildelisteProvider } from "@/lib/bildeliste-context";
import { PhotoStoreProvider } from "@/lib/photo-store";
import { AppLayout } from "@/components/app-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ImaLink - Photo Gallery",
  description: "ImaLink bildegalleri - søk, browse, og organiser dine bilder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <AuthProvider>
          <PhotoStoreProvider>
            <BildelisteProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </BildelisteProvider>
          </PhotoStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

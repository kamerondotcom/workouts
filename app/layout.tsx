import type { Metadata, Viewport } from "next";
import "./globals.css";
import ApolloProvider from "./components/ApolloProvider";
import QueryProvider from "./providers/QueryProvider";
import { UserProvider } from "./contexts/UserContext";
import { Analytics } from "@vercel/analytics/react";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import AppWrapper from "./components/AppWrapper";

export const metadata: Metadata = {
  title: "Workouts",
  description: "Track your workouts and fitness progress",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Hello

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          <ApolloProvider>
            <UserProvider>
              <AppWrapper>{children}</AppWrapper>
            </UserProvider>
          </ApolloProvider>
        </QueryProvider>
        <ServiceWorkerRegistration />
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next"
import "./globals.css"
import SessionProvider from "@/components/layout/SessionProvider"

export const metadata: Metadata = {
  title: "EventFlow",
  description: "Ticket & Venue Management",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}

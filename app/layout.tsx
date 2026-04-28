import type { Metadata } from "next"
import { Rubik } from "next/font/google"
import "./globals.css"
import SessionProvider from "@/components/layout/SessionProvider"

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
})

export const metadata: Metadata = {
  title: "EventFlow",
  description: "Ticket & Venue Management",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${rubik.variable} bg-gray-50 font-sans text-gray-900 antialiased`}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}

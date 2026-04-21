import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token
    const role     = (token?.role as string) ?? ""
    const pathname = req.nextUrl.pathname

    // Redirect to correct dashboard if role doesn't match the path
    if (pathname.startsWith("/organiser") && role !== "ORGANISER") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (pathname.startsWith("/attendee") && role !== "ATTENDEE") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (pathname.startsWith("/staff") && role !== "STAFF") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Only run middleware if user is logged in
      authorized: ({ token }) => !!token,
    },
  }
)

// Which paths the middleware protects
export const config = {
  matcher: ["/organiser/:path*", "/attendee/:path*", "/staff/:path*"],
}

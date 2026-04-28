import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ATTENDEE" | "ORGANISER" | "STAFF"
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: "ATTENDEE" | "ORGANISER" | "STAFF"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "ATTENDEE" | "ORGANISER" | "STAFF"
  }
}

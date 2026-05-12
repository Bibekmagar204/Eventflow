# Role-Based Authentication & Route Protection

## Tool
Claude by Anthropic — claude.ai

## Date
May 2026

## Prompt

You are an expert full-stack developer working on EventFlow, an existing
Next.js 14 TypeScript project using TypeScript, Prisma, PostgreSQL, and
Tailwind CSS. The Prisma schema has a User model with a role field of enum
type Role (ORGANISER, ATTENDEE, STAFF) and a hashedPassword field. Your task
is to implement the complete authentication system and route protection.

Implement the following exactly:

File 1 — app/api/auth/[...nextauth]/route.ts
NextAuth configuration that:
- Uses a credentials provider accepting email and password
- Looks up the user by email using Prisma — return null if not found
- Compares the password with hashedPassword using bcrypt — return null if
  mismatch
- Includes id, role, and name in the JWT token and session object
- Sets session strategy to "jwt"

File 2 — app/(auth)/register/page.tsx
A registration page with a form collecting name, email, password, and role
(dropdown: Attendee, Organiser, Staff). On submit, POST to
/api/auth/register, then redirect to the correct dashboard based on role.
Show inline validation errors.

File 3 — app/api/auth/register/route.ts
A POST route handler that:
- Validates all fields are present — return 400 with error message if not
- Checks no existing user has the same email — return 409 if duplicate
- Hashes the password with bcrypt (saltRounds: 12)
- Creates the User in the database
- Returns 201 with the new user's id, name, and role (never return the
  password)

File 4 — middleware.ts
Next.js middleware that:
- Reads the NextAuth JWT token from the request
- Redirects unauthenticated users trying to access any protected route to
  /login
- Redirects ORGANISER users away from /attendee and /staff routes
- Redirects ATTENDEE users away from /organiser and /staff routes
- Redirects STAFF users away from /organiser and /attendee routes
- Never blocks /login, /register, /api/auth, or public static assets

Requirements:
- Install bcryptjs and @types/bcryptjs — include the exact install command
- Extend the NextAuth Session and JWT types to include role and id using
  module augmentation in types/next-auth.d.ts
- Never store plain text passwords at any point
- Do not use any auth UI libraries — custom Tailwind forms only

## Purpose
To implement secure role-based authentication using NextAuth with bcrypt
password hashing and Next.js middleware route protection.

## Output Summary
Claude generated the NextAuth credentials configuration, the registration
API route with duplicate email checking and bcrypt hashing, the registration
page with role selection, and the middleware file enforcing role-based route
access across all protected routes.
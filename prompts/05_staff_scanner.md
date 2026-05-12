# Staff QR Code Scanner & Validation

## Tool
Claude by Anthropic — claude.ai

## Date
May 2026

## Prompt

You are an expert full-stack developer working on EventFlow, an existing
Next.js 14 TypeScript project. Authentication, Prisma, and the Ticket model
(with checkedIn boolean and qrCode string fields) are already implemented.
Your task is to build the complete staff ticket validation feature.

Implement the following exactly:

File 1 — app/api/scan/route.ts
A POST route handler that:
- Verifies the requesting user is authenticated and has role STAFF — return
  401 or 403 if not
- Reads qrCode from the request body — return 400 if missing
- Looks up the Ticket by qrCode joined with its Event and Seat
- Returns 404 with message "Ticket not found" if no match
- Returns 400 with message "Ticket already checked in" if checkedIn === true
- If valid, sets checkedIn = true using Prisma update and returns 200 with
  the full ticket details (event name, seat label, attendee name, date)
- All database operations must be wrapped in try/catch

File 2 — app/(staff)/scanner/page.tsx
A client component ("use client") that:
- Shows a camera viewfinder area using the html5-qrcode npm library to scan
  QR codes from the device camera
- Has a "Start Camera" / "Stop Camera" toggle button
- Below the camera, shows a manual input field labeled "Paste UUID from
  ticket..." and a "Validate Ticket" button for manual entry
- On successful scan or manual submit, calls POST /api/scan with the qrCode
  value
- On success: shows a green success banner with the attendee name, event
  name, and seat label
- On failure: shows a red error banner with the specific error message
  ("Ticket not found" or "Ticket already checked in")
- Banners auto-dismiss after 4 seconds
- After a result, the camera resets and is ready to scan the next ticket
  immediately

Requirements:
- Install html5-qrcode — include the exact install command
- The camera scanner must only initialize after the user clicks "Start
  Camera" — never auto-start
- Properly clean up and stop the camera stream when the component unmounts
  to prevent memory leaks
- Do not store any scanned QR code values in localStorage or any persistent
  client-side storage
- Handle camera permission denied errors gracefully with a user-friendly
  message

## Purpose
To build the staff-facing QR code scanner that validates attendee tickets
at the door and prevents duplicate check-ins.

## Output Summary
Claude generated the /api/scan validation route handler with duplicate
check-in prevention and the staff scanner page with both camera-based and
manual UUID entry validation, including auto-dismissing result banners and
proper camera cleanup on unmount.
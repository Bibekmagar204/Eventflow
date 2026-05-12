# EventFlow — Prompt Documentation

This folder contains all AI prompts used during the development of EventFlow.
Each prompt was written and submitted to Claude (Anthropic) via claude.ai and
represents a major feature or system component of the application.

## How prompts were used
Each prompt was written with specific technical constraints, file names, and
requirements to guide the AI toward generating production-ready code. Prompts
were refined iteratively based on the output received.

## Prompt files

| File | Topic |
|------|-------|
| 00_project_kickoff.md | Project initialization, folder structure & scaffold |
| 01_database_schema.md | Prisma schema design & database models |
| 02_stripe_checkout.md | Stripe checkout flow & webhook handler |
| 03_qr_code_tickets.md | QR code generation & attendee ticket display |
| 04_authentication.md | NextAuth setup, registration & route protection |
| 05_staff_scanner.md | Staff QR scanner & ticket validation API |
| 06_organiser_dashboard.md | Organiser dashboard, event management & refunds |

## Tool
- **AI Assistant:** Claude by Anthropic
- **Interface:** claude.ai
- **Model:** Claude Sonnet

## Project
EventFlow — Ticket & Venue Management System
CS 4398 · Software Engineering Project · May 2026
Bibek Magar, Nolan Martin
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { registerSchema } from "@/lib/validations"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate the request body
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input" },
        { status: 400 }
      )
    }

    const { email, password, name, role } = parsed.data

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 409 }
      )
    }

    // Hash the password before saving
    const hashed = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { email, password: hashed, name, role },
    })

    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (err) {
    console.error("Register error:", err)
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    )
  }
}

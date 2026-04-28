import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { EVENT_IMAGES_BUCKET, supabaseAdmin } from "@/lib/supabaseAdmin"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

type UploadedFileLike = {
  name: string
  type: string
  size: number
  arrayBuffer: () => Promise<ArrayBuffer>
}

function extensionFromType(mimeType: string) {
  if (mimeType === "image/png") return "png"
  if (mimeType === "image/webp") return "webp"
  return "jpg"
}

function isUploadedFile(value: FormDataEntryValue | null): value is UploadedFileLike {
  if (!value || typeof value === "string") return false
  return (
    typeof value.name === "string" &&
    typeof value.type === "string" &&
    typeof value.size === "number" &&
    typeof value.arrayBuffer === "function"
  )
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ORGANISER") {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!isUploadedFile(file)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPG, PNG, or WEBP." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const extension = extensionFromType(file.type)
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-")
    const key = `${session.user.id}/${Date.now()}-${randomUUID()}-${safeName || `upload.${extension}`}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(EVENT_IMAGES_BUCKET)
      .upload(key, fileBuffer, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(key)

    return NextResponse.json({ data: { imageUrl: data.publicUrl } }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/uploads/event-image]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

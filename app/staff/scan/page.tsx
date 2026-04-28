// app/staff/scan/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { formatDate } from "@/lib/utils"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

type ScanStatus = "idle" | "scanning" | "loading" | "success" | "error" | "duplicate"

interface ValidationResult {
  valid: boolean
  reason?: string
  checkedInAt?: string
  ticket?: {
    id?: string
    event: {
      title: string
      date: string
      venue: string
    }
    seat: { label: string } | null
  }
}

export default function StaffScanPage() {
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<ScanStatus>("idle")
  const [manualCode, setManualCode] = useState("")
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // ── Camera lifecycle ────────────────────────────────────
  async function startCamera() {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // rear camera on mobile
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      setStatus("scanning")
      scanFrame()
    } catch (err) {
      setCameraError(
        "Camera access denied. Please allow camera access or use manual input below."
      )
    }
  }

  function stopCamera() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setStatus("idle")
  }

  // ── QR frame scanning loop ──────────────────────────────
  function scanFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    })

    if (code) {
      // QR code detected — stop scanning and validate
      stopCamera()
      validateCode(code.data)
    } else {
      animFrameRef.current = requestAnimationFrame(scanFrame)
    }
  }

  // ── Cleanup on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // ── Validate a QR code string ───────────────────────────
  async function validateCode(code: string) {
    if (!code.trim()) return
    setStatus("loading")
    setResult(null)

    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: code.trim() }),
      })

      const json = await res.json()

      if (res.ok && json.valid) {
        setResult(json)
        setStatus("success")
      } else if (json.reason === "Ticket already used") {
        setResult(json)
        setStatus("duplicate")
      } else {
        setResult(json)
        setStatus("error")
      }
    } catch (err) {
      setResult({ valid: false, reason: "Network error. Please try again." })
      setStatus("error")
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    validateCode(manualCode)
  }

  function resetScanner() {
    setStatus("idle")
    setResult(null)
    setManualCode("")
    setCameraError(null)
  }

  // ── Result screen ───────────────────────────────────────
  if (status === "success" || status === "duplicate" || status === "error") {
    const isSuccess = status === "success"
    const isDuplicate = status === "duplicate"

    return (
      <main className="flex min-h-screen flex-col overflow-hidden bg-[#1f1f1f]">
        <Navbar variant="transparent" />
        <div className="relative flex-1 px-4 py-10 pt-24">
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: `
                radial-gradient(circle at 50% -20%, rgba(111, 76, 255, 0.45) 0%, rgba(24, 18, 42, 0.95) 45%, #05070f 100%),
                radial-gradient(2px 2px at 12% 18%, rgba(243, 240, 232, 0.55), transparent 65%),
                radial-gradient(2px 2px at 78% 22%, rgba(243, 240, 232, 0.45), transparent 65%),
                radial-gradient(1.5px 1.5px at 22% 75%, rgba(243, 240, 232, 0.45), transparent 65%)
              `,
            }}
          />
          <div className="mx-auto w-full max-w-sm space-y-4">

            {/* Result card */}
            <div
              className={`rounded-2xl border p-8 text-center shadow-sm backdrop-blur ${
                isSuccess
                  ? "border-emerald-300/40 bg-emerald-500/10"
                  : isDuplicate
                    ? "border-amber-300/40 bg-amber-500/10"
                    : "border-red-300/40 bg-red-500/10"
              }`}
            >
              {/* Icon */}
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  isSuccess
                    ? "bg-emerald-200 text-emerald-900"
                    : isDuplicate
                      ? "bg-amber-200 text-amber-900"
                      : "bg-red-200 text-red-900"
                }`}
              >
                <span className="text-3xl">{isSuccess ? "✓" : isDuplicate ? "⚠" : "✕"}</span>
              </div>

              {/* Status text */}
              <h2
                className={`mb-2 text-2xl font-bold ${
                  isSuccess ? "text-emerald-200" : isDuplicate ? "text-amber-200" : "text-red-200"
                }`}
              >
                {isSuccess ? "Valid Ticket" : isDuplicate ? "Already Used" : "Invalid Ticket"}
              </h2>

              {/* Reason for error/duplicate */}
              {!isSuccess && result?.reason && (
                <p className={`mb-4 text-sm ${isDuplicate ? "text-amber-200" : "text-red-200"}`}>
                  {result.reason}
                </p>
              )}

              {/* Ticket details */}
              {result?.ticket && (
                <div className="mt-4 space-y-2 rounded-xl border border-white/15 bg-[rgba(20,18,28,0.62)] p-4 text-left text-sm text-[var(--text-light)]">
                  <div className="flex justify-between">
                    <span className="text-[color:var(--text-muted-light)]">Event</span>
                    <span className="max-w-[60%] text-right font-medium">{result.ticket.event.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:var(--text-muted-light)]">Date</span>
                    <span>{formatDate(result.ticket.event.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:var(--text-muted-light)]">Venue</span>
                    <span>{result.ticket.event.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[color:var(--text-muted-light)]">Seat</span>
                    <span>{result.ticket.seat?.label ?? "GA"}</span>
                  </div>
                  {result.checkedInAt && (
                    <div className="flex justify-between">
                      <span className="text-[color:var(--text-muted-light)]">
                        {isSuccess ? "Checked in" : "First used"}
                      </span>
                      <span>{formatDate(result.checkedInAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scan another button */}
            <button
              onClick={resetScanner}
              className="btn-liquid w-full rounded-xl border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] py-3 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
            >
              <span className="btn-liquid-label">Scan Another Ticket</span>
            </button>
          </div>
        </div>
        <Footer tone="dark" />
      </main>
    )
  }

  // ── Main scanner UI ─────────────────────────────────────
  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-[#1f1f1f]">
      <Navbar variant="transparent" />
      <div className="relative flex-1 px-4 py-10 pt-24">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% -20%, rgba(111, 76, 255, 0.45) 0%, rgba(24, 18, 42, 0.95) 45%, #05070f 100%),
              radial-gradient(2px 2px at 12% 18%, rgba(243, 240, 232, 0.55), transparent 65%),
              radial-gradient(2px 2px at 78% 22%, rgba(243, 240, 232, 0.45), transparent 65%),
              radial-gradient(1.5px 1.5px at 22% 75%, rgba(243, 240, 232, 0.45), transparent 65%)
            `,
          }}
        />
        <div className="mx-auto max-w-sm space-y-6">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--text-hero)]">Ticket Scanner</h1>
            <p className="mt-1 text-sm text-[color:var(--text-muted-light)]">
              Scan a QR code or enter the code manually
            </p>
          </div>

          {/* Camera viewfinder */}
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/15 bg-black shadow-sm">
            <video
              ref={videoRef}
              className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`}
              playsInline
              muted
            />

            {/* Hidden canvas for jsQR processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay when camera is off */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <span className="text-6xl">📷</span>
                <p className="px-6 text-center text-sm text-[color:var(--text-muted-light)]">
                  {status === "loading" ? "Validating ticket..." : "Camera is off"}
                </p>
              </div>
            )}

            {/* Scanning overlay — crosshair */}
            {cameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-xl border-2 border-[var(--text-hero)]/80" />
              </div>
            )}
          </div>

          {/* Camera error */}
          {cameraError && (
            <div className="rounded-xl border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-red-200">
              {cameraError}
            </div>
          )}

          {/* Camera toggle button */}
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            disabled={status === "loading"}
            className={`w-full rounded-xl border py-3 text-sm font-semibold transition disabled:opacity-50 ${
              cameraActive
                ? "border-red-400/50 bg-red-500/15 text-red-300 hover:bg-red-500/25"
                : "btn-liquid border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] text-stone-900 hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)]"
            }`}
          >
            <span className={cameraActive ? "" : "btn-liquid-label"}>
              {cameraActive ? "Stop Camera" : "Start Camera"}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-white/20" />
            <span className="text-xs uppercase tracking-wide text-[color:var(--text-muted-light)]">
              or enter manually
            </span>
            <div className="flex-1 border-t border-white/20" />
          </div>

          {/* Manual input */}
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Paste UUID from ticket..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-mono text-sm text-[var(--text-light)] placeholder:text-[color:var(--text-muted-light)] outline-none transition focus:border-[var(--text-hero)]"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || status === "loading"}
              className="btn-liquid w-full rounded-xl border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] py-3 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)] disabled:opacity-40"
            >
              <span className="btn-liquid-label">{status === "loading" ? "Validating..." : "Validate Ticket"}</span>
            </button>
          </form>
        </div>
      </div>
      <Footer tone="dark" />
    </main>
  )
}
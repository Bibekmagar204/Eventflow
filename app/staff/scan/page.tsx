// app/staff/scan/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { formatDate } from "@/lib/utils"

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full space-y-4">

          {/* Result card */}
          <div
            className={`rounded-2xl border shadow-sm p-8 text-center ${
              isSuccess
                ? "bg-green-50 border-green-200"
                : isDuplicate
                ? "bg-amber-50 border-amber-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isSuccess
                  ? "bg-green-100"
                  : isDuplicate
                  ? "bg-amber-100"
                  : "bg-red-100"
              }`}
            >
              <span className="text-3xl">
                {isSuccess ? "✓" : isDuplicate ? "⚠" : "✕"}
              </span>
            </div>

            {/* Status text */}
            <h2
              className={`text-2xl font-bold mb-2 ${
                isSuccess
                  ? "text-green-700"
                  : isDuplicate
                  ? "text-amber-700"
                  : "text-red-700"
              }`}
            >
              {isSuccess
                ? "Valid Ticket"
                : isDuplicate
                ? "Already Used"
                : "Invalid Ticket"}
            </h2>

            {/* Reason for error/duplicate */}
            {!isSuccess && result?.reason && (
              <p
                className={`text-sm mb-4 ${
                  isDuplicate ? "text-amber-600" : "text-red-600"
                }`}
              >
                {result.reason}
              </p>
            )}

            {/* Ticket details */}
            {result?.ticket && (
              <div
                className={`rounded-xl p-4 text-left space-y-2 text-sm mt-4 ${
                  isSuccess
                    ? "bg-green-100"
                    : isDuplicate
                    ? "bg-amber-100"
                    : "bg-red-100"
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-gray-500">Event</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">
                    {result.ticket.event.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-700">
                    {formatDate(result.ticket.event.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Venue</span>
                  <span className="text-gray-700">
                    {result.ticket.event.venue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Seat</span>
                  <span className="text-gray-700">
                    {result.ticket.seat?.label ?? "GA"}
                  </span>
                </div>
                {result.checkedInAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      {isSuccess ? "Checked in" : "First used"}
                    </span>
                    <span className="text-gray-700">
                      {formatDate(result.checkedInAt)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scan another button */}
          <button
            onClick={resetScanner}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium py-3 rounded-xl transition-colors"
          >
            Scan Another Ticket
          </button>
        </div>
      </div>
    )
  }

  // ── Main scanner UI ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4">
      <div className="max-w-sm mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Ticket Scanner</h1>
          <p className="text-gray-400 text-sm mt-1">
            Scan a QR code or enter the code manually
          </p>
        </div>

        {/* Camera viewfinder */}
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-square">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${
              cameraActive ? "block" : "hidden"
            }`}
            playsInline
            muted
          />

          {/* Hidden canvas for jsQR processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay when camera is off */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <span className="text-6xl">📷</span>
              <p className="text-gray-400 text-sm text-center px-6">
                {status === "loading"
                  ? "Validating ticket..."
                  : "Camera is off"}
              </p>
            </div>
          )}

          {/* Scanning overlay — crosshair */}
          {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-white rounded-xl opacity-70" />
            </div>
          )}
        </div>

        {/* Camera error */}
        {cameraError && (
          <div className="rounded-xl bg-red-900 border border-red-700 px-4 py-3 text-sm text-red-300">
            {cameraError}
          </div>
        )}

        {/* Camera toggle button */}
        <button
          onClick={cameraActive ? stopCamera : startCamera}
          disabled={status === "loading"}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
            cameraActive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {cameraActive ? "Stop Camera" : "Start Camera"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-700" />
          <span className="text-gray-500 text-xs uppercase tracking-wide">
            or enter manually
          </span>
          <div className="flex-1 border-t border-gray-700" />
        </div>

        {/* Manual input */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Paste UUID from ticket..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || status === "loading"}
            className="w-full bg-gray-100 hover:bg-white disabled:opacity-40 text-gray-900 text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            {status === "loading" ? "Validating..." : "Validate Ticket"}
          </button>
        </form>

      </div>
    </div>
  )
}
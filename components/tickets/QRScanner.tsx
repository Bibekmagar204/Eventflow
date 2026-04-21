// Camera-based QR scanner for Staff — Module 4
"use client"

interface Props {
  onScan: (qrCode: string) => void
}

export default function QRScanner({ onScan }: Props) {
  // TODO: Module 4 — integrate jsQR or html5-qrcode library
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed bg-gray-50">
      <p className="text-sm text-gray-400">Camera / QR scanner — Module 4</p>
    </div>
  )
}

// lib/qr.ts
import QRCode from "qrcode"

// Generates a base64 PNG data URL from any string
export async function generateQR(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300,
  })
}
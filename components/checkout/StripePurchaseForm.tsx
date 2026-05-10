"use client"

import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useMemo, useState } from "react"

interface StripePurchaseFormProps {
  eventId: string
  amount: number
  onSuccess: (ticketId: string) => void
  onError: (message: string) => void
}

const cardStyle = {
  style: {
    base: {
      color: "#f3f0e8",
      fontSize: "16px",
      "::placeholder": {
        color: "rgba(243, 240, 232, 0.6)",
      },
    },
    invalid: {
      color: "#fca5a5",
    },
  },
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function StripePurchaseForm({
  eventId,
  amount,
  onSuccess,
  onError,
}: StripePurchaseFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const submitLabel = useMemo(() => {
    if (isProcessing) return "Processing..."
    if (amount === 0) return "Claim Free Ticket"
    return "Confirm Purchase"
  }, [amount, isProcessing])

  async function resolveTicketId(paymentIntentId: string) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await fetch("/api/checkout/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? "Could not finalize purchase")
      }
      if (json.data.ticketId) return json.data.ticketId as string
      await sleep(1000)
    }
    throw new Error("Payment succeeded, but ticket confirmation is still processing. Please check My Tickets.")
  }

  async function handleSubmit() {
    setIsProcessing(true)
    onError("")

    try {
      const intentRes = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      })
      const intentJson = await intentRes.json()
      if (!intentRes.ok) {
        throw new Error(intentJson.error ?? "Unable to start checkout")
      }

      if (!intentJson.data.requiresPayment) {
        const ticketId = intentJson.data.ticketId
        if (!ticketId) throw new Error("Ticket creation failed")
        onSuccess(ticketId)
        return
      }

      if (!stripe || !elements) {
        throw new Error("Stripe is still loading. Please try again.")
      }

      const card = elements.getElement(CardElement)
      if (!card) {
        throw new Error("Card details are missing.")
      }

      const result = await stripe.confirmCardPayment(intentJson.data.clientSecret, {
        payment_method: {
          card,
        },
      })

      if (result.error) {
        throw new Error(result.error.message ?? "Payment was not completed")
      }

      const paymentIntentId = result.paymentIntent?.id ?? intentJson.data.paymentIntentId
      if (!paymentIntentId) {
        throw new Error("Payment completed but no confirmation ID was returned.")
      }

      const ticketId = await resolveTicketId(paymentIntentId)
      onSuccess(ticketId)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Purchase failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {amount > 0 && (
        <div className="rounded-lg border border-white/20 bg-[#2a2a2a] px-3 py-2">
          <CardElement options={cardStyle} />
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={isProcessing}
        className="btn-liquid w-full rounded-xl border border-[rgba(246,233,207,0.55)] bg-[var(--text-hero)] py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-stone-600 hover:bg-stone-700 hover:text-[var(--text-light)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="btn-liquid-label">{submitLabel}</span>
      </button>
    </div>
  )
}

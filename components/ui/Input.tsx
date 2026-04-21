// Reusable input field
import { InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={cn(
          "rounded-lg border px-3 py-2 text-sm outline-none",
          "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
          error && "border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Reusable button with variants
import { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger"
}

export default function Button({ variant = "primary", className, children, ...props }: Props) {
  return (
    <button
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        variant === "primary" && "bg-indigo-600 text-white hover:bg-indigo-700",
        variant === "secondary" && "border bg-white text-gray-700 hover:bg-gray-50",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

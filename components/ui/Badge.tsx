// Status badge — used in order status and ticket states
import { cn } from "@/lib/utils"

type Color = "green" | "yellow" | "red" | "gray" | "blue"

interface Props {
  label: string
  color?: Color
}

const colors: Record<Color, string> = {
  green:  "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red:    "bg-red-100 text-red-800",
  gray:   "bg-gray-100 text-gray-600",
  blue:   "bg-blue-100 text-blue-800",
}

export default function Badge({ label, color = "gray" }: Props) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", colors[color])}>
      {label}
    </span>
  )
}

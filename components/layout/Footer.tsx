interface FooterProps {
  tone?: "light" | "dark"
}

export default function Footer({ tone = "light" }: FooterProps) {
  const dark = tone === "dark"

  return (
    <footer
      className={`border-t ${
        dark ? "border-white/10 bg-gray-950 text-white/70" : "border-gray-200 bg-white text-gray-500"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ${
              dark ? "bg-white/5 ring-white/15" : "bg-indigo-50 ring-indigo-100"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${dark ? "bg-indigo-300" : "bg-indigo-600"}`} />
          </span>
          <div>
            <p className={`text-sm font-semibold ${dark ? "text-white" : "text-gray-900"}`}>
              EventFlow
            </p>
            <p className="text-xs">© {new Date().getFullYear()} EventFlow. All rights reserved.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#"
            aria-label="Twitter"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-colors ${
              dark
                ? "ring-white/15 hover:bg-white/10 hover:text-white"
                : "ring-gray-200 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
              <path d="M18.244 2H21l-6.52 7.45L22 22h-6.84l-4.78-6.26L4.8 22H2.04l6.96-7.95L2 2h7l4.32 5.71L18.244 2Zm-2.4 18h1.8L7.24 4h-1.9l10.504 16Z" />
            </svg>
          </a>
          <a
            href="#"
            aria-label="Instagram"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-colors ${
              dark
                ? "ring-white/15 hover:bg-white/10 hover:text-white"
                : "ring-gray-200 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="h-4 w-4">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}

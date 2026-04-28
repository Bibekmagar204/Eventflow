import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export default function OrganiserDashboardLoading() {
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

        <div className="mx-auto max-w-5xl animate-pulse space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-40 rounded bg-white/10" />
              <div className="mt-2 h-4 w-56 rounded bg-white/10" />
            </div>
            <div className="h-10 w-28 rounded bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.62)] p-5">
                <div className="mb-2 h-3 w-20 rounded bg-white/10" />
                <div className="h-8 w-24 rounded bg-white/10" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.62)]">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="h-5 w-28 rounded bg-white/10" />
            </div>
            <div className="space-y-0 divide-y divide-white/10">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="px-6 py-5">
                  <div className="mb-2 h-5 w-2/5 rounded bg-white/10" />
                  <div className="mb-3 h-4 w-1/3 rounded bg-white/10" />
                  <div className="mb-3 h-4 w-3/4 rounded bg-white/10" />
                  <div className="h-2 w-full rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer tone="dark" />
    </main>
  )
}

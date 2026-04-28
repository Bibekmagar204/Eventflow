import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AttendeeEventsLoading() {
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
              radial-gradient(2px 2px at 78% 22%, rgba(243, 240, 232, 0.45), transparent 65%)
            `,
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-8 rounded-3xl border border-white/15 bg-[rgba(20,18,28,0.58)] p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="h-5 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="mt-4 h-10 w-64 animate-pulse rounded-lg bg-white/10" />
            <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-4 w-3/4 max-w-xl animate-pulse rounded bg-white/10" />
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-[#2a2a2a] p-3 shadow-sm">
            <div className="mb-2 h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-[#343434]" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-white/15 bg-[rgba(20,18,28,0.58)] backdrop-blur">
                <div className="aspect-[16/10] animate-pulse bg-white/10" />
                <div className="p-5">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="mt-5 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer tone="dark" />
    </main>
  );
}

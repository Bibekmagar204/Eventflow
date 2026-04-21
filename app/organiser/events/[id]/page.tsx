// Edit event page — completed in Module 2: Events
export default function EditEventPage({ params }: { params: { id: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Edit Event</h1>
      <p className="text-gray-400">Event ID: {params.id}</p>
      {/* TODO: Module 2 — EditEventForm */}
    </main>
  )
}

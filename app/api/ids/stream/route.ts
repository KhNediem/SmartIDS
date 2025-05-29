import type { NextRequest } from "next/server"
import { idsDataStore } from "@/lib/ids-bridge"

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const initialData = {
        connections: idsDataStore.getConnections(10),
        metrics: idsDataStore.getMetrics(),
        stats: idsDataStore.getStats(),
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`))

      // Subscribe to updates
      const unsubscribe = idsDataStore.subscribe((data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          console.error("Error sending SSE data:", error)
        }
      })

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        unsubscribe()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

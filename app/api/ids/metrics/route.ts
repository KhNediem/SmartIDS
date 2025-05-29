import { type NextRequest, NextResponse } from "next/server"
import { idsDataStore } from "@/lib/ids-bridge"

export async function GET() {
  try {
    const metrics = idsDataStore.getMetrics()
    const stats = idsDataStore.getStats()

    return NextResponse.json({
      metrics,
      stats,
    })
  } catch (error) {
    console.error("Error fetching metrics:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (data.type === "stats") {
      idsDataStore.updateStats(data.data)
    } else if (data.type === "metrics") {
      idsDataStore.updateMetrics(data.data)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating metrics:", error)
    return NextResponse.json({ error: "Failed to update metrics" }, { status: 500 })
  }
}

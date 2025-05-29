"use client"

import { useState, useEffect, useCallback } from "react"
import type { IDSConnection, IDSMetrics, IDSStats } from "@/lib/ids-bridge"

interface UseIDSDataReturn {
  connections: IDSConnection[]
  metrics: IDSMetrics
  stats: IDSStats
  isConnected: boolean
  error: string | null
  refreshData: () => void
}

export function useIDSData(): UseIDSDataReturn {
  const [connections, setConnections] = useState<IDSConnection[]>([])
  const [metrics, setMetrics] = useState<IDSMetrics>({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    aucRoc: 0,
    throughput: 0,
    latency: 0,
    attacksDetected: 0,
    normalTraffic: 0,
    falsePositives: 0,
  })
  const [stats, setStats] = useState<IDSStats>({
    totalPackets: 0,
    activeConnections: 0,
    completedConnections: 0,
    errors: 0,
    startTime: new Date().toISOString(),
    modelName: "none",
  })
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    try {
      // Fetch connections
      const connectionsResponse = await fetch("/api/ids/connections")
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json()
        setConnections(connectionsData.connections || [])
      }

      // Fetch metrics and stats
      const metricsResponse = await fetch("/api/ids/metrics")
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData.metrics || metrics)
        setStats(metricsData.stats || stats)
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    }
  }, [])

  useEffect(() => {
    // Initial data fetch
    refreshData()

    // Set up Server-Sent Events for real-time updates
    const eventSource = new EventSource("/api/ids/stream")

    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "new_connection") {
          setConnections((prev) => [data.data, ...prev.slice(0, 49)]) // Keep last 50
        } else if (data.type === "metrics_update") {
          setMetrics(data.data)
        } else if (data.type === "stats_update") {
          setStats(data.data)
        } else if (data.connections) {
          // Initial data
          setConnections(data.connections)
          setMetrics(data.metrics)
          setStats(data.stats)
        }
      } catch (err) {
        console.error("Error parsing SSE data:", err)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      setError("Connection to IDS stream lost")
    }

    return () => {
      eventSource.close()
    }
  }, [refreshData])

  return {
    connections,
    metrics,
    stats,
    isConnected,
    error,
    refreshData,
  }
}

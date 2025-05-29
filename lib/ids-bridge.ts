// Bridge between Python IDS and Next.js dashboard
export interface IDSConnection {
  id: string
  timestamp: string
  src_ip: string
  dst_ip: string
  src_port: number
  dst_port: number
  protocol: string
  service: string
  duration: number
  src_bytes: number
  dst_bytes: number
  classification: "normal" | "anomaly"
  confidence: number
  flag: string
  features: {
    [key: string]: number | string
  }
}

export interface IDSMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  aucRoc: number
  throughput: number
  latency: number
  attacksDetected: number
  normalTraffic: number
  falsePositives: number
}

export interface IDSStats {
  totalPackets: number
  activeConnections: number
  completedConnections: number
  errors: number
  startTime: string
  modelName: string
}

// In-memory storage for demo (in production, use a database)
class IDSDataStore {
  private connections: IDSConnection[] = []
  private metrics: IDSMetrics = {
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
  }
  private stats: IDSStats = {
    totalPackets: 0,
    activeConnections: 0,
    completedConnections: 0,
    errors: 0,
    startTime: new Date().toISOString(),
    modelName: "none",
  }
  private subscribers: ((data: any) => void)[] = []

  addConnection(connection: IDSConnection) {
    this.connections.unshift(connection) // Add to beginning
    if (this.connections.length > 1000) {
      this.connections = this.connections.slice(0, 1000) // Keep last 1000
    }

    // Update metrics
    if (connection.classification === "anomaly") {
      this.metrics.attacksDetected++
    } else {
      this.metrics.normalTraffic++
    }

    this.stats.completedConnections = this.connections.length

    // Notify subscribers
    this.notifySubscribers({
      type: "new_connection",
      data: connection,
    })
  }

  updateStats(newStats: Partial<IDSStats>) {
    this.stats = { ...this.stats, ...newStats }
    this.notifySubscribers({
      type: "stats_update",
      data: this.stats,
    })
  }

  updateMetrics(newMetrics: Partial<IDSMetrics>) {
    this.metrics = { ...this.metrics, ...newMetrics }
    this.notifySubscribers({
      type: "metrics_update",
      data: this.metrics,
    })
  }

  getConnections(limit = 50): IDSConnection[] {
    return this.connections.slice(0, limit)
  }

  getMetrics(): IDSMetrics {
    return { ...this.metrics }
  }

  getStats(): IDSStats {
    return { ...this.stats }
  }

  subscribe(callback: (data: any) => void) {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback)
    }
  }

  private notifySubscribers(data: any) {
    this.subscribers.forEach((callback) => {
      try {
        callback(data)
      } catch (error) {
        console.error("Error notifying subscriber:", error)
      }
    })
  }

  // Calculate real-time metrics
  calculateMetrics() {
    const recentConnections = this.connections.slice(0, 100) // Last 100 connections
    if (recentConnections.length === 0) return

    const anomalies = recentConnections.filter((c) => c.classification === "anomaly")
    const normal = recentConnections.filter((c) => c.classification === "normal")

    // Simple accuracy calculation (in real system, you'd need ground truth)
    const accuracy = (normal.length / recentConnections.length) * 100

    // Update metrics
    this.updateMetrics({
      accuracy: Math.round(accuracy * 100) / 100,
      precision: Math.round((normal.length / (normal.length + anomalies.length * 0.1)) * 100) / 100,
      recall: Math.round((anomalies.length / (anomalies.length + normal.length * 0.05)) * 100) / 100,
      throughput: recentConnections.length,
      latency: Math.round(Math.random() * 20 + 5), // Mock latency
    })
  }
}

export const idsDataStore = new IDSDataStore()

// Auto-calculate metrics every 10 seconds
if (typeof window === "undefined") {
  // Server-side only
  setInterval(() => {
    idsDataStore.calculateMetrics()
  }, 10000)
}

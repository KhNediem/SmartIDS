// Enhanced bridge between Python IDS and Next.js dashboard
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
  traffic_source: "human" | "bot" | "ai" | "unknown"
  traffic_source_confidence: number
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
  humanTraffic: number
  botTraffic: number
  aiTraffic: number
}

export interface IDSStats {
  totalPackets: number
  activeConnections: number
  completedConnections: number
  errors: number
  startTime: string
  modelName: string
  modelType: "neural-network" | "xgboost" | "unknown"
  modelAccuracy: number
}

export interface ModelSwitchRequest {
  modelType: "neural-network" | "xgboost"
  timestamp: string
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
    humanTraffic: 0,
    botTraffic: 0,
    aiTraffic: 0,
  }
  private stats: IDSStats = {
    totalPackets: 0,
    activeConnections: 0,
    completedConnections: 0,
    errors: 0,
    startTime: new Date().toISOString(),
    modelName: "none",
    modelType: "unknown",
    modelAccuracy: 0,
  }
  private subscribers: ((data: any) => void)[] = []
  private currentModelRequest: ModelSwitchRequest | null = null

  addConnection(connection: IDSConnection) {
    this.connections.unshift(connection) // Add to beginning
    if (this.connections.length > 1000) {
      this.connections = this.connections.slice(0, 1000) // Keep last 1000
    }

    // Update metrics with safe number handling
    if (connection.classification === "anomaly") {
      this.metrics.attacksDetected = (this.metrics.attacksDetected || 0) + 1
    } else {
      this.metrics.normalTraffic = (this.metrics.normalTraffic || 0) + 1
    }

    // Update traffic source metrics with safe number handling
    switch (connection.traffic_source) {
      case "human":
        this.metrics.humanTraffic = (this.metrics.humanTraffic || 0) + 1
        break
      case "bot":
        this.metrics.botTraffic = (this.metrics.botTraffic || 0) + 1
        break
      case "ai":
        this.metrics.aiTraffic = (this.metrics.aiTraffic || 0) + 1
        break
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

  // Add a helper method to ensure safe numbers
  private ensureSafeNumber(value: any): number {
    if (typeof value !== "number" || isNaN(value) || !isFinite(value)) {
      return 0
    }
    return value
  }

  // Update the updateMetrics method
  updateMetrics(newMetrics: Partial<IDSMetrics>) {
    // Ensure all metrics are safe numbers
    const safeMetrics = Object.keys(newMetrics).reduce(
      (acc, key) => {
        acc[key as keyof IDSMetrics] = this.ensureSafeNumber(newMetrics[key as keyof IDSMetrics])
        return acc
      },
      {} as Partial<IDSMetrics>,
    )

    this.metrics = { ...this.metrics, ...safeMetrics }
    this.notifySubscribers({
      type: "metrics_update",
      data: this.metrics,
    })
  }

  requestModelSwitch(modelType: "neural-network" | "xgboost") {
    this.currentModelRequest = {
      modelType,
      timestamp: new Date().toISOString(),
    }

    this.notifySubscribers({
      type: "model_switch_request",
      data: this.currentModelRequest,
    })

    console.log(`Model switch requested: ${modelType}`)
  }

  getModelSwitchRequest(): ModelSwitchRequest | null {
    return this.currentModelRequest
  }

  clearModelSwitchRequest() {
    this.currentModelRequest = null
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

    // Calculate average confidence as accuracy proxy
    const avgConfidence = recentConnections.reduce((sum, conn) => sum + conn.confidence, 0) / recentConnections.length

    // Update metrics
    this.updateMetrics({
      accuracy: Math.round(avgConfidence * 100) / 100,
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

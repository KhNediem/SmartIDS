import { type NextRequest, NextResponse } from "next/server"
import { idsDataStore, type IDSConnection } from "@/lib/ids-bridge"

export async function GET() {
  try {
    const connections = idsDataStore.getConnections()
    return NextResponse.json({ connections })
  } catch (error) {
    console.error("Error fetching connections:", error)
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Convert Python IDS data to our format
    const connection: IDSConnection = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      src_ip: data.src_ip || "0.0.0.0",
      dst_ip: data.dst_ip || "0.0.0.0",
      src_port: data.src_port || 0,
      dst_port: data.dst_port || 0,
      protocol: data.protocol_type || data.protocol || "tcp",
      service: data.service || "unknown",
      duration: data.duration || 0,
      src_bytes: data.src_bytes || 0,
      dst_bytes: data.dst_bytes || 0,
      classification: data.class === "anomaly" ? "anomaly" : "normal",
      confidence: data.confidence || 0.95,
      flag: data.flag || "SF",
      features: {
        duration: data.duration || 0,
        protocol_type: data.protocol_type || "tcp",
        service: data.service || "unknown",
        flag: data.flag || "SF",
        src_bytes: data.src_bytes || 0,
        dst_bytes: data.dst_bytes || 0,
        count: data.count || 0,
        srv_count: data.srv_count || 0,
        serror_rate: data.serror_rate || 0,
        srv_serror_rate: data.srv_serror_rate || 0,
        rerror_rate: data.rerror_rate || 0,
        srv_rerror_rate: data.srv_rerror_rate || 0,
        same_srv_rate: data.same_srv_rate || 0,
        diff_srv_rate: data.diff_srv_rate || 0,
        srv_diff_host_rate: data.srv_diff_host_rate || 0,
        dst_host_count: data.dst_host_count || 0,
        dst_host_srv_count: data.dst_host_srv_count || 0,
        dst_host_same_srv_rate: data.dst_host_same_srv_rate || 0,
        dst_host_diff_srv_rate: data.dst_host_diff_srv_rate || 0,
        dst_host_same_src_port_rate: data.dst_host_same_src_port_rate || 0,
        dst_host_srv_diff_host_rate: data.dst_host_srv_diff_host_rate || 0,
        dst_host_serror_rate: data.dst_host_serror_rate || 0,
        dst_host_srv_serror_rate: data.dst_host_srv_serror_rate || 0,
        dst_host_rerror_rate: data.dst_host_rerror_rate || 0,
        dst_host_srv_rerror_rate: data.dst_host_srv_rerror_rate || 0,
      },
    }

    idsDataStore.addConnection(connection)

    return NextResponse.json({ success: true, id: connection.id })
  } catch (error) {
    console.error("Error adding connection:", error)
    return NextResponse.json({ error: "Failed to add connection" }, { status: 500 })
  }
}

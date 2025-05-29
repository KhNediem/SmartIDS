"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Activity, Clock, Wifi, WifiOff } from "lucide-react"
import { useIDSData } from "@/hooks/use-ids-data"

export function LiveDetection() {
  const { connections, isConnected, error } = useIDSData()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Traffic Detection
          <div className="ml-auto flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="gap-1">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Real-time neural network classification results
          {error && <span className="text-red-500 ml-2">({error})</span>}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {connections.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse" />
              <p>Waiting for network traffic...</p>
              <p className="text-xs mt-1">Start the Python IDS collector to see live data</p>
            </div>
          ) : (
            connections.map((connection) => (
              <div
                key={connection.id}
                className={`p-3 rounded-lg border ${
                  connection.classification === "anomaly" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {connection.classification === "anomaly" ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <Badge
                      variant={connection.classification === "anomaly" ? "destructive" : "secondary"}
                      className="capitalize"
                    >
                      {connection.classification}
                    </Badge>
                    <span className="text-sm font-medium">{(connection.confidence * 100).toFixed(1)}% confidence</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {new Date(connection.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Connection:</span>
                    <span className="ml-1 font-mono">
                      {connection.src_ip}:{connection.src_port} → {connection.dst_ip}:{connection.dst_port}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Protocol:</span>
                    <span className="ml-1 font-mono uppercase">{connection.protocol}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Service:</span>
                    <span className="ml-1 font-mono">{connection.service}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Duration:</span>
                    <span className="ml-1 font-mono">{connection.duration.toFixed(2)}s</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Bytes:</span>
                    <span className="ml-1 font-mono">
                      {connection.src_bytes}↑ {connection.dst_bytes}↓
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Shield } from "lucide-react"

// Mock data - replace with your real threat detection data
const data = [
  { category: "Normal Traffic", normal: 120, attack: 10 },
  { category: "DoS Attacks", normal: 5, attack: 50 },
  { category: "Probe Attacks", normal: 8, attack: 30 },
  { category: "R2L Attacks", normal: 3, attack: 15 },
  { category: "U2R Attacks", normal: 2, attack: 5 },
  { category: "Unknown Attacks", normal: 10, attack: 25 },
]

export function ThreatDetectionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Attack Detection by Category
        </CardTitle>
        <CardDescription>Live network traffic classification results</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="normal" fill="#22c55e" name="Normal" />
            <Bar dataKey="attack" fill="#ef4444" name="Attack" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

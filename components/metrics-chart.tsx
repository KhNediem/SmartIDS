"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity } from "lucide-react"

// Mock data - replace with your real-time data
const data = [
  { time: "00:00", accuracy: 0.942, precision: 0.928, recall: 0.951, f1Score: 0.939, aucRoc: 0.945 },
  { time: "00:05", accuracy: 0.945, precision: 0.931, recall: 0.953, f1Score: 0.942, aucRoc: 0.948 },
  { time: "00:10", accuracy: 0.941, precision: 0.925, recall: 0.949, f1Score: 0.937, aucRoc: 0.943 },
  { time: "00:15", accuracy: 0.948, precision: 0.934, recall: 0.956, f1Score: 0.945, aucRoc: 0.95 },
  { time: "00:20", accuracy: 0.943, precision: 0.929, recall: 0.952, f1Score: 0.94, aucRoc: 0.946 },
  { time: "00:25", accuracy: 0.946, precision: 0.932, recall: 0.954, f1Score: 0.943, aucRoc: 0.949 },
  { time: "00:30", accuracy: 0.944, precision: 0.93, recall: 0.951, f1Score: 0.941, aucRoc: 0.947 },
]

export function MetricsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Neural Network IDS Performance
        </CardTitle>
        <CardDescription>Model accuracy, precision, and recall metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0.8, 1.0]} />
            <Tooltip />
            <Line type="monotone" dataKey="accuracy" stroke="#2563eb" strokeWidth={2} name="Accuracy" />
            <Line type="monotone" dataKey="precision" stroke="#dc2626" strokeWidth={2} name="Precision" />
            <Line type="monotone" dataKey="recall" stroke="#16a34a" strokeWidth={2} name="Recall" />
            <Line type="monotone" dataKey="f1Score" stroke="#800080" strokeWidth={2} name="F1 Score" />
            <Line type="monotone" dataKey="aucRoc" stroke="#FFA500" strokeWidth={2} name="AUC ROC" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

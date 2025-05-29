"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Globe, Bot, User, Server, Wifi } from "lucide-react"

// Mock data - replace with your real traffic classification data
const trafficData = [
  { type: "Connection Duration", count: 1247, percentage: 62.3, icon: User, color: "bg-green-500" },
  { type: "Protocol Type", count: 423, percentage: 21.2, icon: Bot, color: "bg-blue-500" },
  { type: "Service Type", count: 189, percentage: 9.4, icon: Server, color: "bg-purple-500" },
  { type: "Connection Flags", count: 98, percentage: 4.9, icon: Wifi, color: "bg-orange-500" },
  { type: "Bytes Transferred", count: 44, percentage: 2.2, icon: Globe, color: "bg-red-500" },
]

export function TrafficClassification() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Network Traffic Features Analysis
        </CardTitle>
        <CardDescription>Real-time analysis of 41 network traffic features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trafficData.map((item) => {
            const IconComponent = item.icon
            return (
              <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color.replace("bg-", "bg-").replace("-500", "-100")}`}>
                    <IconComponent className={`h-4 w-4 ${item.color.replace("bg-", "text-")}`} />
                  </div>
                  <div>
                    <p className="font-medium">{item.type}</p>
                    <p className="text-sm text-slate-600">{item.count} requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                  <Badge variant="secondary" className="min-w-[60px] justify-center">
                    {item.percentage}%
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Feature Importance</h3>
          <p className="text-sm text-slate-600">Top features contributing to network traffic analysis:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Connection Duration</li>
            <li>Protocol Type</li>
            <li>Service Type</li>
            {/* Add more features as needed */}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

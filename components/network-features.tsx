"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Network, Clock, Shield, Database, Zap } from "lucide-react"

// Key NSL-KDD features that your neural network analyzes
const networkFeatures = [
  {
    category: "Connection Features",
    features: ["duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes"],
    importance: 85,
    icon: Network,
    color: "bg-blue-500",
  },
  {
    category: "Content Features",
    features: ["hot", "num_failed_logins", "logged_in", "num_compromised", "root_shell"],
    importance: 78,
    icon: Shield,
    color: "bg-red-500",
  },
  {
    category: "Time-based Features",
    features: ["count", "srv_count", "serror_rate", "srv_serror_rate"],
    importance: 72,
    icon: Clock,
    color: "bg-green-500",
  },
  {
    category: "Host-based Features",
    features: ["dst_host_count", "dst_host_srv_count", "dst_host_same_srv_rate"],
    importance: 68,
    icon: Database,
    color: "bg-purple-500",
  },
]

export function NetworkFeatures() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Neural Network Feature Analysis
        </CardTitle>
        <CardDescription>Real-time analysis of 41 NSL-KDD network traffic features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {networkFeatures.map((category) => {
            const IconComponent = category.icon
            return (
              <div key={category.category} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color.replace("bg-", "bg-").replace("-500", "-100")}`}>
                      <IconComponent className={`h-4 w-4 ${category.color.replace("bg-", "text-")}`} />
                    </div>
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <p className="text-sm text-slate-600">{category.features.length} features</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="min-w-[80px] justify-center">
                    {category.importance}% importance
                  </Badge>
                </div>

                <div className="ml-12">
                  <Progress value={category.importance} className="h-2 mb-2" />
                  <div className="flex flex-wrap gap-1">
                    {category.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-4 w-4 text-slate-600" />
              <span className="font-medium text-slate-700">Model Architecture</span>
            </div>
            <p className="text-sm text-slate-600">
              5-layer Neural Network: 128→64→32→16→1 neurons with dropout and batch normalization
            </p>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span>• Binary Classification</span>
              <span>• 41 Input Features</span>
              <span>• Real-time Inference</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

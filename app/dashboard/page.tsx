"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Brain,
  TreePine,
  Zap,
  Target,
  TrendingUp,
  RefreshCw,
  Play,
  User,
  Bot,
  RotateCcw,
} from "lucide-react"
import { MetricsChart } from "@/components/metrics-chart"
import { ThreatDetectionChart } from "@/components/threat-detection-chart"
import { NetworkFeatures } from "@/components/network-features"
import { LiveDetection } from "@/components/live-detection"
import { useIDSData } from "@/hooks/use-ids-data"

export default function Dashboard() {
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [isModelSwitching, setIsModelSwitching] = useState(false)
  const router = useRouter()
  const { metrics, stats, isConnected, error, refreshData } = useIDSData()

  useEffect(() => {
    const model = localStorage.getItem("selectedModel")
    if (model) {
      setSelectedModel(model)
    } else {
      router.push("/")
    }
  }, [router])

  const modelInfo = {
    "neural-network": { name: "Neural Network", icon: Brain },
    xgboost: { name: "XGBoost", icon: TreePine },
  }

  const currentModel = modelInfo[selectedModel as keyof typeof modelInfo]
  const IconComponent = currentModel?.icon || Brain

  const handleModelSwitch = async (newModel: string) => {
    if (newModel === selectedModel || isModelSwitching) return

    setIsModelSwitching(true)
    try {
      const response = await fetch("/api/ids/model-switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelType: newModel }),
      })

      if (response.ok) {
        setSelectedModel(newModel)
        localStorage.setItem("selectedModel", newModel)
        console.log(`Model switch to ${newModel} requested`)
      } else {
        console.error("Failed to request model switch")
      }
    } catch (error) {
      console.error("Error requesting model switch:", error)
    } finally {
      setIsModelSwitching(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Model
            </Button>
            <div className="flex items-center gap-2">
              <IconComponent className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">{currentModel?.name} Dashboard</h1>
              {stats.modelAccuracy > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {(stats.modelAccuracy * 100).toFixed(1)}% accuracy
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Model Switch Buttons */}
            <div className="flex gap-2">
              <Button
                variant={selectedModel === "neural-network" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModelSwitch("neural-network")}
                disabled={isModelSwitching}
              >
                {isModelSwitching && selectedModel !== "neural-network" ? (
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Neural Network
              </Button>
              <Button
                variant={selectedModel === "xgboost" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModelSwitch("xgboost")}
                disabled={isModelSwitching}
              >
                {isModelSwitching && selectedModel !== "xgboost" ? (
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <TreePine className="h-4 w-4 mr-2" />
                )}
                XGBoost
              </Button>
            </div>

            <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
              {isConnected ? "Live IDS Connected" : "IDS Offline"}
            </Badge>
            <Button variant="outline" size="sm" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Model Switching Status */}
        {isModelSwitching && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-800">
                <RotateCcw className="h-5 w-5 animate-spin" />
                <span className="font-medium">Switching Model...</span>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                The Python IDS collector is switching to the new model. This may take a few moments.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        {error && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Connection Issue:</span>
                <span>{error}</span>
              </div>
              <p className="text-sm text-orange-700 mt-2">
                Make sure the Python IDS collector is running and sending data to the API endpoints.
              </p>
            </CardContent>
          </Card>
        )}

        {/* IDS Instructions */}
        {!isConnected && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-800 mb-3">
                <Play className="h-5 w-5" />
                <span className="font-medium">Start Network Monitoring</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                To see live network traffic analysis, run the Python IDS collector:
              </p>
              <div className="bg-blue-100 p-3 rounded-lg font-mono text-sm text-blue-900">
                <div>python ids_data_collector.py -i "Wi-Fi" --nextjs http://localhost:3000</div>
                <div className="text-xs mt-1 text-blue-600"># Replace "Wi-Fi" with your network interface</div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                The collector will automatically switch models when you select them in the dashboard.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Accuracy</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.accuracy.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Throughput</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.throughput}</p>
                  <p className="text-xs text-slate-500">connections/min</p>
                </div>
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Attacks Detected</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.attacksDetected}</p>
                  <p className="text-xs text-slate-500">total</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Human Traffic</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics.humanTraffic}</p>
                  <p className="text-xs text-slate-500">connections</p>
                </div>
                <User className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Bot/AI Traffic</p>
                  <p className="text-2xl font-bold text-purple-600">{metrics.botTraffic + metrics.aiTraffic}</p>
                  <p className="text-xs text-slate-500">connections</p>
                </div>
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Model Performance
              </CardTitle>
              <CardDescription>Real-time accuracy and performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Precision</span>
                    <span>{metrics.precision.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.precision * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Recall</span>
                    <span>{metrics.recall.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.recall * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>F1-Score</span>
                    <span>{metrics.f1Score.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.f1Score * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Traffic Analysis
              </CardTitle>
              <CardDescription>Current traffic source breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Human</span>
                    </div>
                    <p className="text-lg font-semibold text-blue-600">{metrics.humanTraffic}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Bot className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Bot</span>
                    </div>
                    <p className="text-lg font-semibold text-orange-600">{metrics.botTraffic}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">AI</span>
                    </div>
                    <p className="text-lg font-semibold text-purple-600">{metrics.aiTraffic}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{isConnected ? "System Protected" : "System Offline"}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={isConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {isConnected ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <MetricsChart />
          <ThreatDetectionChart />
        </div>

        {/* Live Detection */}
        <LiveDetection />

        {/* Network Features */}
        <NetworkFeatures />
      </div>
    </div>
  )
}

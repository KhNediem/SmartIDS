"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, TreePine, ArrowRight, Shield, Activity, Terminal } from "lucide-react"

const models = [
  {
    id: "neural-network",
    name: "Neural Network",
    description: "5-layer architecture with dropout and batch normalization for complex pattern recognition",
    icon: Brain,
    pros: [
      "High accuracy on complex patterns",
      "41 network features analysis",
      "Binary classification (Normal vs Attack)",
      "NSL-KDD dataset compatibility",
    ],
    cons: ["Requires more computational resources", "Less interpretable"],
    bestFor: [
      "Environments where false alarms are expensive",
      "Security teams that can't handle many alerts",
      "Systems where disrupting normal traffic is costly",
      "High-stakes networks requiring maximum accuracy",
    ],
    accuracy: "96.5%",
    speed: "Medium",
    complexity: "High",
  },
  {
    id: "xgboost",
    name: "XGBoost",
    description: "Gradient boosting framework for structured data",
    icon: TreePine,
    pros: ["Fast inference", "Highly interpretable", "Good with tabular data"],
    cons: ["May struggle with complex patterns", "Requires feature engineering"],
    bestFor: [
      "Environments needing quick decision explanations",
      "Resource-constrained systems with limited compute",
      "Teams requiring interpretable security decisions",
      "Compliance environments needing audit trails",
    ],
    accuracy: "91.8%",
    speed: "Fast",
    complexity: "Medium",
  },
]

export default function ModelSelection() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const router = useRouter()

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    // Store selected model in localStorage for the dashboard
    localStorage.setItem("selectedModel", modelId)
    // Navigate to dashboard after a brief delay
    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Traffic Analyzer</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Choose your ML model for real-time traffic classification and threat detection
          </p>
          <div className="flex justify-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.push("/setup")}>
              <Terminal className="h-4 w-4 mr-2" />
              Setup Integration
            </Button>
          </div>
        </div>

        {/* Model Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {models.map((model) => {
            const IconComponent = model.icon
            const isSelected = selectedModel === model.id

            return (
              <Card
                key={model.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""
                }`}
                onClick={() => handleModelSelect(model.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{model.name}</CardTitle>
                      <CardDescription>{model.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{model.accuracy}</div>
                      <div className="text-sm text-slate-500">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{model.speed}</div>
                      <div className="text-sm text-slate-500">Speed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">{model.complexity}</div>
                      <div className="text-sm text-slate-500">Complexity</div>
                    </div>
                  </div>

                  {/* Pros */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">Advantages</h4>
                    <ul className="space-y-1">
                      {model.pros.map((pro, index) => (
                        <li key={index} className="text-sm text-slate-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2">Considerations</h4>
                    <ul className="space-y-1">
                      {model.cons.map((con, index) => (
                        <li key={index} className="text-sm text-slate-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best For */}
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">Best For</h4>
                    <ul className="space-y-1">
                      {model.bestFor.map((useCase, index) => (
                        <li key={index} className="text-sm text-slate-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Select Button */}
                  <Button className="w-full mt-4" variant={isSelected ? "default" : "outline"} disabled={isSelected}>
                    {isSelected ? (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        Select Model
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Competition Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 mb-2">Competition Focus</h3>
              <p className="text-blue-700 text-sm">
                Network traffic analysis • Binary classification • 41-feature analysis • Real-time IDS
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

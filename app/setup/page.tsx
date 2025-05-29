"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Terminal, Play, CheckCircle, Copy, ExternalLink, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)
  const router = useRouter()

  const copyToClipboard = (text: string, commandId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(commandId)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const setupSteps = [
    {
      id: "install",
      title: "Install Dependencies",
      description: "Install required Python packages for network monitoring",
      commands: [
        "pip install scapy numpy joblib scikit-learn tensorflow requests",
        "# For Windows users, you may need to install Npcap:",
        "# Download from https://npcap.com/",
      ],
      status: "required",
    },
    {
      id: "download",
      title: "Download IDS Collector",
      description: "Get the Python script that captures and analyzes network traffic",
      commands: [
        "# Download the IDS collector script",
        "curl -O https://raw.githubusercontent.com/your-repo/ids_data_collector.py",
        "# Or copy the script from the provided attachment",
      ],
      status: "required",
    },
    {
      id: "permissions",
      title: "Set Permissions",
      description: "Network packet capture requires administrator privileges",
      commands: [
        "# On Linux/Mac:",
        "sudo python ids_data_collector.py --list-interfaces",
        "",
        "# On Windows:",
        "# Run Command Prompt as Administrator",
        "python ids_data_collector.py --list-interfaces",
      ],
      status: "required",
    },
    {
      id: "test",
      title: "Test Connection",
      description: "Verify the bridge between Python and Next.js works",
      commands: ["python ids_nextjs_bridge.py", "# This will test the connection to the dashboard"],
      status: "optional",
    },
    {
      id: "run",
      title: "Start Monitoring",
      description: "Begin real-time network traffic analysis",
      commands: [
        'python ids_data_collector.py -i "Wi-Fi" -m complete_nn_ids_model.pkl',
        "# Replace 'Wi-Fi' with your network interface name",
        "# Use --list-interfaces to see available interfaces",
      ],
      status: "required",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Setup Network IDS Integration</h1>
          <p className="text-lg text-slate-600">
            Connect the Python IDS collector to your Next.js dashboard for real-time monitoring
          </p>
        </div>

        <div className="space-y-6">
          {setupSteps.map((step, index) => (
            <Card key={step.id} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {step.title}
                      <Badge variant={step.status === "required" ? "default" : "secondary"}>{step.status}</Badge>
                    </CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 rounded-lg p-4 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(step.commands.join("\n"), step.id)}
                  >
                    {copiedCommand === step.id ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="text-sm text-slate-300 overflow-x-auto">
                    {step.commands.map((cmd, i) => (
                      <div key={i} className={cmd.startsWith("#") ? "text-slate-500" : "text-green-400"}>
                        {cmd}
                      </div>
                    ))}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integration Architecture */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Terminal className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Python IDS Collector</h3>
                <p className="text-sm text-slate-600">
                  Captures network packets, extracts 41 features, and classifies traffic using ML models
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ArrowRight className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">API Bridge</h3>
                <p className="text-sm text-slate-600">
                  Sends classified connections and metrics to Next.js API endpoints via HTTP requests
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ExternalLink className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Next.js Dashboard</h3>
                <p className="text-sm text-slate-600">
                  Displays real-time network analysis, threat alerts, and performance metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Model Selection
          </Button>
          <Button onClick={() => router.push("/dashboard")}>
            <Play className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

import { type NextRequest, NextResponse } from "next/server"
import { idsDataStore } from "@/lib/ids-bridge"

export async function POST(request: NextRequest) {
  try {
    const { modelType } = await request.json()

    if (!modelType || !["neural-network", "xgboost"].includes(modelType)) {
      return NextResponse.json({ error: "Invalid model type" }, { status: 400 })
    }

    // Request model switch
    idsDataStore.requestModelSwitch(modelType)

    return NextResponse.json({
      success: true,
      message: `Model switch to ${modelType} requested`,
      modelType,
    })
  } catch (error) {
    console.error("Error requesting model switch:", error)
    return NextResponse.json({ error: "Failed to request model switch" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const request = idsDataStore.getModelSwitchRequest()
    return NextResponse.json({ request })
  } catch (error) {
    console.error("Error getting model switch request:", error)
    return NextResponse.json({ error: "Failed to get model switch request" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    idsDataStore.clearModelSwitchRequest()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing model switch request:", error)
    return NextResponse.json({ error: "Failed to clear model switch request" }, { status: 500 })
  }
}

"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DeliveryFiles from "@/components/delivery-file"

interface Delivery {
  id: number
  project_id: number
  title: string
  description: string | null
  status: string
  version: number
  created_at: string
  delivered_at: string | null
}



const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  delivered: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function DeliveryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deliveryId = Number(params.id)

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDelivery = async () => {
    try {
      const data = await api.getDelivery(deliveryId)
      setDelivery(data)
    } catch (error) {
      console.error("[v0] Failed to load delivery:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDelivery()
  }, [deliveryId])

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.updateDeliveryStatus(deliveryId, newStatus)
      loadDelivery()
    } catch (error) {
      console.error("[v0] Failed to update status:", error)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="text-muted-foreground">Loading...</div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  if (!delivery) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="text-muted-foreground">Delivery not found</div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/deliveries")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground">{delivery.title}</h2>
              </div>
              <Badge className={statusColors[delivery.status] || ""} variant="outline">
                {delivery.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Description</span>
                    <p className="text-sm text-foreground mt-1">{delivery.description || "No description provided"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Version</span>
                    <p className="text-sm text-foreground mt-1">{delivery.version}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Created</span>
                    <p className="text-sm text-foreground mt-1">{new Date(delivery.created_at).toLocaleString()}</p>
                  </div>
                  {delivery.delivered_at && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Delivered</span>
                      <p className="text-sm text-foreground mt-1">{new Date(delivery.delivered_at).toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Management</CardTitle>
                  <CardDescription>Update the delivery status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-2 block">Current Status</span>
                    <Select value={delivery.status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Files
                  </CardTitle>
                  <CardDescription>Uploaded files for this delivery</CardDescription>
                </CardHeader>
                <CardContent>
                  <DeliveryFiles deliveryId={deliveryId} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Non-Conformities
                  </CardTitle>
                  <CardDescription>Issues reported for this delivery</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No NCEs reported</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"

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

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDeliveries() {
      try {
        const data = await api.getDeliveries()
        setDeliveries(data)
      } catch (error) {
        console.error("[v0] Failed to load deliveries:", error)
      } finally {
        setLoading(false)
      }
    }
    loadDeliveries()
  }, [])

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card">
            <div className="flex h-16 items-center px-8">
              <h2 className="text-2xl font-bold text-foreground">All Deliveries</h2>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-muted-foreground">Loading deliveries...</div>
            ) : deliveries.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No deliveries yet</h3>
                  <p className="text-sm text-muted-foreground">Deliveries will appear here once created</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <Link key={delivery.id} href={`/deliveries/${delivery.id}`}>
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" />
                              {delivery.title}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {delivery.description || "No description provided"}
                            </CardDescription>
                          </div>
                          <Badge className={statusColors[delivery.status] || ""} variant="outline">
                            {delivery.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Version {delivery.version}</span>
                          <span>Created {new Date(delivery.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

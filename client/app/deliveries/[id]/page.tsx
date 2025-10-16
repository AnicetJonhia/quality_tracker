"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileText, AlertTriangle ,Send, Check, X, Plus} from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import DeliveryFiles from "@/components/delivery-file"
import { CreateNCEForDeliveryDialog } from "@/components/delivery/create-nce-for-delivery-dialog"

import {NCE, Delivery } from "@/lib/type"



const statusDeliveryColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  delivered: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}


const statusNCEColors: Record<string, string> = {
  open: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",

}

export default function DeliveryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deliveryId = Number(params.id)

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [nces, setNCEs] = useState<NCE[]>([]) 

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



  const loadNCEs = async () => {
    try {
      const data = await api.getNCEs()
      const filtered = data.filter((nce: NCE) => nce.delivery_id === deliveryId)
    setNCEs(filtered)
    } catch (error) {
      console.error("[v0] Failed to load NCEs:", error)
    }
  }

  useEffect(() => {
    loadNCEs()
  }, [])

  const handleNCECreated = () => {
    setShowCreateDialog(false)
    loadNCEs() 
  }

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
              <Badge className={statusDeliveryColors[delivery.status] || ""} variant="outline">
                {delivery.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-6 lg:grid-cols-2">
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
                    <span className="text-sm font-medium text-muted-foreground">Client</span>
                    <p className="text-sm text-foreground mt-1">{delivery?.project?.client?.email}</p>
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

              
            </div>

           

          <div className="mt-6 grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    className="flex-1 flex items-center justify-center"
                    variant={delivery.status === "delivered" ? "default" : "outline"}
                    onClick={() => handleStatusChange("delivered")}
                  >
                    <Send className="mr-2 h-4 w-4" /> Send to client
                  </Button>

                  <Button
                    className="flex-1 flex items-center justify-center"
                    variant={delivery.status === "approved" ? "default" : "outline"}
                    onClick={() => handleStatusChange("approved")}
                  >
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>

                  <Button
                    className="flex-1 flex items-center justify-center"
                    variant={delivery.status === "rejected" ? "default" : "outline"}
                    onClick={() => handleStatusChange("rejected")}
                  >
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>



            <div className="mt-6 gap-6 ">
              

              <Card>
                  <CardHeader className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <CardTitle>Non-Conformities</CardTitle>
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2 flex  items-center">
                      <Plus className="h-4 w-4" /> Report Non-Conformity
                    </Button>
                  </CardHeader>

                  <CardContent>
                   
                    {nces.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No non-conformities reported yet</p>
                    ) : (
                      <div className="space-y-2">
                          {nces.map((nce) => (
                            <Link key={nce.id} href={`/nce/${nce.id}`} className="block">
                            
                                <div className="flex justify-between items-center p-2 border rounded space-y-1">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{nce.title}</span>
                                    <span className="text-xs text-muted-foreground">{nce.description}</span>
                                  </div>
                                  <Badge className={statusNCEColors[nce.status] || ""}>{nce.status}</Badge>
                                </div>
                          
                            </Link>
                          ))}
                        </div>

                    )}
                  </CardContent>
                </Card>

            </div>
          </div>
        </main>
      </div>

      <CreateNCEForDeliveryDialog deliveryId={deliveryId} open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleNCECreated} />
    </AuthGuard>
  )
}

"use client"

import { use, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Download,AlertTriangle, AlertCircle, AlertOctagon, Info } from "lucide-react"
import { api } from "@/lib/api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { set } from "date-fns"

import { NCE } from "@/lib/type"


const severityConfig = {
  low: { icon: Info, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  medium: { icon: AlertCircle, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  critical: { icon: AlertOctagon, color: "bg-red-500/10 text-red-500 border-red-500/20" },
}

const statusColors: Record<string, string> = {
  open: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20"
}

export default function NCEDetailPage() {
  const params = useParams()
  const router = useRouter()
  const nceId = Number(params.id)

  const [nce, setNCE] = useState<NCE | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deliveryTitle, setDeliveryTitle] = useState(null)

  const loadNCE = async () => {
    try {
      const data = await api.getNCE(nceId)
      setNCE(data)
    } catch (error) {
      console.error("[v0] Failed to load NCE:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNCE()
  }, [nceId])


  const loadDeliveryTitle = async (deliveryId: number) => {
    try {
      const data = await api.getDelivery(deliveryId)
      setDeliveryTitle(data.title)
    } catch (error) {
      console.error("[v0] Failed to load delivery:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (nce) {
      loadDeliveryTitle(nce.delivery_id)
    }
  })
  const handleDownload = async (fileId: number, filename: string) => {
  try {
    const blob = await api.downloadNCEFile(nceId, fileId)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Download failed:", error)
  }
}


  const handleUpdateNCE = async (updates: {
      status?: string
      severity?: string
      category?: string
    }) => {
      setUpdating(true)
      try {
        await api.updateNCE(nceId, updates)
        loadNCE()
      } catch (error) {
        console.error("[v0] Failed to update NCE:", error)
      } finally {
        setUpdating(false)
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

  if (!nce) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="text-muted-foreground">NCE not found</div>
          </main>
        </div>
      </AuthGuard>
    )
  }

  const SeverityIcon = severityConfig[nce.severity as keyof typeof severityConfig]?.icon || AlertTriangle
  const severityColor =
    severityConfig[nce.severity as keyof typeof severityConfig]?.color ||
    "bg-gray-500/10 text-gray-500 border-gray-500/20"


  

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/nce")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground">{nce.title}</h2>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className={severityColor}>
                  {nce.severity}
                </Badge>
                <Badge variant="outline" className={statusColors[nce.status] || ""}>
                  {nce.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SeverityIcon className="h-5 w-5" />
                    NCE Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Description</span>
                    <p className="text-sm text-foreground mt-1">{nce.description}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Delivery Title</span>
                    <p className="text-sm text-foreground mt-1">{deliveryTitle || nce.delivery_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Reported</span>
                    <p className="text-sm text-foreground mt-1">{new Date(nce.created_at).toLocaleString()}</p>
                    
                  </div>
                  
                  {nce.resolved_at && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Resolved</span>
                      <p className="text-sm text-foreground mt-1">{new Date(nce.resolved_at).toLocaleString()}</p>
                    </div>
                  )}

                  {nce.files && nce.files.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Attachements</span>
                      <ul className=" pl-4">
                        {nce.files.map((file, index) => (
                          <li key={file.id} className="text-sm text-foreground mt-1">
                            <div
                              className="flex items-center space-x-3 cursor-pointer"
                              onClick={() => handleDownload(file.id, file.filename)}
                            >
                              <Download className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium text-blue-600 hover:underline">
                                {file.filename} 
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
              <CardHeader>
                <CardTitle>Quality Management</CardTitle>
                <CardDescription>Update the NCE status, severity, and category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Status */}
                <div>
                  <Label htmlFor="status" className="mb-2 block">
                    Current Status
                  </Label>
                  <Select
                    value={nce.status}
                    onValueChange={(value) => setNCE({...nce, status: value})}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Severity */}
                <div>
                  <Label htmlFor="severity" className="mb-2 block">
                    Severity
                  </Label>
                  <Select
                    value={nce.severity}
                    onValueChange={(value) => setNCE({...nce, severity: value})}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category" className="mb-2 block">
                    Category
                  </Label>
                  <Input
                    id="category"
                    value={nce.category || ""}
                    onChange={(e) => setNCE({...nce, category: e.target.value})}
                    placeholder="Category"
                    disabled={updating}
                  />
                </div>

            

                {/* Save Button */}
                <Button
                  onClick={() =>
                    handleUpdateNCE({
                      status: nce.status,
                      severity: nce.severity,
                      category: nce.category,
                    })
                  }
                  disabled={updating}
                  className="w-full"
                  variant="outline"
                >
                  {updating ? "Saving..." : "Save"}
                </Button>
              </CardContent>
            </Card>

            </div>

            
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

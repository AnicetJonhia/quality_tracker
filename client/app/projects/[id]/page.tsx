"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Package } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import { CreateDeliveryDialog } from "@/components/create-delivery-dialog"
import { Project,   Delivery } from "@/lib/type"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delivered: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Number(params.id)

  const [project, setProject] = useState<Project | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const loadData = async (): Promise<void> => {
  setLoading(true)
  try {
    // Load project and deliveries in parallel
    const [projectResponse, deliveriesResponse] = await Promise.all([
      api.getProject(projectId),
      api.getDeliveries(),
    ])

    // Basic validation
    if (!projectResponse || !deliveriesResponse) {
      throw new Error("No data received from the server")
    }

    // Filter deliveries related to the current project
    const projectDeliveries = deliveriesResponse.deliveries?.filter(
      (delivery: Delivery) => delivery.project?.id === projectId
    ) ?? []

    // Update state
    setProject(projectResponse)
    setDeliveries(projectDeliveries)
  } catch (error) {
    console.error("[loadData] Failed to load project data:", error)
  } finally {
    setLoading(false)
  }
}


  useEffect(() => {
    loadData()
  }, [projectId])

  const handleDeliveryCreated = () => {
    setShowCreateDialog(false)
    loadData()
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

  if (!project) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-8">
            <div className="text-muted-foreground">Project not found</div>
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
                <Button variant="ghost" size="icon" onClick={() => router.push("/projects")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground">{project.name}</h2>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Delivery
              </Button>
            </div>
          </div>

          <div className="p-8">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.client && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Client: </span>
                    <span className="text-sm text-foreground">{project.client.email}</span>
                  </div>
                )}
                {project.description && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Description: </span>
                    <span className="text-sm text-foreground">{project.description}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Created: </span>
                  <span className="text-sm text-foreground">{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Deliveries</h3>
              <p className="text-sm text-muted-foreground">Manage all deliveries for this project</p>
            </div>

            {deliveries.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No deliveries yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create your first delivery for this project</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Delivery
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <Link key={delivery.id} href={`/deliveries/${delivery.id}`} className="block">
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
                            {delivery.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Client :  {delivery?.project?.client?.email}</span>
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

      <CreateDeliveryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleDeliveryCreated}
        projectId={projectId}
      />
    </AuthGuard>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import { Delivery } from "@/lib/type"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  delivered: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState<number>(0)
  const [ limit, setLimit ] = useState(4)

  // --- Filters ---
  const [projectName, setProjectName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [status, setStatus] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const loadDeliveries = async (currentPage: number = 0) => {
    setLoading(true)
    try {
      const data = await api.getDeliveries({
        skip: Math.max(0, currentPage * limit),
        limit,
        project_name: projectName,
        client_email: clientEmail,
        status_filter: status || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        sort_by: "created_at",
        sort_order: sortOrder,
      })
      setDeliveries(data.deliveries)
      setTotalItems(data.total)
    } catch (error) {
      console.error("[v0] Failed to load deliveries:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(0) // reset page when filters or sort change
    loadDeliveries(0)
  }, [projectName, clientEmail, status, startDate, endDate, sortOrder])

  useEffect(() => {
    loadDeliveries(page)
  }, [page])

  const totalPages = Math.ceil(totalItems / limit)
  

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

          <div className="p-8 space-y-4">
            {/* --- Filters --- */}
            <div className="flex flex-wrap gap-4 mb-4">
              <input
                type="text"
                placeholder="Project name..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="input input-bordered"
              />
              <input
                type="text"
                placeholder="Client email..."
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="input input-bordered"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input input-bordered"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="delivered">Delivered</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-bordered"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-bordered"
              />
              {/* --- Sort order --- */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="input input-bordered"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            {loading ? (
              <div className="text-muted-foreground">Loading deliveries...</div>
            ) : deliveries.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No deliveries found</h3>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                </CardContent>
              </Card>
            ) : (
              <>
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
                            <div className="flex items-end flex-col">
                              <Badge className={statusColors[delivery.status] || ""} variant="outline">
                              {delivery.status}
                            </Badge>
                            <span>Created {new Date(delivery.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Project {delivery?.project.name}</span>
                            <span>Client {delivery?.project.client?.email}</span>
                            
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <Pagination className="mt-6 flex justify-center">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (page > 0) setPage(page - 1)
                        }}
                      />
                    </PaginationItem>

                    {(() => {
                      const pages = []
                      let start = Math.max(0, page - 1)
                      let end = Math.min(totalPages, start + 3)
                      if (end - start < 3) start = Math.max(0, end - 3)

                      if (start > 0)
                        pages.push(
                          <PaginationItem key="start-ellipsis">
                            <PaginationEllipsis />
                          </PaginationItem>
                        )

                      for (let i = start; i < end; i++) {
                        pages.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#"
                              isActive={i === page}
                              onClick={(e) => {
                                e.preventDefault()
                                setPage(i)
                              }}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }

                      if (end < totalPages)
                        pages.push(
                          <PaginationItem key="end-ellipsis">
                            <PaginationEllipsis />
                          </PaginationItem>
                        )

                      return pages
                    })()}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setPage((prev) => Math.min(prev + 1, totalPages - 1))
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

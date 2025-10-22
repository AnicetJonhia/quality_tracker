"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle, AlertCircle, AlertOctagon, CheckCircle ,Info } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import { CreateNCEDialog } from "@/components/create-nce-dialog"

import { NCE } from "@/lib/type"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { CalendarPopover } from "@/components/utils/calendar-popover"
import { Input } from "@/components/ui/input"
import { ClientEmailFilter } from "@/components/utils/client-email-filter"
import { ProjectNameFilter } from "@/components/utils/project-name-filter"


const severityConfig = {
  low: { icon: Info, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  medium: { icon: AlertCircle, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  high: { icon: AlertTriangle, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  critical: { icon: AlertOctagon, color: "bg-red-500/10 text-red-500 border-red-500/20" },
}

const statusColors: Record<string, string> = {
  open: "bg-red-500/10 text-red-500 border-red-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  resolved: "bg-green-500/10 text-green-500 border-green-500/20",

}

export default function NCEPage() {
  const [nces, setNCEs] = useState<NCE[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState<number>(0)
  const [ limit, setLimit ] = useState(3)

  const [search, setSearch] = useState("")
  const [projectName, setProjectName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [deliveryTitle,setDeliveryTitle] = useState("")
  const [status, setStatus] = useState("")
  const [category,setCategory] = useState("")
  const [severity,setSeverity] = useState("")
  const [startDate, setStartDate] = useState<string | undefined>()
  const [endDate, setEndDate] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  

  const loadNCEs = async (currentPage: number = 0) => {
  setLoading(true)
  try {
    const data = await api.getNCEs({
      skip: Math.max(0, currentPage * limit),
      limit,
      search: search || undefined,
      status_filter: status || undefined,
      severity_filter: severity || undefined,
      category: category || undefined,
      delivery_title: deliveryTitle || undefined,
      project_name: projectName || undefined,
      client_email: clientEmail || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      sort_by: "created_at",
      sort_order: sortOrder || "desc",
    })
    setNCEs(data.nces)
    setTotalItems(data.total)
  } catch (error) {
    console.error(" Failed to load NCEs:", error)
  } finally {
    setLoading(false)
  }
}





useEffect(() => {
  loadNCEs(page)
}, [search,page, status, severity, category, deliveryTitle, projectName, startDate, endDate, sortOrder])

  const handleNCECreated = () => {
    setShowCreateDialog(false)
    loadNCEs()
  }

  
  const totalPages = Math.ceil(totalItems / limit) 

  const openNCEs = nces.filter((nce) => nce.status === "open").length
  const inProgressNCEs = nces.filter((nce) => nce.status === "in_progress").length
  const resolvedNCEs = nces.filter((nce) => nce.status === "resolved").length

  const lowNCEs = nces.filter((nce) => nce.severity === "low").length
  const mediumNCEs = nces.filter((nce) => nce.severity === "medium").length
  const criticalNCEs = nces.filter((nce) => nce.severity === "critical").length


  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-8">
              <h2 className="text-2xl font-bold text-foreground">NCE Tracking</h2>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Report NCE
              </Button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total NCEs</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{nces.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">All non-conformities</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{openNCEs}</div>
                  <p className="text-xs text-muted-foreground mt-1">Require attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{inProgressNCEs}</div>
                  <p className="text-xs text-muted-foreground mt-1">Being resolved</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{resolvedNCEs}</div>
                  <p className="text-xs text-muted-foreground mt-1">Resolved issues</p>
                </CardContent>
              </Card>
            </div>

            {/* --- Filters --- */}
                <div className="flex flex-wrap gap-4 mb-4">
    
                  {/* Search */}
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      type="text"
                      placeholder="Search NCE..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
    
                  {/* Project Name Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <ProjectNameFilter value={projectName} onChange={setProjectName} />
                    </div>
    
                    {/* Client Email Filter */}
                    <div className="flex-1 min-w-[200px]">
                      <ClientEmailFilter value={clientEmail} onChange={setClientEmail} />
                    </div>
    
                  {/* Delivery */}
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      type="text"
                      placeholder="DeliveryTitle..."
                      value={search}
                      onChange={(e) => setDeliveryTitle(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  
                  {/* --- Status Filter --- */}
                  
                  <div className="min-w-[180px] sm:flex-1 w-full">
                      <Select 
                      value={status || "all"} 
                      onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          
                        </SelectContent>
                      </Select>
                  </div>

                  {/* --- Severity Filter --- */}
                  
                  <div className="min-w-[180px] sm:flex-1 w-full">
                      <Select 
                      value={status || "all"} 
                      onValueChange={(value) => setSeverity(value === "all" ? "" : value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All severities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All severities</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          
                        </SelectContent>
                      </Select>
                  </div>
    
                  {/* Start Date */}
                  <div className="min-w-[160px] sm:flex-1 w-full">
                    <CalendarPopover
                      selected={startDate ? new Date(startDate) : undefined}
                      onSelect={(date) =>
                        setStartDate(date ? date.toISOString().split("T")[0] : "")
                      }
                      placeholder="Start date"
                    />
                  </div>
    
                  {/* End Date */}
                  <div className="min-w-[160px] sm:flex-1 w-full">
                      <CalendarPopover
                        selected={endDate ? new Date(endDate) : undefined}
                        onSelect={(date) =>
                          setEndDate(date ? date.toISOString().split("T")[0] : "")
                        }
                        placeholder="End date"
                      />
                  </div>
                  
                  {/* --- Sort Order --- */}
                  <div className="min-w-[180px] sm:flex-1 w-full">
                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sort order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
    
                </div>

            {loading ? (
              <div className="text-muted-foreground">Loading NCEs...</div>
            ) : nces.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No NCEs reported</h3>
                  <p className="text-sm text-muted-foreground mb-4">Report your first non-conformity</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Report NCE
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">All Non-Conformities</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      Low: {lowNCEs}
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      Medium: {mediumNCEs}
                    </Badge>
                    
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      Critical: {criticalNCEs}
                    </Badge>
                    
                  </div>
                </div>

                

                {nces.map((nce) => {
                  const SeverityIcon =
                    severityConfig[nce.severity as keyof typeof severityConfig]?.icon || AlertTriangle
                  const severityColor =
                    severityConfig[nce.severity as keyof typeof severityConfig]?.color ||
                    "bg-gray-500/10 text-gray-500 border-gray-500/20"

                  return (
                    <Link key={nce.id} href={`/nce/${nce.id}`} className="block">
                      <Card className="hover:border-primary transition-colors cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="flex items-center gap-2">
                                <SeverityIcon className="h-5 w-5" />
                                {nce.title}
                              </CardTitle>
                              <CardDescription className="mt-1 line-clamp-2">{nce.description}</CardDescription>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <Badge variant="outline" className={severityColor}>
                                {nce.severity}
                              </Badge>
                              <Badge variant="outline" className={statusColors[nce.status] || ""}>
                                {nce.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Delivery {nce?.delivery.title}</span>
                            <span>Reported {new Date(nce.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}

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
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateNCEDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleNCECreated} />
    </AuthGuard>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { Plus, FolderKanban } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import { CreateProjectDialog } from "@/components/create-project-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ClientEmailFilter } from "@/components/utils/client-email-filter"
import { CalendarPopover } from "@/components/utils/calendar-popover"

import { Project } from "@/lib/type"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)


  const [search, setSearch] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(6)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const [totalProjects, setTotalProjects] = useState(0)
  

  const loadProjects = async () => {
  try {
    setLoading(true)
    const data = await api.getProjects({
      skip: page * limit,
      limit,
      search: search || undefined,
      client_email: clientFilter || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      sort_order: sortOrder,
    })
    setProjects(data?.projects)
    setTotalProjects(data?.total)
  } catch (error) {
    console.error("Failed to load projects:", error)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    loadProjects()
  }, [page, search, clientFilter, startDate, endDate, sortOrder])


  const handleProjectCreated = () => {
    setShowCreateDialog(false)
    loadProjects()
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-8">
              <h2 className="text-2xl font-bold text-foreground">Projects</h2>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>

          <div className="p-8 flex flex-wrap items-center gap-2  ">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Client Email Filter */}
          <div className="flex-1 min-w-[200px]">
          <ClientEmailFilter value={clientFilter} onChange={setClientFilter} />
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

          {/* Sort Order */}
          <div className="min-w-[180px] sm:flex-1 w-full">
            <Select value={sortOrder} onValueChange={setSortOrder}>
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



          <div className="p-8">
            {loading ? (
              <div className="text-muted-foreground">Loading projects...</div>
            ) : projects.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Get started by creating your first project</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FolderKanban className="h-5 w-5 text-primary" />
                          {project.name}
                        </CardTitle>
                        {project.client && (
                          <CardDescription className="text-xs">Client: {project.client.email}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {project.description || "No description provided"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-4">
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          
          {/* Pagination */}
        <Pagination className="mt-6 flex justify-center">
          <PaginationContent>
            {/* Previous */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page > 0) setPage(page - 1)
                }}
              />
            </PaginationItem>

            {/* Pages dynamiques */}
            {(() => {
              const totalPages = Math.ceil(totalProjects / limit)
              const pages = []

              // Plage de 3 pages visibles autour de la page courante
              let start = Math.max(0, page - 1)
              let end = Math.min(totalPages, start + 3)
              if (end - start < 3) {
                start = Math.max(0, end - 3)
              }

              // Ajouter "..." au début si nécessaire
              if (start > 0) {
                pages.push(
                  <PaginationItem key="start-ellipsis">
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              // Ajouter les numéros de page
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

              // Ajouter "..." si on n’est pas à la dernière page
              if (end < totalPages) {
                pages.push(
                  <PaginationItem key="end-ellipsis">
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              return pages
            })()}

            {/* Next */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setPage((prev) => Math.min(prev + 1, Math.ceil(totalProjects / limit) - 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>



        </main>
      </div>

      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleProjectCreated}
      />
    </AuthGuard>
  )
}

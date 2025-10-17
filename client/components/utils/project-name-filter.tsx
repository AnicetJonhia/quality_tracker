"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { api } from "@/lib/api"
import { Project } from "@/lib/type"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

export function ProjectNameFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (projectName: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [totalProjects, setTotalProjects] = React.useState(0)
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(0)
  const [limit, setLimit] = React.useState(6)

  // Charger les projets
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await api.getProjects({ skip: page * limit, limit })
        setProjects(data.projects)
        setTotalProjects(data.total)
      } catch (error) {
        console.error("Failed to load projects:", error)
      }
    }
    loadProjects()
  }, [page])

  // Filtrage dynamique selon la saisie
  const filteredProjects = query
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
      )
    : projects

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Filter by project name..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search project name..."
            className="h-9"
            value={query}
            onValueChange={setQuery}
          />

          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>

            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                All projects
                <Check
                  className={cn("ml-auto", value === "" ? "opacity-100" : "opacity-0")}
                />
              </CommandItem>
            </CommandGroup>

            <CommandGroup>
              {filteredProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {project.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === project.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup className="px-2 mt-2">
              <Pagination className="flex justify-center w-full">
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
                    const totalPages = Math.ceil(totalProjects / limit)
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
                        setPage((prev) =>
                          Math.min(prev + 1, Math.ceil(totalProjects / limit) - 1)
                        )
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

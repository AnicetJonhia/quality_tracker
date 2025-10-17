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
import {Client} from "@/lib/type"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination"

export function ClientEmailFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (email: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [clients, setClients] = React.useState<Client[]>([])
  const [totalClients, setTotalClients] = React.useState(0)
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(0)
  const limit = 15

  // Charger les clients
  React.useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await api.getClients({ skip: page * limit, limit })
        setClients(data.clients)
        setTotalClients(data.total)
      } catch (error) {
        console.error("Failed to load clients:", error)
      }
    }
    loadClients()
  }, [page])

  // Filtrer dynamiquement selon la saisie
  const filteredClients = query
    ? clients.filter((c) =>
        c.email.toLowerCase().includes(query.toLowerCase())
      )
    : clients

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Filter by client email..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search client email..."
            className="h-9"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>

            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange("")
                  setOpen(false)
                }}
              >
                Reset the filter
                <Check
                  className={cn("ml-auto", value === "" ? "opacity-100" : "opacity-0")}
                />
              </CommandItem>
            </CommandGroup>

            <CommandGroup>
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.email}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {client.email}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === client.email ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>



        <CommandGroup className="px-2 mt-2">
        <Pagination className="flex justify-center w-full">
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
                const totalPages = Math.ceil(totalClients / limit)
                const pages = []

                // Plage de 3 pages visibles autour de la page courante
                let start = Math.max(0, page - 1)
                let end = Math.min(totalPages, start + 3)
                if (end - start < 3) {
                start = Math.max(0, end - 3)
                }

                // "..." au début si nécessaire
                if (start > 0) {
                pages.push(
                    <PaginationItem key="start-ellipsis">
                    <PaginationEllipsis />
                    </PaginationItem>
                )
                }

                // Numéros de page
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

                // "..." si fin non atteinte
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
                    setPage((prev) => Math.min(prev + 1, Math.ceil(totalClients / limit) - 1))
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

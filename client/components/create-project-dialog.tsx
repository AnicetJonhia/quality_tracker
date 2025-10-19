"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"

import {Client} from "@/lib/type"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [clientId, setClientId] = useState<number | null>(null)
  const [clientEmail, setClientEmail] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Charger la liste des clients depuis l'API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data: Client[] = await api.getClients()
      
        setClients(data.clients)
      } catch (err) {
        console.error("Failed to load clients", err)
      }
    }
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      
      const payload: any = {
        name,
        description: description || undefined,
      }

      if (clientId) payload.client_id = clientId
      else if (clientEmail) payload.client_email = clientEmail

      

      await api.createProject(payload)

      setName("")
      setDescription("")
      setClientId(null)
      setClientEmail("")
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setLoading(false)
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Add a new project to organize your deliveries</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Building Construction Phase 1"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <select
              id="client"
              className="w-full border rounded p-2"
              value={clientId || ""}
              onChange={(e) => {
                const val = e.target.value
                if (val === "new") {
                  setClientId(null)
                } else {
                  setClientId(Number(val))
                  setClientEmail("")
                }
              }}
              disabled={loading}
            >
              <option value="">-- Select a client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
              <option value="new">Create new client (enter email)</option>
            </select>

            {clientId === null && (
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                required
                disabled={loading}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project details and objectives..."
              rows={3}
              disabled={loading}
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

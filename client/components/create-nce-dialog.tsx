"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

interface CreateNCEDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Delivery {
  id: number
  title: string
}

export function CreateNCEDialog({ open, onOpenChange, onSuccess }: CreateNCEDialogProps) {
  const [deliveryId, setDeliveryId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      loadDeliveries()
    }
  }, [open])

  const loadDeliveries = async () => {
    try {
      const data = await api.getDeliveries()
      setDeliveries(data)
    } catch (error) {
      console.error("[v0] Failed to load deliveries:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.createNCE({
        delivery_id: Number(deliveryId),
        title,
        description
       
      })
      setDeliveryId("")
      setTitle("")
      setDescription("")
      
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create NCE")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Non-Conformity</DialogTitle>
          <DialogDescription>Document an issue or non-conformity with a delivery</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delivery">Delivery *</Label>
            <Select value={deliveryId} onValueChange={setDeliveryId} required disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a delivery" />
              </SelectTrigger>
              <SelectContent>
                {deliveries.map((delivery) => (
                  <SelectItem key={delivery.id} value={delivery.id.toString()}>
                    {delivery.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the non-conformity..."
              rows={4}
              required
              disabled={loading}
            />
          </div>

          

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !deliveryId}>
              {loading ? "Reporting..." : "Report NCE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

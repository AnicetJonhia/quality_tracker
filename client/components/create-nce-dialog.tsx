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
import { Paperclip, X } from "lucide-react"

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
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) loadDeliveries()
  }, [open])

  const loadDeliveries = async () => {
    try {
      const data = await api.getDeliveries()
      setDeliveries(data)
    } catch (error) {
      console.error("[v0] Failed to load deliveries:", error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Crée un FormData pour multipart
      const formData = new FormData()
      formData.append("delivery_id", deliveryId)
      formData.append("title", title)
      formData.append("description", description)
      files.forEach((file) => formData.append("files", file))

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/nces`, {
        method: "POST",
        headers: {
          // token si nécessaire
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })

      setDeliveryId("")
      setTitle("")
      setDescription("")
      setFiles([])

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
          {/* Delivery select */}
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

          {/* Title */}
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

          {/* Description */}
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

          {/* File upload */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="file">Files</Label>
            <div className="flex items-center justify-between mb-2">
              <Label
                htmlFor="file"
                className="flex flex-1 items-center justify-center cursor-pointer space-x-2 px-4 py-2 border rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
              >
                <Paperclip className="h-5 w-5 text-white" />
                <span className="font-medium">Attach files</span>
              </Label>
              <Input
                id="file"
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: "none" }}
                disabled={loading}
              />
            </div>

            {/* Aperçu fichiers */}
            {files.length > 0 && (
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
                    <span className="text-sm">{file.name}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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

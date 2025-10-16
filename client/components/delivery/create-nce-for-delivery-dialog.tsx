"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { Paperclip, X } from "lucide-react"

interface CreateNCEForDeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  deliveryId: number
}

export function CreateNCEForDeliveryDialog({
  open,
  onOpenChange,
  onSuccess,
  deliveryId,
}: CreateNCEForDeliveryDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleNCEFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)])
      e.currentTarget.value = ""
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.createNCE({
        delivery_id: deliveryId,
        title,
        description,
        files,
      })

      // reset
      setTitle("")
      setDescription("")
      setFiles([])

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create NCE")
      console.error("[CreateNCEDialog] createNCE error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Non-Conformity</DialogTitle>
          <DialogDescription>
            Document an issue or non-conformity for this delivery
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="file_nce">Files</Label>
            <div className="flex items-center justify-between mb-2">
              <Label
                htmlFor="file_nce"
                className="flex flex-1 items-center justify-center cursor-pointer space-x-2 px-4 py-2 border rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
              >
                <Paperclip className="h-5 w-5 text-white" />
                <span className="font-medium">Attach files</span>
              </Label>

              <Input
                id="file_nce"
                type="file"
                multiple
                onChange={handleNCEFileUpload}
                style={{ display: "none" }}
                disabled={loading}
              />
            </div>

            {/* Files preview */}
            {files.length > 0 && (
              <ul className="space-y-1 max-h-48 overflow-auto">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate max-w-xs">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(file.size / 1024)} KB
                      </span>
                    </div>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Reporting..." : "Report NCE"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

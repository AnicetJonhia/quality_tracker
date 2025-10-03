"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

interface CreateSurveyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Delivery {
  id: number
  title: string
}

export function CreateSurveyDialog({ open, onOpenChange, onSuccess }: CreateSurveyDialogProps) {
  const [deliveryId, setDeliveryId] = useState("")
  const [surveyType, setSurveyType] = useState<"nps" | "csat">("nps")
  const [score, setScore] = useState("5")
  const [comment, setComment] = useState("")
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
      await api.createSurvey({
        delivery_id: Number(deliveryId),
        survey_type: surveyType,
        score: Number(score),
        comment: comment || null,
      })
      setDeliveryId("")
      setSurveyType("nps")
      setScore("5")
      setComment("")
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create survey")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Survey</DialogTitle>
          <DialogDescription>Collect feedback on a delivery</DialogDescription>
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
            <Label htmlFor="surveyType">Survey Type *</Label>
            <Select
              value={surveyType}
              onValueChange={(value: "nps" | "csat") => setSurveyType(value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nps">NPS (Net Promoter Score)</SelectItem>
                <SelectItem value="csat">CSAT (Customer Satisfaction)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {surveyType === "nps"
                ? "How likely are you to recommend us? (0-10)"
                : "How satisfied are you with the delivery? (0-10)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="score">Score (0-10) *</Label>
            <Select value={score} onValueChange={setScore} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Additional feedback..."
              rows={3}
              disabled={loading}
            />
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !deliveryId}>
              {loading ? "Creating..." : "Create Survey"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

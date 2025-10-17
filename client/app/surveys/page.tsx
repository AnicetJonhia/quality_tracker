"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageSquare, Star, TrendingUp } from "lucide-react"
import { api } from "@/lib/api"
import { CreateSurveyDialog } from "@/components/create-survey-dialog"
import { Survey } from "@/lib/type"


export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const loadSurveys = async () => {
    try {
      const data = await api.getSurveys()
      setSurveys(data)
    } catch (error) {
      console.error("[v0] Failed to load surveys:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSurveys()
  }, [])

  const handleSurveyCreated = () => {
    setShowCreateDialog(false)
    loadSurveys()
  }

  const npsScores = surveys.filter((s) => s.survey_type === "nps" && s.score !== null)
  const csatScores = surveys.filter((s) => s.survey_type === "csat" && s.score !== null)

  const avgNPS =
    npsScores.length > 0 ? (npsScores.reduce((sum, s) => sum + (s.score || 0), 0) / npsScores.length).toFixed(1) : "N/A"

  const avgCSAT =
    csatScores.length > 0
      ? (csatScores.reduce((sum, s) => sum + (s.score || 0), 0) / csatScores.length).toFixed(1)
      : "N/A"

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-8">
              <h2 className="text-2xl font-bold text-foreground">Surveys</h2>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Survey
              </Button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Surveys</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{surveys.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {surveys.filter((s) => s.completed_at).length} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average NPS</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{avgNPS}</div>
                  <p className="text-xs text-muted-foreground mt-1">{npsScores.length} responses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average CSAT</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{avgCSAT}</div>
                  <p className="text-xs text-muted-foreground mt-1">{csatScores.length} responses</p>
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="text-muted-foreground">Loading surveys...</div>
            ) : surveys.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No surveys yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create your first survey to gather feedback</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Survey
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">All Surveys</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      NPS: {npsScores.length}
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      CSAT: {csatScores.length}
                    </Badge>
                  </div>
                </div>

                {surveys.map((survey) => (
                  <Card key={survey.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {survey.survey_type === "nps" ? (
                              <TrendingUp className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Star className="h-5 w-5 text-green-500" />
                            )}
                            {survey.survey_type.toUpperCase()} Survey
                          </CardTitle>
                          <CardDescription className="mt-1">Delivery : {survey?.delivery?.title}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {survey.score !== null && (
                            <div className="text-2xl font-bold text-foreground">{survey.score}/10</div>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              survey.completed_at
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            }
                          >
                            {survey.completed_at ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
           
                      <CardContent>
                        {survey.comment && (
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-sm text-foreground italic">"{survey.comment}"</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {survey.completed_at
                            ? `Completed ${new Date(survey.completed_at).toLocaleDateString()}`
                            : `Sent ${new Date(survey.sent_at).toLocaleDateString()}`}
                        </p>
                      </CardContent>
                  
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateSurveyDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleSurveyCreated} />
    </AuthGuard>
  )
}

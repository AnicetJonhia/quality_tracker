"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle, TrendingUp, Star, Download, CheckCircle, XCircle, Clock } from "lucide-react"
import { api } from "@/lib/api"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { DashboardStats, Delivery, NCE, Survey } from "@/lib/type"

const COLORS = {
  primary: "oklch(0.35 0.12 250)",
  accent: "oklch(0.68 0.18 35)",
  success: "oklch(0.55 0.15 140)",
  warning: "oklch(0.65 0.2 80)",
  danger: "oklch(0.55 0.22 25)",
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_deliveries: 0,
    total_nces: 0,
    open_nces: 0,
    avg_nps: 0,
    avg_csat: 0,
  })
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [nces, setNCEs] = useState<NCE[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, deliveriesData, ncesData, surveysData] = await Promise.all([
          api.getDashboardStats(),
          api.getDeliveries(),
          api.getNCEs(),
          api.getSurveys(),
        ])

        setStats(statsData)
        setDeliveries(deliveriesData)
        setNCEs(ncesData)
        setSurveys(surveysData)
      } catch (error) {
        console.error("[v0] Failed to load analytics data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Delivery status distribution
  const deliveryStatusData = [
    { name: "draft", value: deliveries.filter((d) => d.status === "pending").length, color: COLORS.warning },
    {
      name: "delivered",
      value: deliveries.filter((d) => d.status === "delivered").length,
      color: COLORS.primary,
    },
    { name: "approved", value: deliveries.filter((d) => d.status === "approved").length, color: COLORS.success },
    { name: "rejected", value: deliveries.filter((d) => d.status === "rejected").length, color: COLORS.danger },
  ]

  // NCE severity distribution
  const nceSeverityData = [
    { name: "Low", value: nces.filter((n) => n.severity === "low").length, color: COLORS.primary },
    { name: "Medium", value: nces.filter((n) => n.severity === "medium").length, color: COLORS.warning },
    { name: "Critical", value: nces.filter((n) => n.severity === "critical").length, color: COLORS.danger },
  ]

  // Survey scores over time (last 6 months)
  const surveyTrendData = surveys
    .filter((s) => s.score !== null)
    .reduce(
      (acc, survey) => {
        const month = new Date(survey.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        const existing = acc.find((item) => item.month === month)

        if (existing) {
          if (survey.survey_type === "nps") {
            existing.nps = (existing.nps * existing.npsCount + (survey.score || 0)) / (existing.npsCount + 1)
            existing.npsCount++
          } else {
            existing.csat = (existing.csat * existing.csatCount + (survey.score || 0)) / (existing.csatCount + 1)
            existing.csatCount++
          }
        } else {
          acc.push({
            month,
            nps: survey.survey_type === "nps" ? survey.score || 0 : 0,
            csat: survey.survey_type === "csat" ? survey.score || 0 : 0,
            npsCount: survey.survey_type === "nps" ? 1 : 0,
            csatCount: survey.survey_type === "csat" ? 1 : 0,
          })
        }
        return acc
      },
      [] as Array<{ month: string; nps: number; csat: number; npsCount: number; csatCount: number }>,
    )
    .slice(-6)

  const handleExport = () => {
    const data = {
      stats,
      deliveries: deliveryStatusData,
      nces: nceSeverityData,
      surveys: surveyTrendData,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card">
            <div className="flex h-16 items-center justify-between px-8">
              <h2 className="text-2xl font-bold text-foreground">Analytics & Reports</h2>
              <Button onClick={handleExport} variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="text-muted-foreground">Loading analytics...</div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Deliveries</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.total_deliveries}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {deliveries.filter((d) => d.status === "approved").length} Approved
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Open NCEs</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.open_nces}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((stats.open_nces / Math.max(stats.total_nces, 1)) * 100).toFixed(0)}% of total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Average NPS</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.avg_nps.toFixed(1)}</div>
                      <p className="text-xs text-muted-foreground mt-1">Net Promoter Score</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Average CSAT</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.avg_csat.toFixed(1)}</div>
                      <p className="text-xs text-muted-foreground mt-1">Customer Satisfaction</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Status Distribution</CardTitle>
                      <CardDescription>Current status of all deliveries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={deliveryStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {deliveryStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>NCE Severity Distribution</CardTitle>
                      <CardDescription>Breakdown of non-conformities by severity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={nceSeverityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill={COLORS.primary}>
                            {nceSeverityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 2 */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Survey Scores Trend</CardTitle>
                    <CardDescription>NPS and CSAT scores over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={surveyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="nps" stroke={COLORS.primary} strokeWidth={2} name="NPS" />
                        <Line type="monotone" dataKey="csat" stroke={COLORS.accent} strokeWidth={2} name="CSAT" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Approved Deliveries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-foreground">
                        {deliveries.filter((d) => d.status === "approved").length}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {(
                          (deliveries.filter((d) => d.status === "approved").length / Math.max(deliveries.length, 1)) *
                          100
                        ).toFixed(1)}
                        % completion rate
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-500" />
                        Delivered Deliveries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-foreground">
                        {deliveries.filter((d) => d.status === "delivered").length}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Active deliveries</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        Critical NCEs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-foreground">
                        {nces.filter((n) => n.severity === "critical").length}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Require immediate attention</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

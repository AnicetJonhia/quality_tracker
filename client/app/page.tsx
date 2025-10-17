"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingUp, Star } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import {RecentActivity} from "@/components/dashboard/recent-activity"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_deliveries: 0,
    total_nces: 0,
    open_nces: 0,
    avg_nps: 0,
    avg_csat: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error("[v0] Failed to load dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card">
            <div className="flex h-16 items-center px-8">
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-2">Welcome back</h3>
              <p className="text-muted-foreground">Here's an overview of your delivery management platform</p>
            </div>

            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Deliveries</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.total_deliveries}</div>
                      <p className="text-xs text-muted-foreground mt-1">All time deliveries</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Open NCEs</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.open_nces}</div>
                      <p className="text-xs text-muted-foreground mt-1">{stats.total_nces} total non-conformities</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Average NPS</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.avg_nps}</div>
                      <p className="text-xs text-muted-foreground mt-1">Net Promoter Score</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Average CSAT</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-foreground">{stats.avg_csat}</div>
                      <p className="text-xs text-muted-foreground mt-1">Customer Satisfaction</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest updates from your platform</CardDescription>
                    </CardHeader>
                    <RecentActivity />
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common tasks and operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4" >

                        <Link href={"/nce"} className="block " >
                            <button className="w-full cursor-pointer rounded-lg bg-primary px-4 py-3 text-left text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                             NCE
                          </button>
                        </Link>
                  
                        <Link href="/analytics" className="block ">
                           <button className="w-full cursor-pointer rounded-lg bg-accent px-4 py-3 text-left text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
                              View Analytics
                            </button>
                        </Link>
                       
                   
                      </div>
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

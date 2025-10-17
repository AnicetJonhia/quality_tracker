import * as React from "react"
import { api } from "@/lib/api"
import { Activity } from "@/lib/type"
import { CardContent } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

export function RecentActivity({ limit = 5 }: { limit?: number }) {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await api.getDashboardActivities({ limit })
        setActivities(data)
      } catch (err) {
        console.error("Failed to load activities:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [limit])

  return (
    <CardContent>
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          activities.map((a, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className={`h-2 w-2 mt-2 rounded-full ${a.color}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.name} - {formatDistanceToNow(new Date(a.date), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  )
}

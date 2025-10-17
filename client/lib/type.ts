
export interface Client {
  id: number
  full_name: string | null
  email: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  client?: Client
  created_at: string
}

export interface Delivery {
  id: number
  project: Project
  title: string
  description: string | null
  status: string
  version: number
  created_at: string
  delivered_at: string | null
}

export interface FileItem {
  id: number
  filename: string
  storage_key: string
  uploaded_at: string
}

export interface NCE {
  id: number
  delivery : Delivery
  title: string
  description: string
  severity: string
  status: string
  category: string
  created_at: string
  resolved_at: string | null
  files: FileItem[]
}

export interface Survey {
  id: number
  delivery: Delivery
  survey_type: string
  score: number | null
  comment: string | null
  sent_at: string
  completed_at: string | null
}

export interface DashboardStats {
  total_deliveries: number
  total_nces: number
  open_nces: number
  avg_nps: number
  avg_csat: number
}

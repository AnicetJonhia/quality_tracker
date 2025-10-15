import { getAuthHeaders } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  // Projects
  getProjects: () => fetchAPI("/api/projects"),
  getProject: (id: number) => fetchAPI(`/api/projects/${id}`),
  createProject: (data: any) =>
    fetchAPI("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Deliveries
  getDeliveries: () => fetchAPI("/api/deliveries"),
  getDelivery: (id: number) => fetchAPI(`/api/deliveries/${id}`),
  createDelivery: (data: any) =>
    fetchAPI("/api/deliveries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDeliveryStatus: (id: number, status: string) =>
    fetchAPI(`/api/deliveries/${id}/status?status=${status}`, {
      method: "PUT",
    }),

  // NCEs
  getNCEs: () => fetchAPI("/api/nces"),
  getNCE: (id: number) => fetchAPI(`/api/nces/${id}`),
  createNCE: (data: any) =>
    fetchAPI("/api/nces", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  

  updateNCE: (id: number, data: { status?: string; severity?: string; category?: string }) =>
  fetchAPI(`/api/nces/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),


  // Surveys
  getSurveys: () => fetchAPI("/api/surveys"),
  createSurvey: (data: any) =>
    fetchAPI("/api/surveys", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboardStats: () => fetchAPI("/api/dashboard/stats"),
}

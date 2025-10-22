import { get } from "http"
import { getAuthHeaders , getAuthHeadersMultipart} from "./auth"
import {
  Project, GetProjectsParams, Client, Delivery,GetDeliveriesParams, GetActivitiesParams,Activity,
  NCE, GetNCEsParams
} from "@/lib/type"


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

  // Users
  getClients: async (params?: { skip?: number; limit?: number }): Promise<Client[]> => {
    // Supprimer toutes les clés undefined ou vides
    const cleanParams: Record<string, string> = {}
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = String(value)
        }
      })
    }

    const query = new URLSearchParams(cleanParams).toString()
    const res = await fetchAPI(`/api/clients${query ? `?${query}` : ""}`)
    return res
  },


  //getUser: (id: number) => fetchAPI(`/api/users/${id}`),
 

  // Projects
  
  getProjects: async (params?: GetProjectsParams): Promise<Project[]> => {
    // Supprimer toutes les clés undefined ou vides
    const cleanParams: Record<string, string> = {}
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = String(value)
        }
      })
    }
    const query = new URLSearchParams(cleanParams).toString()
    const res = await fetchAPI(`/api/projects${query ? `?${query}` : ""}`)
    return res
  },

  getProject: (id: number) => fetchAPI(`/api/projects/${id}`),
  createProject: (data: any) =>
    fetchAPI("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Deliveries
  getDeliveries: async (params?: GetDeliveriesParams): Promise<{ deliveries: Delivery[]; total_count: number }> => {
    const cleanParams: Record<string, string> = {}
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = String(value)
        }
      })
    }

    const query = new URLSearchParams(cleanParams).toString()
    const res = await fetchAPI(`/api/deliveries${query ? `?${query}` : ""}`)
    return res
  },

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


  // --- FILES ---
  uploadDeliveryFiles: async (deliveryId: number, files: File[]) => {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))

    const response = await fetch(`${API_BASE_URL}/api/deliveries/${deliveryId}/files/`, {
      method: "POST",
      headers: {
        ...getAuthHeadersMultipart(), 
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`)
    }

    return response.json()
  },

  downloadDeliveryFile: async (deliveryId: number, fileId: number) => {
    const res = await fetch(`${API_BASE_URL}/api/deliveries/${deliveryId}/files/${fileId}/download`, {
      headers: getAuthHeaders(),  // token si nécessaire
    })
    if (!res.ok) throw new Error("Download failed")

    const blob = await res.blob()
    return blob
  },



  getDeliveryFiles: (deliveryId: number) =>
    fetchAPI(`/api/deliveries/${deliveryId}/files/`),

  deleteDeliveryFile: (deliveryId: number, fileId: number) =>
    fetchAPI(`/api/deliveries/${deliveryId}/files/${fileId}`, { method: "DELETE" }),


  // NCEs
  getNCEs : async (
      params?: GetNCEsParams
    ): Promise<{ nces: NCE[]; total_count?: number }> => {
      const cleanParams: Record<string, string> = {};
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            cleanParams[key] = String(value);
          }
        });
      }
      
      const query = new URLSearchParams(cleanParams).toString();
      const res = await fetchAPI(`/api/nces${query ? `?${query}` : ""}`);
      
      return res;
    },

  getNCE: (id: number) => fetchAPI(`/api/nces/${id}`),
  createNCE: async (data: { delivery_id: number; title: string; description: string; files?: File[] }) => {
    const formData = new FormData()
    formData.append("delivery_id", data.delivery_id.toString())
    formData.append("title", data.title)
    formData.append("description", data.description)

    if (data.files) {
      data.files.forEach((file) => formData.append("files", file, file.name))
    }

    


    const response = await fetch(`${API_BASE_URL}/api/nces`, {
      method: "POST",
      headers: {
        ...getAuthHeadersMultipart(), // gère token si nécessaire
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`NCE creation failed: ${response.statusText}`)
    }

    return response.json()
  },
  

  updateNCE: (id: number, data: { status?: string; severity?: string; category?: string }) =>
  fetchAPI(`/api/nces/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),

  downloadNCEFile: async (nceId: number, fileId: number) => {
    const res = await fetch(`${API_BASE_URL}/api/nces/${nceId}/files/${fileId}/download`, {
      headers: getAuthHeaders(), // token si nécessaire
    })
    if (!res.ok) throw new Error("Download failed")

    const blob = await res.blob()
    return blob
  },



  // Surveys
  getSurveys: () => fetchAPI("/api/surveys"),
  createSurvey: (data: any) =>
    fetchAPI("/api/surveys", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboardStats: () => fetchAPI("/api/dashboard/stats"),
  
  getDashboardActivities: async (
    params?: GetActivitiesParams
  ): Promise<Activity[]> => {
    const cleanParams: Record<string, string> = {}
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanParams[key] = String(value)
        }
      })
    }

    const query = new URLSearchParams(cleanParams).toString()
    const res = await fetchAPI(`/api/dashboard/activities${query ? `?${query}` : ""}`)
    return res
  }
}

"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: number
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "auth-storage",
    },
  ),
)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Login failed")
  }

  const data = await response.json()
  useAuthStore.getState().setAuth(data.user, data.access_token)
  return data
}

export async function register(email: string, password: string, full_name: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, full_name, role: "user" }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || "Registration failed")
  }

  const data = await response.json()
  useAuthStore.getState().setAuth(data.user, data.access_token)
  return data
}

export async function getCurrentUser() {
  const token = useAuthStore.getState().token
  if (!token) return null

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    useAuthStore.getState().logout()
    return null
  }

  return response.json()
}

export function getAuthHeaders() {
  const token = useAuthStore.getState().token
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

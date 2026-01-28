const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api"

export const api = {
  // Chat
  chat: async (messages: any[], max_tokens = 2048, temperature = 0.7) => {
    return fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, max_tokens, temperature }),
    })
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`)
    return res.json()
  },

  updateSettings: async (settings: any) => {
    const res = await fetch(`${API_BASE}/settings/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    })
    return res.json()
  },

  // Models
  listModels: async () => {
    const res = await fetch(`${API_BASE}/models`)
    return res.json()
  },

  downloadModel: async (repo_id: string, filename: string) => {
    const res = await fetch(`${API_BASE}/models/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id, filename }),
    })
    return res.json()
  },

  getDownloadStatus: async (taskId: string) => {
    const res = await fetch(`${API_BASE}/models/download/${taskId}`)
    return res.json()
  },
}

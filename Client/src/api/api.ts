const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api"

export const api = {
  // Chat
  chat: async (
    messages: any[],
    max_tokens = 2048,
    temperature = 0.7,
    web_search = false,
    session_id = "default_session",
  ) => {
    return fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        max_tokens,
        temperature,
        web_search,
        session_id,
      }),
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

  // Memory
  clearMemory: async (session_id?: string) => {
    const url = session_id
      ? `${API_BASE}/memory/clear?session_id=${session_id}`
      : `${API_BASE}/memory/clear`

    const res = await fetch(url, {
      method: "DELETE",
    })
    return res.json()
  },

  // Health Check
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`)
      // If we get a response (even 401/403), the server is up.
      // Ideally use a dedicated health endpoint but settings is fine for now ensuring DB connection etc if needed.
      return res.ok
    } catch (e) {
      return false
    }
  },
}

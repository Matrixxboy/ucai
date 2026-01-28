import { useState } from "react"
import {
  ArrowLeft,
  Trash2,
  Database,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { api } from "../api/api"

export default function ControlMemory() {
  const [sessionId, setSessionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{
    text: string
    type: "success" | "error"
  } | null>(null)

  const handleClear = async (specificSession: boolean) => {
    if (
      !confirm(
        specificSession
          ? "Clear memory for this session?"
          : "WARNING: This will wipe ALL memory data. Are you sure?",
      )
    ) {
      return
    }

    setLoading(true)
    setMsg(null)
    try {
      const id = specificSession ? sessionId : undefined
      const data = await api.clearMemory(id)

      if (data.success) {
        setMsg({ text: data.message, type: "success" })
        if (!specificSession) setSessionId("") // Clear input on global wipe
      } else {
        setMsg({ text: data.message, type: "error" })
      }
    } catch (e) {
      setMsg({ text: "Failed to connect to server.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#e7e5e4] font-sans selection:bg-[#a8a29e] selection:text-[#0c0a09] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#292524]/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#44403c]/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-3xl mx-auto p-6 relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <a
            href="/settings"
            className="p-2 rounded-full hover:bg-[#1c1917] text-[#78716c] hover:text-[#d6d3d1] transition-colors"
          >
            <ArrowLeft size={24} />
          </a>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#e7e5e4] to-[#a8a29e]">
              Control Memory
            </h1>
            <p className="text-[#78716c] text-sm mt-1">
              Manage and wipe AI memory data
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Session Wipe */}
          <section className="bg-[#1c1917]/50 backdrop-blur-md border border-[#292524] rounded-2xl p-6 shadow-xl transition-all hover:border-[#44403c]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#292524] rounded-lg text-[#d6d3d1]">
                <Database size={20} />
              </div>
              <h2 className="text-xl font-semibold text-[#d6d3d1]">
                Clear Session Memory
              </h2>
            </div>
            <p className="text-sm text-[#78716c] mb-6">
              Enter a specific Session ID to remove its history from the
              database.
            </p>
            <div className="flex gap-4">
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter Session ID..."
                className="flex-1 bg-[#0c0a09] border border-[#292524] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#57534e] transition-colors text-[#d6d3d1]"
              />
              <button
                onClick={() => handleClear(true)}
                disabled={!sessionId || loading}
                className="px-6 py-3 bg-[#e7e5e4] text-[#0c0a09] rounded-lg font-bold hover:bg-[#d6d3d1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Clear Session"
                )}
              </button>
            </div>
          </section>

          {/* Global Wipe */}
          <section className="bg-red-950/20 backdrop-blur-md border border-red-900/30 rounded-2xl p-6 shadow-xl transition-all hover:border-red-900/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-900/20 rounded-lg text-red-400">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-xl font-semibold text-red-400">
                Factory Reset
              </h2>
            </div>
            <p className="text-sm text-red-200/60 mb-6">
              This action will permanently delete <strong>ALL</strong>{" "}
              conversation history and memory vectors. This cannot be undone.
            </p>
            <button
              onClick={() => handleClear(false)}
              disabled={loading}
              className="w-full py-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-lg font-bold hover:bg-red-900/40 hover:text-red-300 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              {loading ? "Wiping Data..." : "Delete Everything"}
            </button>
          </section>

          {msg && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${msg.type === "success" ? "bg-green-900/20 text-green-400 border border-green-900/50" : "bg-red-900/20 text-red-400 border border-red-900/50"}`}
            >
              {msg.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

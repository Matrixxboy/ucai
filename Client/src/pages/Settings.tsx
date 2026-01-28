import { useState, useEffect } from "react"
import {
  ArrowLeft,
  Cpu,
  Download,
  Settings as SettingsIcon,
  Database,
  Save,
  Info,
  CheckCircle,
  Loader2,
  Terminal,
} from "lucide-react"
import { api } from "../api/api.ts"

interface SettingsState {
  model_path: string
  n_ctx: number
  n_gpu_layers: number
  verbose: boolean
  system_prompt: string
  rag_enabled: boolean
}

interface DownloadTask {
  status: string
  repo_id: string
  filename: string
  progress: number
  error?: string
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsState>({
    model_path: "",
    n_ctx: 2048,
    n_gpu_layers: 0,
    verbose: true,
    system_prompt: "",
    rag_enabled: true,
  })
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  // Model Manager State
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [scanMsg, setScanMsg] = useState("")
  const [downloadRepo, setDownloadRepo] = useState("")
  const [downloadFile, setDownloadFile] = useState("")
  const [downloadTaskId, setDownloadTaskId] = useState<string | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<DownloadTask | null>(
    null,
  )
  const [isCustomPath, setIsCustomPath] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchModels()
  }, [])

  // Poll for download status
  useEffect(() => {
    let interval: any
    if (downloadTaskId) {
      interval = setInterval(async () => {
        try {
          const data = await api.getDownloadStatus(downloadTaskId)
          if (data.data) {
            setDownloadStatus(data.data)
            if (
              data.data.status === "completed" ||
              data.data.status === "failed"
            ) {
              setDownloadTaskId(null)
              fetchModels() // Refresh list on completion
            }
          }
        } catch (e) {
          console.error("Polling error", e)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [downloadTaskId])

  const fetchSettings = () => {
    api
      .getSettings()
      .then((data: any) => {
        if (data.data) {
          setStatus(data.data)
          if (data.data.config && Object.keys(data.data.config).length > 0) {
            setSettings((prev) => ({
              ...prev,
              ...data.data.config,
              rag_enabled:
                data.data.config.rag_enabled !== undefined
                  ? data.data.config.rag_enabled
                  : true,
              model_path: data.data.model_path || "",
            }))
            // Check if current path is not in list (roughly)
            if (
              data.data.model_path &&
              !data.data.model_path.includes("Models")
            ) {
              setIsCustomPath(true)
            }
          }
        }
      })
      .catch((err: any) => console.error("Failed to fetch settings", err))
  }

  const fetchModels = () => {
    api
      .listModels()
      .then((data: any) => {
        if (data.success) {
          setAvailableModels(data.data)
        } else {
          setScanMsg("No models found in Global Storage (~/.ucai/models)")
        }
      })
      .catch(() => setScanMsg("Failed to scan models"))
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked

    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }))
  }

  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === "custom") {
      setIsCustomPath(true)
      setSettings((prev) => ({ ...prev, model_path: "" }))
    } else {
      setIsCustomPath(false)
      setSettings((prev) => ({ ...prev, model_path: val }))
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMsg("")
    try {
      const data = await api.updateSettings(settings)
      if (data.success) {
        setMsg("Model loaded successfully!")
        setStatus(data.data)
      } else {
        setMsg(`Error: ${data.message}`)
      }
    } catch (error) {
      setMsg("Failed to connect to server.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!downloadRepo || !downloadFile) return
    try {
      const data = await api.downloadModel(downloadRepo, downloadFile)
      if (data.success) {
        setDownloadTaskId(data.data.task_id)
        setDownloadStatus({
          status: "pending",
          repo_id: downloadRepo,
          filename: downloadFile,
          progress: 0,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadPreset = (repo: string, file: string) => {
    setDownloadRepo(repo)
    setDownloadFile(file)
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#e7e5e4] font-sans selection:bg-[#a8a29e] selection:text-[#0c0a09] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#292524]/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#44403c]/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-5xl mx-auto p-6 relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <a
            href="/chat"
            className="p-2 rounded-full hover:bg-[#1c1917] text-[#78716c] hover:text-[#d6d3d1] transition-colors"
          >
            <ArrowLeft size={24} />
          </a>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#e7e5e4] to-[#a8a29e]">
              Settings
            </h1>
            <p className="text-[#78716c] text-sm mt-1">
              Configure your local AI environment
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Model Management Section */}
          <section className="bg-[#1c1917]/50 backdrop-blur-md border border-[#292524] rounded-2xl p-6 shadow-xl transition-all hover:border-[#44403c]">
            <div className="flex items-center gap-3 mb-6 border-b border-[#292524] pb-4">
              <div className="p-2 bg-[#292524] rounded-lg text-[#d6d3d1]">
                <Cpu size={20} />
              </div>
              <h2 className="text-xl font-semibold text-[#d6d3d1]">
                Model Management
              </h2>
            </div>

            <div className="space-y-6">
              {/* Current Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a8a29e] uppercase tracking-wide">
                    Current Model Path
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={isCustomPath ? "custom" : settings.model_path}
                      onChange={handleModelSelect}
                      className="flex-1 bg-[#0c0a09] border border-[#292524] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#57534e] transition-colors text-[#d6d3d1] appearance-none"
                    >
                      <option value="" disabled>
                        -- Select a Model --
                      </option>
                      {availableModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="custom">Custom Path...</option>
                    </select>
                  </div>
                  {isCustomPath && (
                    <input
                      type="text"
                      name="model_path"
                      value={settings.model_path}
                      onChange={handleChange}
                      placeholder="C:/Absolute/Path/To/Model.gguf"
                      className="mt-2 w-full bg-[#0c0a09] border border-[#292524] rounded-lg px-4 py-3 focus:outline-none focus:border-[#57534e] transition-all placeholder-[#44403c] text-[#d6d3d1] font-mono text-sm"
                    />
                  )}
                  <p className="text-xs text-[#57534e] flex items-center gap-1 mt-1">
                    <Info size={12} />
                    Models found in ~/.ucai/models:{" "}
                    <span className="text-[#d6d3d1]">
                      {availableModels.length}
                    </span>
                    <button
                      onClick={fetchModels}
                      className="ml-2 text-[#78716c] hover:text-[#a8a29e] underline decoration-dotted"
                    >
                      Refresh
                    </button>
                  </p>
                </div>

                {/* Download Model */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a8a29e] uppercase tracking-wide">
                    Download Model (HuggingFace)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={downloadRepo}
                      onChange={(e) => setDownloadRepo(e.target.value)}
                      placeholder="user/repo-name"
                      className="flex-1 bg-[#0c0a09] border border-[#292524] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#57534e] transition-colors placeholder-[#44403c]"
                    />
                    <input
                      type="text"
                      value={downloadFile}
                      onChange={(e) => setDownloadFile(e.target.value)}
                      placeholder="model.gguf"
                      className="w-1/3 bg-[#0c0a09] border border-[#292524] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#57534e] transition-colors placeholder-[#44403c]"
                    />
                    <button
                      onClick={handleDownload}
                      disabled={!!downloadTaskId}
                      className={`px-4 py-2 rounded-lg transition-colors border border-[#292524] flex items-center justify-center ${
                        downloadTaskId
                          ? "bg-[#292524] text-[#78716c] cursor-not-allowed"
                          : "bg-[#1c1917] text-[#d6d3d1] hover:bg-[#292524] hover:text-[#e7e5e4]"
                      }`}
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pre-sets */}
              <div className="bg-[#292524]/30 rounded-lg p-4 border border-[#44403c]/50">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#78716c] mb-3">
                  Quick Presets
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      loadPreset(
                        "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
                        "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
                      )
                    }
                    className="px-3 py-1.5 bg-[#1c1917] border border-[#44403c] text-[#d6d3d1] text-xs hover:border-[#78716c] rounded-md transition-colors"
                  >
                    TinyLlama (1.1B)
                  </button>
                  <button
                    onClick={() =>
                      loadPreset(
                        "TheBloke/Mistral-7B-Instruct-v0.2-GGUF",
                        "mistral-7b-instruct-v0.2.Q4_K_M.gguf",
                      )
                    }
                    className="px-3 py-1.5 bg-[#1c1917] border border-[#44403c] text-[#d6d3d1] text-xs hover:border-[#78716c] rounded-md transition-colors"
                  >
                    Mistral (7B)
                  </button>
                </div>
              </div>

              {downloadStatus && (
                <div className="bg-[#292524]/50 rounded-lg p-4 border border-[#44403c]/50 animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#d6d3d1] flex items-center gap-2">
                      {downloadStatus.status === "completed" ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Loader2
                          size={16}
                          className="animate-spin text-[#a8a29e]"
                        />
                      )}
                      {downloadStatus.status === "completed"
                        ? "Download Complete"
                        : "Downloading..."}
                    </span>
                    <span className="text-xs text-[#a8a29e] font-mono">
                      {downloadStatus.progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-[#0c0a09] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#a8a29e] to-[#e7e5e4] h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${downloadStatus.progress}%` }}
                    ></div>
                  </div>
                  {downloadStatus.error && (
                    <p className="text-xs text-red-400 mt-2">
                      {downloadStatus.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Parameters Section */}
          <section className="bg-[#1c1917]/50 backdrop-blur-md border border-[#292524] rounded-2xl p-6 shadow-xl transition-all hover:border-[#44403c]">
            <div className="flex items-center gap-3 mb-6 border-b border-[#292524] pb-4">
              <div className="p-2 bg-[#292524] rounded-lg text-[#d6d3d1]">
                <SettingsIcon size={20} />
              </div>
              <h2 className="text-xl font-semibold text-[#d6d3d1]">
                Inference Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-[#a8a29e]">
                    Temperature
                  </label>
                  <span className="text-sm font-mono text-[#d6d3d1] bg-[#292524] px-2 rounded">
                    {settings.verbose}
                  </span>
                </div>
                {/* Note: Temperature slider logic was missing in state, assuming default for now or adding later. Keeping simple input. */}
                <div className="p-4 bg-[#292524]/30 rounded text-xs text-[#78716c]">
                  Advanced parameters are auto-configured by the selected model.
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  name="verbose"
                  checked={settings.verbose}
                  onChange={handleChange}
                  className="w-4 h-4 rounded-sm border-[#44403c] bg-[#0c0a09] text-[#78716c] focus:ring-0 focus:ring-offset-0 accent-[#a8a29e]"
                />
                <label className="text-sm text-[#a8a29e] tracking-wide">
                  Enable Verbose Logging
                </label>
              </div>
            </div>
          </section>

          {/* Memory Section */}
          <section className="bg-[#1c1917]/50 backdrop-blur-md border border-[#292524] rounded-2xl p-6 shadow-xl transition-all hover:border-[#44403c]">
            <div className="flex items-center gap-3 mb-6 border-b border-[#292524] pb-4">
              <div className="p-2 bg-[#292524] rounded-lg text-[#d6d3d1]">
                <Database size={20} />
              </div>
              <h2 className="text-xl font-semibold text-[#d6d3d1]">
                Long Term Memory (RAG)
              </h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[#e7e5e4]">
                  Enable Vector Memory
                </h3>
                <p className="text-xs text-[#78716c]">
                  Allows the AI to remember past conversations using ChromaDB.
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    rag_enabled: !prev.rag_enabled,
                  }))
                }
                className="w-12 h-6 bg-[#292524] rounded-full relative transition-colors data-[state=on]:bg-green-600 shadow-inner"
                data-state={settings.rag_enabled ? "on" : "off"}
              >
                <div className="w-4 h-4 bg-[#e7e5e4] rounded-full absolute top-1 left-1 transition-transform data-[state=on]:translate-x-6 shadow-sm"></div>
              </button>
            </div>
          </section>

          {/* System Prompt Section */}
          <section className="bg-[#1c1917]/50 backdrop-blur-md border border-[#292524] rounded-2xl p-6 shadow-xl transition-all hover:border-[#44403c]">
            <div className="flex items-center gap-3 mb-6 border-b border-[#292524] pb-4">
              <div className="p-2 bg-[#292524] rounded-lg text-[#d6d3d1]">
                <Terminal size={20} />
              </div>
              <h2 className="text-xl font-semibold text-[#d6d3d1]">
                System Prompt
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-[#78716c]">
                Define the AI's personality and instructions. This is injected
                at the start of every conversation.
              </p>
              <textarea
                name="system_prompt"
                value={settings.system_prompt}
                onChange={handleChange}
                rows={6}
                placeholder="You are a helpful AI assistant..."
                className="w-full bg-[#0c0a09] border border-[#292524] rounded-lg p-4 focus:outline-none focus:border-[#57534e] text-[#d6d3d1] font-mono text-sm leading-relaxed resize-y"
              />
            </div>
          </section>

          <div className="flex justify-end pt-4 gap-4 items-center">
            {msg && (
              <span
                className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-green-400"}`}
              >
                {msg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-[#e7e5e4] text-[#0c0a09] rounded-full font-bold shadow-lg hover:bg-[#d6d3d1] hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

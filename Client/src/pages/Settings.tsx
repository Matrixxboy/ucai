import { useState, useEffect } from "react"
import { api } from "../api/api.ts"

interface SettingsState {
  model_path: string
  n_ctx: number
  n_gpu_layers: number
  verbose: boolean
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
    <div className="p-8 text-[#e7e5e4] max-w-5xl mx-auto min-h-screen bg-[#1c1917] font-sans flex flex-col md:flex-row gap-8">
      {/* LEFT COLUMN: CONFIGURATION */}
      <div className="flex-1 space-y-8">
        <div className="mb-6 border-b border-[#292524] pb-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-light text-[#d6d3d1] tracking-wider">
              Configuration
            </h1>
            <a
              href="/chat"
              className="text-[#a8a29e] hover:text-[#d6d3d1] text-sm uppercase tracking-widest font-bold"
            >
              Back to Chat &rarr;
            </a>
          </div>
          <p className="text-[#78716c] text-sm">
            Manage your local LLM engine parameters.
          </p>
        </div>

        {/* Engine Status */}
        <div className="flex items-center justify-between p-5 bg-[#292524]/50 border border-[#44403c] rounded-sm">
          <span className="text-[#a8a29e] font-medium tracking-wide">
            Engine Status
          </span>
          <span
            className={`px-4 py-1.5 rounded-sm text-xs font-bold tracking-widest uppercase ${status?.loaded ? "bg-[#44403c] text-[#d6d3d1] border border-[#57534e]" : "bg-[#292524] text-[#78716c] border border-[#44403c]"}`}
          >
            {status?.loaded ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Model Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#78716c]">
            Select Model
          </label>
          <select
            value={isCustomPath ? "custom" : settings.model_path}
            onChange={handleModelSelect}
            className="w-full bg-[#0c0a09] border border-[#292524] rounded-sm px-5 py-4 focus:outline-none focus:border-[#57534e] transition-all text-[#d6d3d1] font-mono text-sm appearance-none"
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

          {isCustomPath && (
            <input
              type="text"
              name="model_path"
              value={settings.model_path}
              onChange={handleChange}
              placeholder="C:/Absolute/Path/To/Model.gguf"
              className="mt-2 w-full bg-[#0c0a09] border border-[#292524] rounded-sm px-5 py-4 focus:outline-none focus:border-[#57534e] transition-all placeholder-[#44403c] text-[#d6d3d1] font-mono text-sm"
            />
          )}
          <div className="flex justify-between text-xs text-[#57534e]">
            <span>
              Models found in ~/.ucai/models: {availableModels.length}
            </span>
            <button
              onClick={fetchModels}
              className="text-[#78716c] hover:text-[#a8a29e]"
            >
              Refresh List
            </button>
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#78716c]">
              Context Window
            </label>
            <input
              type="number"
              name="n_ctx"
              value={settings.n_ctx}
              onChange={handleChange}
              className="w-full bg-[#0c0a09] border border-[#292524] rounded-sm px-5 py-4 focus:outline-none focus:border-[#57534e] text-[#d6d3d1]"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#78716c]">
              GPU Layers
            </label>
            <input
              type="number"
              name="n_gpu_layers"
              value={settings.n_gpu_layers}
              onChange={handleChange}
              className="w-full bg-[#0c0a09] border border-[#292524] rounded-sm px-5 py-4 focus:outline-none focus:border-[#57534e] text-[#d6d3d1]"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <input
            type="checkbox"
            name="verbose"
            checked={settings.verbose}
            onChange={handleChange}
            className="w-4 h-4 rounded-sm border-[#44403c] bg-[#0c0a09] text-[#78716c] focus:ring-0 focus:ring-offset-0"
          />
          <label className="text-sm text-[#a8a29e] tracking-wide">
            Enable Verbose Logging
          </label>
        </div>

        {/* load Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full py-4 rounded-sm font-semibold text-sm tracking-widest uppercase transition-all ${
              loading
                ? "bg-[#292524] text-[#57534e] cursor-not-allowed"
                : "bg-[#44403c] text-[#d6d3d1] hover:bg-[#57534e] hover:text-[#f5f5f4]"
            }`}
          >
            {loading ? "Initializing..." : "Load Model Engine"}
          </button>
        </div>
        {msg && (
          <div
            className={`p-4 rounded-sm text-center text-sm font-medium tracking-wide ${msg.includes("Error") || msg.includes("Failed") ? "text-red-400 bg-red-900/10 border border-red-900/20" : "text-[#78716c] bg-[#292524] border border-[#44403c]"}`}
          >
            {msg}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: DOWNLOAD MANAGER */}
      <div className="w-full md:w-1/3 space-y-8 border-l border-[#292524] pl-0 md:pl-8">
        <div className="mb-6 border-b border-[#292524] pb-4">
          <h2 className="text-xl font-light text-[#d6d3d1] tracking-wider mb-2">
            Download Models
          </h2>
          <p className="text-[#78716c] text-sm">
            Fetch new GGUF models from Hugging Face.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#292524]/30 rounded-sm border border-[#44403c]">
            <h3 className="text-[#a8a29e] text-xs font-bold uppercase tracking-widest mb-3">
              Quick Presets
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  loadPreset(
                    "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
                    "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
                  )
                }
                className="px-3 py-2 bg-[#1c1917] border border-[#44403c] text-[#d6d3d1] text-xs hover:border-[#78716c]"
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
                className="px-3 py-2 bg-[#1c1917] border border-[#44403c] text-[#d6d3d1] text-xs hover:border-[#78716c]"
              >
                Mistral (7B)
              </button>
              <button
                onClick={() =>
                  loadPreset(
                    "TheBloke/Llama-2-7B-Chat-GGUF",
                    "llama-2-7b-chat.Q4_K_M.gguf",
                  )
                }
                className="px-3 py-2 bg-[#1c1917] border border-[#44403c] text-[#d6d3d1] text-xs hover:border-[#78716c]"
              >
                Llama 2 (7B)
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#78716c]">
              Repo ID
            </label>
            <input
              type="text"
              value={downloadRepo}
              onChange={(e) => setDownloadRepo(e.target.value)}
              placeholder="TheBloke/Mistral-7B..."
              className="w-full bg-[#0c0a09] border border-[#292524] rounded-sm px-4 py-3 focus:outline-none focus:border-[#57534e] text-[#d6d3d1] text-sm"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#78716c]">
              Filename
            </label>
            <input
              type="text"
              value={downloadFile}
              onChange={(e) => setDownloadFile(e.target.value)}
              placeholder="model.Q4_K_M.gguf"
              className="w-full bg-[#0c0a09] border border-[#292524] rounded-sm px-4 py-3 focus:outline-none focus:border-[#57534e] text-[#d6d3d1] text-sm"
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={!!downloadTaskId}
            className={`w-full py-3 rounded-sm font-semibold text-sm tracking-widest uppercase transition-all ${
              downloadTaskId
                ? "bg-[#292524] text-[#57534e] cursor-not-allowed"
                : "bg-[#44403c] text-[#d6d3d1] hover:bg-[#57534e]"
            }`}
          >
            {downloadTaskId ? "Downloading..." : "Start Download"}
          </button>

          {downloadStatus && (
            <div className="mt-4 p-4 bg-[#0c0a09] border border-[#292524] rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#a8a29e] text-xs uppercase">Status</span>
                <span
                  className={`text-xs font-bold uppercase ${downloadStatus.status === "failed" ? "text-red-400" : "text-[#d6d3d1]"}`}
                >
                  {downloadStatus.status}
                </span>
              </div>
              <p className="text-xs text-[#57534e] truncate mb-2">
                {downloadStatus.filename}
              </p>
              {downloadStatus.status === "downloading" && (
                <div className="w-full bg-[#292524] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#a8a29e] h-full animate-pulse w-full"></div>
                </div>
              )}
              {downloadStatus.error && (
                <p className="text-xs text-red-400 mt-2">
                  {downloadStatus.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
